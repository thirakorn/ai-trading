'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface TradingChartProps {
  symbol?: string;
  currentTimeframe?: string;
  supportLevel?: number | null;
  resistanceLevel?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  height?: number;
}

export interface TradingChartRef {
  // Simplified interface - TradingView widget handles updates internally
  refresh?: () => void;
}

const TradingChart = forwardRef<TradingChartRef, TradingChartProps>(({ 
  symbol = 'BINANCE:BTCUSDT',
  currentTimeframe = '1D',
  height = 500
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose methods to parent (simplified for widget)
  useImperativeHandle(ref, () => ({
    refresh: () => {
      // Widget handles its own updates
      console.log('TradingView widget refresh requested');
    }
  }));

  // Convert timeframe format from API to TradingView format
  const convertTimeframe = (tf: string): string => {
    const timeframeMap: Record<string, string> = {
      '1m': '1',
      '3m': '3', 
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '2h': '120',
      '4h': '240',
      '6h': '360',
      '8h': '480',
      '12h': '720',
      '1d': 'D',
      '3d': '3D',
      '1w': 'W',
      '1M': 'M'
    };
    return timeframeMap[tf.toLowerCase()] || 'D';
  };

  // Load TradingView widget
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval: convertTimeframe(currentTimeframe),
      locale: 'en',
      save_image: true,
      style: '1',
      symbol: symbol,
      theme: 'dark',
      timezone: 'Etc/UTC',
      backgroundColor: '#0F0F0F',
      gridColor: 'rgba(242, 242, 242, 0.06)',
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [
        'STD;MACD',
        'STD;RSI'
      ],
      autosize: true,
      width: '100%',
      height: '100%'
    });

    // Create widget container structure
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetContent = document.createElement('div');
    widgetContent.className = 'tradingview-widget-container__widget';
    widgetContent.style.height = 'calc(100% - 32px)';
    widgetContent.style.width = '100%';

    const copyright = document.createElement('div');
    copyright.className = 'tradingview-widget-copyright';
    copyright.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';

    widgetContainer.appendChild(widgetContent);
    widgetContainer.appendChild(copyright);
    widgetContainer.appendChild(script);

    container.appendChild(widgetContainer);

    console.log('TradingView widget loaded with symbol:', symbol, 'timeframe:', convertTimeframe(currentTimeframe));

    return () => {
      // Use the captured container reference for cleanup
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, currentTimeframe]);

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div 
        ref={containerRef} 
        className="w-full bg-gray-900 rounded-lg"
        style={{ height: `${height}px` }}
      />
    </div>
  );
});

TradingChart.displayName = 'TradingChart';

export default TradingChart;