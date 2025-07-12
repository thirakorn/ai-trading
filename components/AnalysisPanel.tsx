'use client';

import { MarketAnalysis } from '@/lib/ai-analyzer';
import AIAnalysisPanel from './AIAnalysisPanel';
import { ProcessedCandle, BinanceInterval } from '@/lib/binance';
import { TechnicalIndicators } from '@/lib/technical-analysis';

interface AnalysisPanelProps {
  analysis: MarketAnalysis | null;
  isLoading: boolean;
  useAI?: boolean;
  candles?: ProcessedCandle[];
  indicators?: TechnicalIndicators | null;
  currentTimeframe?: BinanceInterval;
}

export default function AnalysisPanel({ analysis, isLoading, useAI, candles, indicators, currentTimeframe }: AnalysisPanelProps) {
  // Show AI analysis if enabled and data is available
  if (useAI && candles && candles.length > 0) {
    return (
      <AIAnalysisPanel 
        candles={candles} 
        indicators={indicators || null} 
        isLoading={isLoading}
        currentTimeframe={currentTimeframe}
      />
    );
  }
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400">No analysis available</p>
      </div>
    );
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'BULLISH': return 'text-green-400';
      case 'BEARISH': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'BUY': return 'text-green-400 bg-green-900/20';
      case 'SELL': return 'text-red-400 bg-red-900/20';
      default: return 'text-yellow-400 bg-yellow-900/20';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      {/* Price and Trend */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">BTCUSDT</h3>
          <p className="text-2xl font-mono text-white">${analysis.currentPrice.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Market Trend</p>
          <p className={`text-lg font-semibold ${getTrendColor(analysis.trend)}`}>
            {analysis.trend}
          </p>
        </div>
      </div>

      {/* Trading Signal */}
      <div className="border border-gray-700 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold text-white">Trading Signal</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSignalColor(analysis.signals.type)}`}>
            {analysis.signals.type}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-400">Strength</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${analysis.signals.strength > 70 ? 'bg-green-500' : 
                  analysis.signals.strength > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${analysis.signals.strength}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{analysis.signals.strength}%</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-400">Confidence</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${analysis.signals.confidence > 70 ? 'bg-green-500' : 
                  analysis.signals.confidence > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${analysis.signals.confidence}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{analysis.signals.confidence}%</p>
          </div>
        </div>

        {/* Entry/Exit Levels */}
        {analysis.signals.entryPrice && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Entry</p>
              <p className="text-white font-mono">${analysis.signals.entryPrice.toFixed(2)}</p>
            </div>
            {analysis.signals.stopLoss && (
              <div>
                <p className="text-gray-400">Stop Loss</p>
                <p className="text-red-400 font-mono">${analysis.signals.stopLoss.toFixed(2)}</p>
              </div>
            )}
            {analysis.signals.takeProfit && (
              <div>
                <p className="text-gray-400">Take Profit</p>
                <p className="text-green-400 font-mono">${analysis.signals.takeProfit.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analysis Reasoning */}
      <div className="border border-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-3">Analysis Reasoning</h4>
        <ul className="space-y-2">
          {analysis.signals.reasoning.map((reason, index) => (
            <li key={index} className="text-sm text-gray-300 flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Technical Indicators */}
      <div className="border border-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-3">Technical Indicators</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">RSI</p>
            <p className="text-white font-mono">
              {analysis.indicators.rsi ? analysis.indicators.rsi.toFixed(2) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">SMA 20</p>
            <p className="text-white font-mono">
              {analysis.indicators.sma20 ? `$${analysis.indicators.sma20.toFixed(2)}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">MACD</p>
            <p className="text-white font-mono">
              {analysis.indicators.macd.macd ? analysis.indicators.macd.macd.toFixed(4) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">BB Upper</p>
            <p className="text-white font-mono">
              {analysis.indicators.bollinger.upper ? `$${analysis.indicators.bollinger.upper.toFixed(2)}` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Support/Resistance */}
      {(analysis.support || analysis.resistance) && (
        <div className="border border-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-3">Support & Resistance</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Support</p>
              <p className="text-green-400 font-mono">
                {analysis.support ? `$${analysis.support.toFixed(2)}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Resistance</p>
              <p className="text-red-400 font-mono">
                {analysis.resistance ? `$${analysis.resistance.toFixed(2)}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Patterns */}
      {analysis.patterns.length > 0 && (
        <div className="border border-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-3">Detected Patterns</h4>
          <div className="space-y-2">
            {analysis.patterns.map((pattern, index) => (
              <span key={index} className="inline-block bg-blue-900/20 text-blue-300 px-2 py-1 rounded text-sm mr-2">
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}