'use client';

import { useState, useRef, useCallback } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import { ProcessedCandle } from '@/lib/binance';
import TradingChart, { TradingChartRef } from '@/components/TradingChart';
import AnalysisPanel from '@/components/AnalysisPanel';
import TimeframeSelector from '@/components/TimeframeSelector';
import ChartTypeSelector, { ChartType } from '@/components/ChartTypeSelector';
import RealTimePriceIndicator from '@/components/RealTimePriceIndicator';
import AIToggle from '@/components/AIToggle';
import VolumeProfileToggle from '@/components/VolumeProfileToggle';
import IndicatorControls from '@/components/IndicatorControls';

export default function Dashboard() {
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [useAI, setUseAI] = useState(false);
  const [showVolumeProfile, setShowVolumeProfile] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const chartRef = useRef<TradingChartRef>(null);

  // Handle real-time candle updates
  const handleCandleUpdate = useCallback((candle: ProcessedCandle) => {
    if (chartRef.current) {
      chartRef.current.updateCandle(candle);
    }
  }, []);

  const { 
    candleData, 
    analysis, 
    indicatorArrays,
    isLoading, 
    error, 
    lastUpdate, 
    currentTimeframe, 
    isConnected,
    currentPrice,
    priceChange,
    priceChangePercent,
    wsError,
    connectionState,
    indicators,
    refreshData, 
    changeTimeframe 
  } = useMarketData(handleCandleUpdate);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">BTCUSD Trading Analyzer</h1>
            <p className="text-gray-400">AI-Powered Entry/Exit Analysis</p>
          </div>
          <div className="flex items-center space-x-4">
            <AIToggle
              useAI={useAI}
              onToggle={setUseAI}
              disabled={isLoading}
            />
            <div className="border-l border-gray-600 h-6"></div>
            <ChartTypeSelector
              currentChartType={chartType}
              onChartTypeChange={setChartType}
              disabled={isLoading}
            />
            <VolumeProfileToggle
              enabled={showVolumeProfile}
              onToggle={setShowVolumeProfile}
              disabled={isLoading}
            />
            <IndicatorControls
              showRSI={showRSI}
              showMACD={showMACD}
              onRSIToggle={setShowRSI}
              onMACDToggle={setShowMACD}
              disabled={isLoading}
            />
            <TimeframeSelector
              currentTimeframe={currentTimeframe}
              onTimeframeChange={changeTimeframe}
              disabled={isLoading}
            />
            {lastUpdate && (
              <div className="text-sm text-gray-400">
                Last Update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 mx-4 mt-4 rounded-lg">
          <p className="font-medium">API Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* WebSocket Error Display */}
      {wsError && (
        <div className="bg-orange-900/20 border border-orange-800 text-orange-400 px-4 py-3 mx-4 mt-4 rounded-lg">
          <p className="font-medium">WebSocket Error:</p>
          <p>{wsError}</p>
          <p className="text-sm text-orange-300 mt-1">Connection State: {connectionState}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="xl:col-span-2 space-y-4">
            {/* Real-time Price Indicator */}
            <RealTimePriceIndicator
              currentPrice={currentPrice}
              priceChange={priceChange}
              priceChangePercent={priceChangePercent}
              isConnected={isConnected}
              symbol="BTCUSDT"
            />

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  BTCUSD {currentTimeframe.toUpperCase()} Chart ({chartType === 'candlestick' ? 'Candlestick' : 'Line'})
                </h2>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className="text-xs text-gray-400">
                    {isConnected ? 'Real-time' : 'Offline'}
                  </span>
                </div>
              </div>
              {candleData.length > 0 ? (
                <TradingChart 
                  ref={chartRef}
                  data={candleData} 
                  chartType={chartType}
                  currentTimeframe={currentTimeframe}
                  supportLevel={analysis?.support || null}
                  resistanceLevel={analysis?.resistance || null}
                  stopLoss={analysis?.signals?.stopLoss || null}
                  takeProfit={analysis?.signals?.takeProfit || null}
                  showVolumeProfile={showVolumeProfile}
                  showRSI={showRSI}
                  showMACD={showMACD}
                  indicatorData={indicatorArrays}
                  height={500} 
                />
              ) : (
                <div className="h-[500px] bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading chart data...</p>
                      </>
                    ) : (
                      <p className="text-gray-400">No chart data available</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Market Status */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Market Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Data Points</p>
                  <p className="text-xl font-bold text-white">{candleData.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Timeframe</p>
                  <p className="text-xl font-bold text-blue-400">{currentTimeframe.toUpperCase()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Auto Refresh</p>
                  <p className="text-xl font-bold text-green-400">ON</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">WebSocket</p>
                  <p className={`text-xl font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                    {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{connectionState}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="xl:col-span-1">
            <AnalysisPanel 
              analysis={analysis} 
              isLoading={isLoading}
              useAI={useAI}
              candles={candleData}
              indicators={indicators}
              currentTimeframe={currentTimeframe}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4 mt-8">
        <div className="text-center text-gray-400 text-sm">
          <p>BTCUSD Trading Analyzer - For Educational Purposes Only</p>
          <p className="mt-1">Real-time data via Binance WebSocket • Chart types: Line & Candlestick</p>
        </div>
      </div>
    </div>
  );
}
