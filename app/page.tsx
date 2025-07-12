'use client';

import { useState, useRef } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import TradingChart, { TradingChartRef } from '@/components/TradingChart';
import AnalysisPanel from '@/components/AnalysisPanel';
import TimeframeSelector from '@/components/TimeframeSelector';
import RealTimePriceIndicator from '@/components/RealTimePriceIndicator';
import AIToggle from '@/components/AIToggle';
import SymbolSelector from '@/components/SymbolSelector';

export default function Dashboard() {
  const [useAI, setUseAI] = useState(false);
  const chartRef = useRef<TradingChartRef>(null);

  const { 
    candleData, 
    analysis, 
    isLoading, 
    error, 
    lastUpdate, 
    currentTimeframe, 
    currentSymbol,
    isConnected,
    currentPrice,
    priceChange,
    priceChangePercent,
    wsError,
    connectionState,
    indicators,
    refreshData, 
    changeTimeframe,
    changeSymbol 
  } = useMarketData();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Entry/Exit Trading Analyzer</h1>
            <p className="text-gray-400">AI-Powered Entry/Exit Analysis</p>
          </div>
          <div className="flex items-center space-x-4">
            <SymbolSelector
              currentSymbol={currentSymbol}
              onSymbolChange={changeSymbol}
              disabled={isLoading}
            />
            <div className="border-l border-gray-600 h-6"></div>
            <TimeframeSelector
              currentTimeframe={currentTimeframe}
              onTimeframeChange={changeTimeframe}
              disabled={isLoading}
            />
            <div className="border-l border-gray-600 h-6"></div>
            <AIToggle
              useAI={useAI}
              onToggle={setUseAI}
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
              symbol={currentSymbol}
            />

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {currentSymbol.replace('USDT', '/USDT')} {currentTimeframe.toUpperCase()} Chart
                </h2>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className="text-xs text-gray-400">
                    {isConnected ? 'Real-time' : 'Offline'}
                  </span>
                </div>
              </div>
              <TradingChart 
                ref={chartRef}
                symbol={`BINANCE:${currentSymbol}`}
                currentTimeframe={currentTimeframe}
                supportLevel={analysis?.support || null}
                resistanceLevel={analysis?.resistance || null}
                stopLoss={analysis?.signals?.stopLoss || null}
                takeProfit={analysis?.signals?.takeProfit || null}
                height={500} 
              />
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
          <p>Multi-Symbol Trading Analyzer - For Educational Purposes Only</p>
          <p className="mt-1">Real-time data via Binance WebSocket • 12 Trading Pairs • Enhanced Error Handling</p>
        </div>
      </div>
    </div>
  );
}
