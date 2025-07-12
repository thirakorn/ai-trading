'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickSeries,
  LineSeries,
  ColorType,
  Time,
  IPriceLine
} from 'lightweight-charts';
import { ProcessedCandle } from '@/lib/binance';
import { ChartType } from './ChartTypeSelector';
import { VolumeProfile } from '@/lib/volume-profile-plugin';

interface TradingChartProps {
  data: ProcessedCandle[];
  chartType: ChartType;
  currentTimeframe: string;
  supportLevel?: number | null;
  resistanceLevel?: number | null;
  entryPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  showVolumeProfile?: boolean;
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
  entryPrice,
  stopLoss,
  takeProfit,
  showVolumeProfile = false,
  height = 400 
}, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | ISeriesApi<'Candlestick'> | null>(null);
  const supportPriceLineRef = useRef<IPriceLine | null>(null);
  const resistancePriceLineRef = useRef<IPriceLine | null>(null);
  const entryPriceLineRef = useRef<IPriceLine | null>(null);
  const stopLossPriceLineRef = useRef<IPriceLine | null>(null);
  const takeProfitPriceLineRef = useRef<IPriceLine | null>(null);
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
    if (entryPriceLineRef.current) {
      seriesRef.current.removePriceLine(entryPriceLineRef.current);
      entryPriceLineRef.current = null;
    }
    if (stopLossPriceLineRef.current) {
      seriesRef.current.removePriceLine(stopLossPriceLineRef.current);
      stopLossPriceLineRef.current = null;
    }
    if (takeProfitPriceLineRef.current) {
      seriesRef.current.removePriceLine(takeProfitPriceLineRef.current);
      takeProfitPriceLineRef.current = null;
    }

    // Add entry price line if exists
    if (entryPrice && entryPrice > 0) {
      try {
        entryPriceLineRef.current = seriesRef.current.createPriceLine({
          price: entryPrice,
          color: '#3B82F6',
          lineWidth: 2,
          lineStyle: 0, // Solid line
          axisLabelVisible: true,
          title: 'Entry'
        });
        console.log('Entry price line created at:', entryPrice);
      } catch (error) {
        console.error('Error creating entry price line:', error);
      }
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
  }, [entryPrice, stopLoss, takeProfit]);

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
    
    if (entryPriceLineRef.current) {
      try {
        seriesRef.current.removePriceLine(entryPriceLineRef.current);
        entryPriceLineRef.current = null;
      } catch (error) {
        console.warn('Error removing entry price line:', error);
      }
    }
    
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

  const initializeVolumeProfile = () => {
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
      
      console.log('Volume Profile initialized');
    } catch (error) {
      console.error('Error initializing volume profile:', error);
    }
  };

  const updateVolumeProfile = useCallback(() => {
    if (!volumeProfileRef.current || data.length === 0) return;

    try {
      volumeProfileRef.current.updateData(data);
      volumeProfileRef.current.setVisible(showVolumeProfile);
      console.log('Volume Profile updated with', data.length, 'candles');
    } catch (error) {
      console.error('Error updating volume profile:', error);
    }
  }, [data, showVolumeProfile]);

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

      // Initialize volume profile after series is created
      initializeVolumeProfile();
    } catch (error) {
      console.error('Error adding series:', error);
    }
  }, [chartType]);

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
      console.log('Updating trading signal lines:', { entryPrice, stopLoss, takeProfit });
      updateTradingSignalLines();
    }
  }, [entryPrice, stopLoss, takeProfit, isInitialDataLoaded, updateTradingSignalLines]);

  // Update volume profile when data or visibility changes
  useEffect(() => {
    if (isInitialDataLoaded && data.length > 0) {
      updateVolumeProfile();
    }
  }, [data, showVolumeProfile, isInitialDataLoaded, updateVolumeProfile]);

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