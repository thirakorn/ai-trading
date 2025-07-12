'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  Time,
  IPriceLine
} from 'lightweight-charts';
import { ProcessedCandle } from '@/lib/binance';
import { ChartType } from './ChartTypeSelector';
import { VolumeProfile } from '@/lib/volume-profile-plugin';
import { IndicatorArrays } from '@/lib/technical-analysis';

interface TradingChartProps {
  data: ProcessedCandle[];
  chartType: ChartType;
  currentTimeframe: string;
  supportLevel?: number | null;
  resistanceLevel?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  showVolumeProfile?: boolean;
  showRSI?: boolean;
  showMACD?: boolean;
  indicatorData?: IndicatorArrays | null;
  width?: number;
  height?: number;
}

export interface TradingChartRef {
  updateCandle: (candle: ProcessedCandle) => void;
}

const TradingChart = forwardRef<TradingChartRef, TradingChartProps>(({ 
  data, 
  chartType, 
  currentTimeframe, 
  supportLevel, 
  resistanceLevel,
  stopLoss,
  takeProfit,
  showVolumeProfile = true,
  showRSI = false,
  showMACD = false,
  indicatorData = null,
  height = 400 
}, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | ISeriesApi<'Candlestick'> | null>(null);
  const supportPriceLineRef = useRef<IPriceLine | null>(null);
  const resistancePriceLineRef = useRef<IPriceLine | null>(null);
  const stopLossPriceLineRef = useRef<IPriceLine | null>(null);
  const takeProfitPriceLineRef = useRef<IPriceLine | null>(null);
  
  // Indicator series refs
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiLevel30Ref = useRef<IPriceLine | null>(null);
  const rsiLevel70Ref = useRef<IPriceLine | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const macdZeroLineRef = useRef<IPriceLine | null>(null);
  const volumeProfileRef = useRef<VolumeProfile | null>(null);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const lastUpdateTimeRef = useRef<number>(0);

  // Filter and validate data with duplicate removal
  const filterAndValidateData = <T extends {time: Time}>(dataArray: T[]): T[] => {
    // Remove duplicates and ensure strict ascending order
    const uniqueData = dataArray.filter((item, index, array) => {
      if (index === 0) return true;
      const currentTime = Number(item.time);
      const prevTime = Number(array[index - 1].time);
      
      if (currentTime <= prevTime) {
        console.warn('Filtering duplicate/invalid timestamp at index:', index, 
          'prev:', prevTime, 'current:', currentTime);
        return false;
      }
      return true;
    });
    
    console.log('Filtered data:', dataArray.length, '→', uniqueData.length, 'candles');
    return uniqueData;
  };

  // Price line management functions
  const updateSupportResistanceLines = useCallback(() => {
    if (!seriesRef.current) return;

    // Remove existing support/resistance price lines
    if (supportPriceLineRef.current) {
      seriesRef.current.removePriceLine(supportPriceLineRef.current);
      supportPriceLineRef.current = null;
    }
    if (resistancePriceLineRef.current) {
      seriesRef.current.removePriceLine(resistancePriceLineRef.current);
      resistancePriceLineRef.current = null;
    }

    // Add support line if level exists
    if (supportLevel && supportLevel > 0) {
      try {
        supportPriceLineRef.current = seriesRef.current.createPriceLine({
          price: supportLevel,
          color: '#22c55e',
          lineWidth: 2,
          lineStyle: 0, // Solid line
          axisLabelVisible: true,
          title: 'Support'
        });
        console.log('Support line created at:', supportLevel);
      } catch (error) {
        console.error('Error creating support line:', error);
      }
    }

    // Add resistance line if level exists
    if (resistanceLevel && resistanceLevel > 0) {
      try {
        resistancePriceLineRef.current = seriesRef.current.createPriceLine({
          price: resistanceLevel,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: 0, // Solid line
          axisLabelVisible: true,
          title: 'Resistance'
        });
        console.log('Resistance line created at:', resistanceLevel);
      } catch (error) {
        console.error('Error creating resistance line:', error);
      }
    }
  }, [supportLevel, resistanceLevel]);

  const updateTradingSignalLines = useCallback(() => {
    if (!seriesRef.current) return;

    // Remove existing trading signal price lines
    if (stopLossPriceLineRef.current) {
      seriesRef.current.removePriceLine(stopLossPriceLineRef.current);
      stopLossPriceLineRef.current = null;
    }
    if (takeProfitPriceLineRef.current) {
      seriesRef.current.removePriceLine(takeProfitPriceLineRef.current);
      takeProfitPriceLineRef.current = null;
    }

    // Add stop loss line if exists
    if (stopLoss && stopLoss > 0) {
      try {
        stopLossPriceLineRef.current = seriesRef.current.createPriceLine({
          price: stopLoss,
          color: '#EF4444',
          lineWidth: 2,
          lineStyle: 1, // Dashed line
          axisLabelVisible: true,
          title: 'SL'
        });
        console.log('Stop loss line created at:', stopLoss);
      } catch (error) {
        console.error('Error creating stop loss line:', error);
      }
    }

    // Add take profit line if exists
    if (takeProfit && takeProfit > 0) {
      try {
        takeProfitPriceLineRef.current = seriesRef.current.createPriceLine({
          price: takeProfit,
          color: '#10B981',
          lineWidth: 2,
          lineStyle: 1, // Dashed line
          axisLabelVisible: true,
          title: 'TP'
        });
        console.log('Take profit line created at:', takeProfit);
      } catch (error) {
        console.error('Error creating take profit line:', error);
      }
    }
  }, [stopLoss, takeProfit]);

  const removeSupportResistanceLines = () => {
    if (!seriesRef.current) return;
    
    if (supportPriceLineRef.current) {
      try {
        seriesRef.current.removePriceLine(supportPriceLineRef.current);
        supportPriceLineRef.current = null;
      } catch (error) {
        console.warn('Error removing support line:', error);
      }
    }
    
    if (resistancePriceLineRef.current) {
      try {
        seriesRef.current.removePriceLine(resistancePriceLineRef.current);
        resistancePriceLineRef.current = null;
      } catch (error) {
        console.warn('Error removing resistance line:', error);
      }
    }
  };

  const removeTradingSignalLines = () => {
    if (!seriesRef.current) return;
    
    if (stopLossPriceLineRef.current) {
      try {
        seriesRef.current.removePriceLine(stopLossPriceLineRef.current);
        stopLossPriceLineRef.current = null;
      } catch (error) {
        console.warn('Error removing stop loss line:', error);
      }
    }
    
    if (takeProfitPriceLineRef.current) {
      try {
        seriesRef.current.removePriceLine(takeProfitPriceLineRef.current);
        takeProfitPriceLineRef.current = null;
      } catch (error) {
        console.warn('Error removing take profit line:', error);
      }
    }
  };

  const removeIndicatorSeries = () => {
    if (!chartRef.current) return;
    
    // Remove RSI series and lines
    if (rsiLevel30Ref.current && rsiSeriesRef.current) {
      try {
        rsiSeriesRef.current.removePriceLine(rsiLevel30Ref.current);
        rsiLevel30Ref.current = null;
      } catch (error) {
        console.warn('Error removing RSI 30 line:', error);
      }
    }
    
    if (rsiLevel70Ref.current && rsiSeriesRef.current) {
      try {
        rsiSeriesRef.current.removePriceLine(rsiLevel70Ref.current);
        rsiLevel70Ref.current = null;
      } catch (error) {
        console.warn('Error removing RSI 70 line:', error);
      }
    }
    
    if (rsiSeriesRef.current) {
      try {
        chartRef.current.removeSeries(rsiSeriesRef.current);
        rsiSeriesRef.current = null;
      } catch (error) {
        console.warn('Error removing RSI series:', error);
      }
    }
    
    // Remove MACD series and lines
    if (macdZeroLineRef.current && macdSeriesRef.current) {
      try {
        macdSeriesRef.current.removePriceLine(macdZeroLineRef.current);
        macdZeroLineRef.current = null;
      } catch (error) {
        console.warn('Error removing MACD zero line:', error);
      }
    }
    
    if (macdSeriesRef.current) {
      try {
        chartRef.current.removeSeries(macdSeriesRef.current);
        macdSeriesRef.current = null;
      } catch (error) {
        console.warn('Error removing MACD series:', error);
      }
    }
    
    if (macdSignalSeriesRef.current) {
      try {
        chartRef.current.removeSeries(macdSignalSeriesRef.current);
        macdSignalSeriesRef.current = null;
      } catch (error) {
        console.warn('Error removing MACD signal series:', error);
      }
    }
    
    if (macdHistogramSeriesRef.current) {
      try {
        chartRef.current.removeSeries(macdHistogramSeriesRef.current);
        macdHistogramSeriesRef.current = null;
      } catch (error) {
        console.warn('Error removing MACD histogram series:', error);
      }
    }
  };

  const initializeVolumeProfile = useCallback(() => {
    if (!chartRef.current || !seriesRef.current) return;

    try {
      volumeProfileRef.current = new VolumeProfile(chartRef.current, seriesRef.current, {
        numberOfLevels: 50,
        width: 80,
        color: '#3B82F6',
        opacity: 0.3,
        showPOC: true,
        showValueArea: true
      });
      
      // Add canvas overlay for volume profile rendering
      setupVolumeProfileCanvas();
      
      console.log('Volume Profile initialized');
    } catch (error) {
      console.error('Error initializing volume profile:', error);
    }
  }, []);

  const setupVolumeProfileCanvas = () => {
    if (!chartContainerRef.current || !chartRef.current || !volumeProfileRef.current) return;

    try {
      // Get the chart container
      const chartContainer = chartContainerRef.current;
      
      // Create overlay canvas
      const overlay = document.createElement('canvas');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '1';
      
      // Add to container
      chartContainer.appendChild(overlay);
      
      // Setup rendering with improved bounds checking
      const renderVolumeProfile = () => {
        const ctx = overlay.getContext('2d');
        if (!ctx || !volumeProfileRef.current) return;
        
        // Get chart container dimensions with bounds checking
        const rect = chartContainer.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          console.warn('Invalid chart container dimensions:', rect);
          return;
        }
        
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Set canvas size with proper pixel ratio
        overlay.width = Math.max(1, rect.width * pixelRatio);
        overlay.height = Math.max(1, rect.height * pixelRatio);
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        
        // Clear canvas before rendering
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        
        // Only render if volume profile is visible and has data
        if (volumeProfileRef.current.getData()) {
          volumeProfileRef.current.render(ctx, pixelRatio, overlay.width, overlay.height);
        }
      };
      
      // Initial render
      renderVolumeProfile();
      
      // Re-render on chart updates
      const handleResize = () => {
        requestAnimationFrame(renderVolumeProfile);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Store cleanup function
      const cleanup = () => {
        window.removeEventListener('resize', handleResize);
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      };
      
      // Store for later cleanup
      (volumeProfileRef.current as VolumeProfile & { _cleanup?: () => void })._cleanup = cleanup;
      
    } catch (error) {
      console.error('Error setting up volume profile canvas:', error);
    }
  };

  const updateVolumeProfile = useCallback(() => {
    if (!volumeProfileRef.current || data.length === 0) return;

    try {
      volumeProfileRef.current.updateData(data);
      volumeProfileRef.current.setVisible(showVolumeProfile);
      
      // Trigger canvas re-render
      triggerVolumeProfileRender();
      
      console.log('Volume Profile updated with', data.length, 'candles');
    } catch (error) {
      console.error('Error updating volume profile:', error);
    }
  }, [data, showVolumeProfile]);

  const triggerVolumeProfileRender = () => {
    if (!chartContainerRef.current || !chartRef.current || !volumeProfileRef.current) return;
    
    // Find the overlay canvas and trigger re-render
    const chartContainer = chartContainerRef.current;
    const overlay = chartContainer.querySelector('canvas[style*="position: absolute"]') as HTMLCanvasElement;
    
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) {
        // Get current dimensions with bounds checking
        const rect = chartContainer.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Resize canvas if needed
        const expectedWidth = rect.width * pixelRatio;
        const expectedHeight = rect.height * pixelRatio;
        
        if (overlay.width !== expectedWidth || overlay.height !== expectedHeight) {
          overlay.width = expectedWidth;
          overlay.height = expectedHeight;
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';
        }
        
        // Clear and render
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        
        // Only render if volume profile has data
        if (volumeProfileRef.current.getData()) {
          volumeProfileRef.current.render(ctx, pixelRatio, overlay.width, overlay.height);
        }
      }
    }
  };

  // Scale RSI values to fit on price chart
  const scaleRSIToPriceChart = useCallback((rsiData: IndicatorArrays['rsi'], priceRange: {min: number, max: number}) => {
    if (!rsiData || rsiData.length === 0) return [];
    
    // Validate price range
    if (priceRange.max <= priceRange.min) {
      console.warn('Invalid price range for RSI scaling:', priceRange);
      return [];
    }
    
    const chartRange = priceRange.max - priceRange.min;
    const rsiDisplayHeight = chartRange * 0.25; // Use 25% of price range for RSI
    const rsiTopPosition = priceRange.max - (chartRange * 0.02); // Position RSI near top with small margin
    
    return rsiData.map(point => ({
      time: point.time,
      value: rsiTopPosition - ((point.value / 100) * rsiDisplayHeight) // Invert RSI (100 at top)
    }));
  }, []);

  // Scale MACD values to fit on price chart
  const scaleMACDToPriceChart = useCallback((macdData: IndicatorArrays['macd'], priceRange: {min: number, max: number}) => {
    if (!macdData || !macdData.macd || macdData.macd.length === 0) return { macd: [], signal: [], histogram: [] };
    
    // Validate price range
    if (priceRange.max <= priceRange.min) {
      console.warn('Invalid price range for MACD scaling:', priceRange);
      return { macd: [], signal: [], histogram: [] };
    }
    
    // Find MACD value range with better edge case handling
    const allMacdValues = [
      ...macdData.macd.map(p => p.value).filter(v => !isNaN(v) && isFinite(v)),
      ...macdData.signal.map(p => p.value).filter(v => !isNaN(v) && isFinite(v)),
      ...macdData.histogram.map(p => p.value).filter(v => !isNaN(v) && isFinite(v))
    ];
    
    if (allMacdValues.length === 0) {
      console.warn('No valid MACD values found');
      return { macd: [], signal: [], histogram: [] };
    }
    
    const macdMin = Math.min(...allMacdValues);
    const macdMax = Math.max(...allMacdValues);
    let macdRange = macdMax - macdMin;
    
    // Handle edge case where all values are the same
    if (macdRange === 0) {
      macdRange = Math.abs(macdMax) || 1; // Use absolute value or default to 1
    }
    
    const chartRange = priceRange.max - priceRange.min;
    const macdDisplayHeight = chartRange * 0.2; // Use 20% of price range for MACD
    const macdBottomPosition = priceRange.min + (chartRange * 0.05); // Position MACD near bottom
    
    const scaleValue = (value: number) => {
      if (!isFinite(value) || isNaN(value)) return macdBottomPosition;
      
      const normalizedValue = (value - macdMin) / macdRange;
      return macdBottomPosition + (normalizedValue * macdDisplayHeight);
    };
    
    return {
      macd: macdData.macd.map(point => ({
        time: point.time,
        value: scaleValue(point.value)
      })),
      signal: macdData.signal.map(point => ({
        time: point.time,
        value: scaleValue(point.value)
      })),
      histogram: macdData.histogram.map(point => ({
        time: point.time,
        value: scaleValue(point.value)
      }))
    };
  }, []);

  // Calculate price range for scaling
  const getPriceRange = useCallback(() => {
    if (data.length === 0) return { min: 0, max: 1 };
    
    const prices = data.flatMap(candle => [candle.high, candle.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    return { min, max };
  }, [data]);

  // Update indicator series
  const updateIndicators = useCallback(() => {
    if (!chartRef.current || !indicatorData) return;
    
    // Ensure series are initialized before updating
    if (showRSI && !rsiSeriesRef.current) {
      console.warn('RSI series not initialized, skipping update');
      return;
    }
    
    if (showMACD && (!macdSeriesRef.current || !macdSignalSeriesRef.current || !macdHistogramSeriesRef.current)) {
      console.warn('MACD series not fully initialized, skipping update');
      return;
    }
    
    const priceRange = getPriceRange();
    
    // Update RSI with error handling
    if (showRSI && indicatorData.rsi && rsiSeriesRef.current) {
      try {
        const scaledRSI = scaleRSIToPriceChart(indicatorData.rsi, priceRange);
        if (scaledRSI.length > 0) {
          rsiSeriesRef.current.setData(scaledRSI);
        
          // Add RSI reference lines (30 and 70 levels) using same scaling as RSI data
        const chartRange = priceRange.max - priceRange.min;
        const rsiDisplayHeight = chartRange * 0.25;
        const rsiTopPosition = priceRange.max - (chartRange * 0.02);
        
        const rsi30Value = rsiTopPosition - ((30 / 100) * rsiDisplayHeight); // RSI 30 level
        const rsi70Value = rsiTopPosition - ((70 / 100) * rsiDisplayHeight); // RSI 70 level
        
        if (!rsiLevel30Ref.current) {
          rsiLevel30Ref.current = rsiSeriesRef.current.createPriceLine({
            price: rsi30Value,
            color: '#FFA500',
            lineWidth: 1,
            lineStyle: 2, // Dotted line
            axisLabelVisible: false,
            title: ''
          });
        }
        
        if (!rsiLevel70Ref.current) {
          rsiLevel70Ref.current = rsiSeriesRef.current.createPriceLine({
            price: rsi70Value,
            color: '#FFA500',
            lineWidth: 1,
            lineStyle: 2, // Dotted line
            axisLabelVisible: false,
            title: ''
          });
        }
        }
      } catch (error) {
        console.error('Error updating RSI:', error);
      }
    }
    
    // Update MACD with error handling
    if (showMACD && indicatorData.macd && macdSeriesRef.current && macdSignalSeriesRef.current && macdHistogramSeriesRef.current) {
      try {
        const scaledMACD = scaleMACDToPriceChart(indicatorData.macd, priceRange);
        
        if (scaledMACD.macd.length > 0) {
          macdSeriesRef.current.setData(scaledMACD.macd);
          macdSignalSeriesRef.current.setData(scaledMACD.signal);
          macdHistogramSeriesRef.current.setData(scaledMACD.histogram);
        
        // Add MACD zero line using same scaling as MACD data
        // Calculate zero line position based on MACD value range
        const allMacdValues = [
          ...scaledMACD.macd.map(p => p.value),
          ...scaledMACD.signal.map(p => p.value),
          ...scaledMACD.histogram.map(p => p.value)
        ];
        const macdDisplayMin = Math.min(...allMacdValues);
        const macdDisplayMax = Math.max(...allMacdValues);
        
        // Zero line should be proportionally positioned within MACD display area
        const zeroValue = macdDisplayMin + ((macdDisplayMax - macdDisplayMin) * 0.5);
        
        if (!macdZeroLineRef.current) {
          macdZeroLineRef.current = macdSeriesRef.current.createPriceLine({
            price: zeroValue,
            color: '#666666',
            lineWidth: 1,
            lineStyle: 2, // Dotted line
            axisLabelVisible: false,
            title: ''
          });
        }
        }
      } catch (error) {
        console.error('Error updating MACD:', error);
      }
    }
    
    console.log('Indicators updated:', { showRSI, showMACD, rsiLength: indicatorData.rsi?.length, macdLength: indicatorData.macd?.macd?.length });
  }, [indicatorData, showRSI, showMACD, scaleRSIToPriceChart, scaleMACDToPriceChart, getPriceRange]);

  // Expose update methods to parent
  useImperativeHandle(ref, () => ({
    updateCandle: (candle: ProcessedCandle) => {
      if (!seriesRef.current) return;

      try {
        // Ensure time is properly formatted as integer seconds
        const candleTime = Math.floor(candle.time) as Time;
        
        // Prevent updating with older data
        if (Number(candleTime) < lastUpdateTimeRef.current) {
          console.warn('Skipping update with older timestamp:', candleTime, 'last:', lastUpdateTimeRef.current);
          return;
        }

        console.log('Updating chart with candle time:', candleTime, 'raw time:', candle.time);

        if (chartType === 'line') {
          const lineData = {
            time: candleTime,
            value: candle.close,
          };
          (seriesRef.current as ISeriesApi<'Line'>).update(lineData);
        } else {
          const candlestickData = {
            time: candleTime,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          };
          (seriesRef.current as ISeriesApi<'Candlestick'>).update(candlestickData);
        }

        // Update last update time
        lastUpdateTimeRef.current = Number(candleTime);
        
      } catch (error) {
        console.error('Error updating chart:', error, 'candle:', candle);
        // Don't throw, just log the error to prevent crashes
      }
    },
  }));

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#111827' },
        textColor: '#ffffff',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#6B7280',
      },
      timeScale: {
        borderColor: '#6B7280',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        // Cleanup volume profile
        if (volumeProfileRef.current) {
          const vpWithCleanup = volumeProfileRef.current as VolumeProfile & { _cleanup?: () => void };
          if (vpWithCleanup._cleanup) {
            vpWithCleanup._cleanup();
          }
          volumeProfileRef.current.destroy();
          volumeProfileRef.current = null;
        }
        if (chart) {
          chart.remove();
        }
      } catch (error) {
        console.warn('Chart already disposed:', error);
      }
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // Handle chart type changes
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove all price lines before removing series
    removeSupportResistanceLines();
    removeTradingSignalLines();
    removeIndicatorSeries();
    
    // Cleanup volume profile before chart type change
    if (volumeProfileRef.current) {
      const vpWithCleanup = volumeProfileRef.current as VolumeProfile & { _cleanup?: () => void };
      if (vpWithCleanup._cleanup) {
        vpWithCleanup._cleanup();
      }
      volumeProfileRef.current.destroy();
      volumeProfileRef.current = null;
    }

    // Remove existing series
    if (seriesRef.current) {
      try {
        chartRef.current.removeSeries(seriesRef.current);
      } catch (error) {
        console.warn('Error removing series:', error);
      }
      seriesRef.current = null;
    }

    // Reset initial data loaded flag when chart type changes
    setIsInitialDataLoaded(false);

    // Add new series based on chart type
    try {
      if (chartType === 'line') {
        const lineSeries = chartRef.current.addSeries(LineSeries, {
          color: '#3B82F6',
          lineWidth: 2,
        });
        seriesRef.current = lineSeries;
      } else {
        const candlestickSeries = chartRef.current.addSeries(CandlestickSeries, {
          upColor: '#10B981',
          downColor: '#EF4444',
          borderDownColor: '#EF4444',
          borderUpColor: '#10B981',
          wickDownColor: '#EF4444',
          wickUpColor: '#10B981',
        });
        seriesRef.current = candlestickSeries;
      }

      // Add indicator series with error handling
      try {
        if (showRSI) {
          rsiSeriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: '#FFAA00',
            lineWidth: 2,
            title: 'RSI'
          });
          console.log('RSI series initialized');
        }
        
        if (showMACD) {
          macdSeriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: '#2196F3',
            lineWidth: 2,
            title: 'MACD'
          });
          
          macdSignalSeriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: '#F44336',
            lineWidth: 2,
            title: 'Signal'
          });
          
          macdHistogramSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
            color: '#4CAF50',
            title: 'Histogram'
          });
          console.log('MACD series initialized');
        }
      } catch (error) {
        console.error('Error initializing indicator series:', error);
      }

      // Initialize volume profile after series is created
      initializeVolumeProfile();
    } catch (error) {
      console.error('Error adding series:', error);
    }
  }, [chartType, showRSI, showMACD, initializeVolumeProfile]);

  // Reset data loaded flag when timeframe changes
  useEffect(() => {
    setIsInitialDataLoaded(false);
    lastUpdateTimeRef.current = 0; // Reset last update time to allow new data
    console.log(`Timeframe changed to ${currentTimeframe}, resetting chart data`);
  }, [currentTimeframe]);

  // Update support/resistance lines when levels change
  useEffect(() => {
    if (seriesRef.current && isInitialDataLoaded) {
      console.log('Updating support/resistance lines:', { supportLevel, resistanceLevel });
      updateSupportResistanceLines();
    }
  }, [supportLevel, resistanceLevel, isInitialDataLoaded, updateSupportResistanceLines]);

  // Update trading signal lines when TP/SL data changes
  useEffect(() => {
    if (seriesRef.current && isInitialDataLoaded) {
      console.log('Updating trading signal lines:', { stopLoss, takeProfit });
      updateTradingSignalLines();
    }
  }, [stopLoss, takeProfit, isInitialDataLoaded, updateTradingSignalLines]);

  // Update volume profile when data or visibility changes
  useEffect(() => {
    if (isInitialDataLoaded && data.length > 0) {
      updateVolumeProfile();
    }
  }, [data, showVolumeProfile, isInitialDataLoaded, updateVolumeProfile]);

  // Update indicators when data or visibility changes
  useEffect(() => {
    if (isInitialDataLoaded && indicatorData) {
      updateIndicators();
    }
  }, [indicatorData, showRSI, showMACD, isInitialDataLoaded, updateIndicators]);

  // Load data when timeframe changes or initial load (use setData for timeframe switching)
  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;

    // Use setData for timeframe switching and initial load (following TradingView pattern)
    if (!isInitialDataLoaded) {
      console.log(`Loading ${data.length} candles for ${currentTimeframe} timeframe`);
      
      let uniqueData: Array<{time: Time}> = [];
      
      if (chartType === 'line') {
        const lineData = data
          .map(candle => ({
            time: candle.time as Time,
            value: candle.close,
          }))
          .sort((a, b) => Number(a.time) - Number(b.time)); // Sort ascending by time
        
        // Filter duplicates and validate
        uniqueData = filterAndValidateData(lineData);
        
        console.log('Setting line data:', uniqueData.length, 'points, first:', uniqueData[0]?.time, 'last:', uniqueData[uniqueData.length-1]?.time);
        
        (seriesRef.current as ISeriesApi<'Line'>).setData(uniqueData);
      } else {
        const candlestickData = data
          .map(candle => ({
            time: candle.time as Time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          }))
          .sort((a, b) => Number(a.time) - Number(b.time)); // Sort ascending by time
        
        // Filter duplicates and validate
        uniqueData = filterAndValidateData(candlestickData);
        
        console.log('Setting candlestick data:', uniqueData.length, 'candles, first:', uniqueData[0]?.time, 'last:', uniqueData[uniqueData.length-1]?.time);
        
        (seriesRef.current as ISeriesApi<'Candlestick'>).setData(uniqueData);
      }

      setIsInitialDataLoaded(true);
      
      // Update lastUpdateTime to the latest data point to prevent old updates
      if (uniqueData.length > 0) {
        lastUpdateTimeRef.current = Number(uniqueData[uniqueData.length - 1].time);
      }
      
      // Add all price lines after data is loaded
      setTimeout(() => {
        updateSupportResistanceLines();
        updateTradingSignalLines();
        chartRef.current?.timeScale().fitContent();
      }, 100);
    }
  }, [data, chartType, isInitialDataLoaded, currentTimeframe, updateSupportResistanceLines, updateTradingSignalLines]);

  console.log('Chart data received:', data.length, 'candles, type:', chartType);

  if (data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-gray-400">No data available for chart</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div 
        ref={chartContainerRef} 
        className="w-full bg-gray-900 rounded-lg"
        style={{ height: `${height}px` }}
      />
    </div>
  );
});

TradingChart.displayName = 'TradingChart';

export default TradingChart;