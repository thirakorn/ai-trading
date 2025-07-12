import {
  IChartApi,
  ISeriesApi,
  Time,
  SeriesType,
  IPriceLine,
} from 'lightweight-charts';
import { ProcessedCandle } from './binance';

// Volume Profile Data Structures
export interface VolumeAtPrice {
  price: number;
  volume: number;
}

export interface VolumeProfileData {
  time: Time;
  profile: VolumeAtPrice[];
  width: number;
  maxVolume: number;
  pointOfControl: number; // Price with highest volume
  valueAreaHigh: number;
  valueAreaLow: number;
}

export interface VolumeProfileOptions {
  numberOfLevels: number;
  width: number;
  color: string;
  opacity: number;
  showPOC: boolean;
  showValueArea: boolean;
}

// Volume Profile Calculator
export class VolumeProfileCalculator {
  static calculateVolumeProfile(
    candles: ProcessedCandle[],
    options: VolumeProfileOptions
  ): VolumeProfileData | null {
    if (candles.length === 0) return null;

    // Find price range
    const prices = candles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return null;

    // Create price levels
    const levelSize = priceRange / options.numberOfLevels;
    const volumeMap = new Map<number, number>();

    // Initialize all price levels
    for (let i = 0; i < options.numberOfLevels; i++) {
      const price = minPrice + (i * levelSize);
      volumeMap.set(price, 0);
    }

    // Distribute volume across price levels for each candle
    candles.forEach(candle => {
      const candleRange = candle.high - candle.low;
      if (candleRange === 0) {
        // If no range, put all volume at close price
        const level = this.findPriceLevel(candle.close, minPrice, levelSize);
        const currentVolume = volumeMap.get(level) || 0;
        volumeMap.set(level, currentVolume + candle.volume);
      } else {
        // Distribute volume proportionally across the candle's price range
        for (let i = 0; i < options.numberOfLevels; i++) {
          const levelPrice = minPrice + (i * levelSize);
          const levelLow = levelPrice;
          const levelHigh = levelPrice + levelSize;
          
          // Calculate overlap between candle range and price level
          const overlapLow = Math.max(candle.low, levelLow);
          const overlapHigh = Math.min(candle.high, levelHigh);
          
          if (overlapLow < overlapHigh) {
            const overlapRange = overlapHigh - overlapLow;
            const volumeRatio = overlapRange / candleRange;
            const volumeForLevel = candle.volume * volumeRatio;
            
            const currentVolume = volumeMap.get(levelPrice) || 0;
            volumeMap.set(levelPrice, currentVolume + volumeForLevel);
          }
        }
      }
    });

    // Convert to array and sort by price
    const profile: VolumeAtPrice[] = Array.from(volumeMap.entries())
      .map(([price, volume]) => ({ price, volume }))
      .sort((a, b) => a.price - b.price)
      .filter(item => item.volume > 0);

    if (profile.length === 0) return null;

    // Find Point of Control (highest volume)
    const maxVolume = Math.max(...profile.map(p => p.volume));
    const pointOfControl = profile.find(p => p.volume === maxVolume)?.price || minPrice;

    // Calculate Value Area (70% of total volume)
    const totalVolume = profile.reduce((sum, p) => sum + p.volume, 0);
    const targetVolume = totalVolume * 0.7;
    
    const { valueAreaHigh, valueAreaLow } = this.calculateValueArea(profile, pointOfControl, targetVolume);

    // Use the last candle's time
    const time = candles[candles.length - 1].time as Time;

    return {
      time,
      profile,
      width: options.width,
      maxVolume,
      pointOfControl,
      valueAreaHigh,
      valueAreaLow
    };
  }

  private static findPriceLevel(price: number, minPrice: number, levelSize: number): number {
    const levelIndex = Math.floor((price - minPrice) / levelSize);
    return minPrice + (levelIndex * levelSize);
  }

  private static calculateValueArea(
    profile: VolumeAtPrice[],
    poc: number,
    targetVolume: number
  ): { valueAreaHigh: number; valueAreaLow: number } {
    // Sort profile by price to find POC index
    const sortedProfile = [...profile].sort((a, b) => a.price - b.price);
    const pocIndex = sortedProfile.findIndex(p => p.price === poc);
    
    if (pocIndex === -1) {
      return {
        valueAreaHigh: profile[profile.length - 1].price,
        valueAreaLow: profile[0].price
      };
    }

    let accumulatedVolume = sortedProfile[pocIndex].volume;
    let lowIndex = pocIndex;
    let highIndex = pocIndex;

    // Expand around POC until we reach 70% of volume
    while (accumulatedVolume < targetVolume && (lowIndex > 0 || highIndex < sortedProfile.length - 1)) {
      const volumeBelow = lowIndex > 0 ? sortedProfile[lowIndex - 1].volume : 0;
      const volumeAbove = highIndex < sortedProfile.length - 1 ? sortedProfile[highIndex + 1].volume : 0;

      if (volumeBelow >= volumeAbove && lowIndex > 0) {
        lowIndex--;
        accumulatedVolume += sortedProfile[lowIndex].volume;
      } else if (highIndex < sortedProfile.length - 1) {
        highIndex++;
        accumulatedVolume += sortedProfile[highIndex].volume;
      } else if (lowIndex > 0) {
        lowIndex--;
        accumulatedVolume += sortedProfile[lowIndex].volume;
      } else {
        break;
      }
    }

    return {
      valueAreaHigh: sortedProfile[highIndex].price,
      valueAreaLow: sortedProfile[lowIndex].price
    };
  }
}

// Plugin Renderer
export class VolumeProfileRenderer {
  private _data: VolumeProfileData;
  private _options: VolumeProfileOptions;
  private _chart: IChartApi;
  private _series: ISeriesApi<SeriesType>;

  constructor(data: VolumeProfileData, options: VolumeProfileOptions, chart: IChartApi, series: ISeriesApi<SeriesType>) {
    this._data = data;
    this._options = options;
    this._chart = chart;
    this._series = series;
  }

  draw(ctx: CanvasRenderingContext2D, pixelRatio: number, width: number, height: number) {
    if (!this._data.profile.length) return;

    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);

    const maxBarWidth = this._options.width;
    const rightMargin = 10;
    
    // Draw volume bars
    this._data.profile.forEach(item => {
      const barWidth = (item.volume / this._data.maxVolume) * maxBarWidth;
      const y = this.priceToY(item.price, height / pixelRatio);
      const barHeight = 3; // Height of each volume bar
      
      // Draw volume bar
      ctx.fillStyle = this._options.color + Math.floor(this._options.opacity * 255).toString(16).padStart(2, '0');
      ctx.fillRect(
        (width / pixelRatio) - rightMargin - barWidth,
        y - barHeight / 2,
        barWidth,
        barHeight
      );

      // Highlight Point of Control
      if (this._options.showPOC && item.price === this._data.pointOfControl) {
        ctx.fillStyle = '#FFD700CC'; // Gold color with transparency
        ctx.fillRect(
          (width / pixelRatio) - rightMargin - barWidth,
          y - barHeight / 2,
          barWidth,
          barHeight
        );
      }
    });

    // Draw Value Area (optional)
    if (this._options.showValueArea) {
      const vaHighY = this.priceToY(this._data.valueAreaHigh, height / pixelRatio);
      const vaLowY = this.priceToY(this._data.valueAreaLow, height / pixelRatio);
      
      ctx.strokeStyle = '#FFFFFF40';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      // Value Area High line
      ctx.beginPath();
      ctx.moveTo((width / pixelRatio) - rightMargin - maxBarWidth, vaHighY);
      ctx.lineTo((width / pixelRatio) - rightMargin, vaHighY);
      ctx.stroke();
      
      // Value Area Low line
      ctx.beginPath();
      ctx.moveTo((width / pixelRatio) - rightMargin - maxBarWidth, vaLowY);
      ctx.lineTo((width / pixelRatio) - rightMargin, vaLowY);
      ctx.stroke();
      
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  private priceToY(price: number, height: number): number {
    try {
      // Use the series' price scale to convert price to pixel coordinate
      const coordinate = this._series.priceToCoordinate(price);
      
      if (coordinate !== null) {
        return coordinate;
      }
    } catch (error) {
      console.warn('Error converting price to coordinate, using fallback:', error);
    }
    
    // Fallback to simplified conversion
    const minPrice = Math.min(...this._data.profile.map(p => p.price));
    const maxPrice = Math.max(...this._data.profile.map(p => p.price));
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return height / 2;
    
    return height - ((price - minPrice) / priceRange) * height;
  }
}

// Main Volume Profile Plugin
export class VolumeProfile {
  private _chart: IChartApi;
  private _series: ISeriesApi<SeriesType>;
  private _data: VolumeProfileData | null = null;
  private _options: VolumeProfileOptions;
  private _candles: ProcessedCandle[] = [];
  private _isVisible: boolean = true;
  private _pocLine: IPriceLine | null = null;
  private _valueAreaHighLine: IPriceLine | null = null;
  private _valueAreaLowLine: IPriceLine | null = null;

  constructor(
    chart: IChartApi,
    series: ISeriesApi<SeriesType>,
    options: Partial<VolumeProfileOptions> = {}
  ) {
    this._chart = chart;
    this._series = series;
    this._options = {
      numberOfLevels: 50,
      width: 100,
      color: '#3B82F6',
      opacity: 0.4,
      showPOC: true,
      showValueArea: true,
      ...options
    };
  }

  updateData(candles: ProcessedCandle[]) {
    this._candles = candles;
    this.recalculate();
    this.updatePriceLines();
  }

  setVisible(visible: boolean) {
    this._isVisible = visible;
    
    // For price lines, we need to remove/add them instead of toggling visibility
    if (visible) {
      this.updatePriceLines(); // Re-add price lines if visible
    } else {
      this.removePriceLines(); // Remove price lines if not visible
    }
  }

  getOptions(): VolumeProfileOptions {
    return { ...this._options };
  }

  updateOptions(options: Partial<VolumeProfileOptions>) {
    this._options = { ...this._options, ...options };
    this.recalculate();
  }

  getData(): VolumeProfileData | null {
    return this._data;
  }

  private recalculate() {
    if (this._candles.length === 0) {
      this._data = null;
      return;
    }

    this._data = VolumeProfileCalculator.calculateVolumeProfile(this._candles, this._options);
    console.log('Volume Profile calculated:', this._data);
  }

  private updatePriceLines() {
    if (!this._data || !this._isVisible) return;

    try {
      this.removePriceLines();

      // Add POC line
      if (this._options.showPOC && this._data.pointOfControl) {
        this._pocLine = this._series.createPriceLine({
          price: this._data.pointOfControl,
          color: '#FFD700',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: 'POC'
        });
      }

      // Add Value Area lines
      if (this._options.showValueArea) {
        this._valueAreaHighLine = this._series.createPriceLine({
          price: this._data.valueAreaHigh,
          color: '#FFFFFF60',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: false,
          title: 'VA High'
        });

        this._valueAreaLowLine = this._series.createPriceLine({
          price: this._data.valueAreaLow,
          color: '#FFFFFF60',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: false,
          title: 'VA Low'
        });
      }

      console.log('Volume Profile price lines updated');
    } catch (error) {
      console.error('Error updating volume profile price lines:', error);
    }
  }

  private removePriceLines() {
    if (this._pocLine) {
      this._series.removePriceLine(this._pocLine);
      this._pocLine = null;
    }
    if (this._valueAreaHighLine) {
      this._series.removePriceLine(this._valueAreaHighLine);
      this._valueAreaHighLine = null;
    }
    if (this._valueAreaLowLine) {
      this._series.removePriceLine(this._valueAreaLowLine);
      this._valueAreaLowLine = null;
    }
  }

  // Method to render on canvas (called by chart)
  render(ctx: CanvasRenderingContext2D, pixelRatio: number, width: number, height: number) {
    if (!this._isVisible || !this._data) return;

    const renderer = new VolumeProfileRenderer(this._data, this._options, this._chart, this._series);
    renderer.draw(ctx, pixelRatio, width, height);
  }

  // Cleanup method
  destroy() {
    this.removePriceLines();
  }
}