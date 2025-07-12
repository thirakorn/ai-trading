'use client';

import { useState, useEffect } from 'react';
import { ClaudeAI, AIAnalysisResult } from '@/lib/claude-ai';
import { ProcessedCandle, BinanceInterval, binanceFetcher } from '@/lib/binance';
import { TechnicalIndicators, TechnicalAnalysis } from '@/lib/technical-analysis';

interface AIAnalysisPanelProps {
  candles: ProcessedCandle[];
  indicators: TechnicalIndicators | null;
  isLoading?: boolean;
  currentTimeframe?: BinanceInterval;
}

const timeframeOptions: { value: BinanceInterval; label: string; category: string }[] = [
  // Minutes Group
  { value: '1m', label: '1 Minute', category: 'Minutes' },
  { value: '3m', label: '3 Minutes', category: 'Minutes' },
  { value: '5m', label: '5 Minutes', category: 'Minutes' },
  { value: '15m', label: '15 Minutes', category: 'Minutes' },
  { value: '30m', label: '30 Minutes', category: 'Minutes' },
  
  // Hours Group  
  { value: '1h', label: '1 Hour', category: 'Hours' },
  { value: '2h', label: '2 Hours', category: 'Hours' },
  { value: '4h', label: '4 Hours', category: 'Hours' },
  { value: '6h', label: '6 Hours', category: 'Hours' },
  { value: '8h', label: '8 Hours', category: 'Hours' },
  { value: '12h', label: '12 Hours', category: 'Hours' },
  
  // Days+ Group
  { value: '1d', label: '1 Day', category: 'Days+' },
  { value: '3d', label: '3 Days', category: 'Days+' },
  { value: '1w', label: '1 Week', category: 'Days+' },
  { value: '1M', label: '1 Month', category: 'Days+' }
];

// Group options by category
const groupedOptions = timeframeOptions.reduce((acc, option) => {
  if (!acc[option.category]) {
    acc[option.category] = [];
  }
  acc[option.category].push(option);
  return acc;
}, {} as Record<string, typeof timeframeOptions>);

export default function AIAnalysisPanel({ candles, indicators, currentTimeframe = '5m' }: AIAnalysisPanelProps) {
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAIAvailable, setIsAIAvailable] = useState(false);
  const [isInArtifacts, setIsInArtifacts] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<BinanceInterval>(currentTimeframe);

  // Check AI availability on mount
  useEffect(() => {
    const checkAIAvailability = async () => {
      const available = await ClaudeAI.isAvailable();
      const inArtifacts = ClaudeAI.isInClaudeArtifacts();
      
      setIsAIAvailable(available);
      setIsInArtifacts(inArtifacts);
      
      console.log('AI Availability Status:', {
        available,
        inArtifacts,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A'
      });
    };
    
    checkAIAvailability();
  }, []);

  // Manual AI analysis function
  const handleAnalyzeClick = async (useMock = false) => {
    setIsAILoading(true);
    setAiError(null);
    
    try {
      // Fetch data for selected timeframe if different from current
      let analysisCandles = candles;
      let analysisIndicators = indicators;
      
      if (selectedTimeframe !== currentTimeframe) {
        console.log(`Fetching ${selectedTimeframe} data for AI analysis...`);
        analysisCandles = await binanceFetcher.fetchKlines('BTCUSDT', selectedTimeframe, 100);
        analysisIndicators = TechnicalAnalysis.calculateAllIndicators(analysisCandles);
      }
      
      if (!analysisIndicators || analysisCandles.length === 0) {
        throw new Error('No data available for analysis');
      }
      
      let result: AIAnalysisResult;
      
      if (useMock || !isAIAvailable) {
        // Use mock analysis
        result = await ClaudeAI.mockAnalyze(analysisCandles, analysisIndicators);
      } else {
        // Use real AI analysis
        result = await ClaudeAI.analyzeMarket(analysisCandles, analysisIndicators);
      }
      
      setAiResult(result);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI analysis failed');
      console.error('AI Analysis error:', error);
    } finally {
      setIsAILoading(false);
    }
  };

  // Clear results function
  const handleClearResults = () => {
    setAiResult(null);
    setAiError(null);
  };

  // Show development mode UI even if AI not available
  // const showDevelopmentMode = isDevelopmentMode || !isAIAvailable;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          isAILoading ? 'bg-yellow-500 animate-pulse' : 
          aiError ? 'bg-red-500' : 
          isAIAvailable ? 'bg-green-500' : 'bg-orange-500'
        }`}></div>
        AI Analysis
        {isAILoading && (
          <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        )}
      </h3>

      {/* Control Panel */}
      <div className="space-y-4 mb-6">
        {/* Current vs Selected Timeframe */}
        <div className="text-sm text-gray-400">
          <div>Currently viewing: <span className="text-blue-400 font-medium">{currentTimeframe.toUpperCase()}</span></div>
          <div>Analyze timeframe: <span className="text-green-400 font-medium">{selectedTimeframe.toUpperCase()}</span></div>
        </div>

        {/* Timeframe Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Timeframe for AI Analysis:
          </label>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as BinanceInterval)}
            disabled={isAILoading}
            className={`
              w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
              hover:bg-gray-600 transition-colors duration-200
              ${isAILoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {Object.entries(groupedOptions).map(([category, options]) => (
              <optgroup key={category} label={category} className="text-gray-300">
                {options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-gray-700 text-white"
                  >
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* AI Status Info */}
          <div className="text-xs text-gray-400 bg-gray-700 rounded p-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isAIAvailable ? 'bg-green-400' : 'bg-orange-400'}`}></div>
              <span>
                {isAIAvailable ? (
                  '🤖 Real Claude AI Connected'
                ) : isInArtifacts ? (
                  '⚙️ Artifacts Environment - Enable AI Features'
                ) : (
                  '🧪 Development Mode - Using Mock AI'
                )}
              </span>
            </div>
            
            {/* AI Status Details */}
            {!isAIAvailable && (
              <div className="mt-2 text-xs space-y-1">
                {isInArtifacts ? (
                  <div className="space-y-1">
                    <div className="text-green-400">✅ Running in Claude Artifacts</div>
                    <div className="text-red-400">❌ Real AI API not ready</div>
                    <div className="text-yellow-300">
                      💡 Enable &quot;Create AI-powered artifacts&quot; in Claude settings
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-red-400">❌ Not in Claude Artifacts environment</div>
                    <div className="text-red-400">❌ window.claude.complete() not available</div>
                    <div className="text-blue-300">
                      💡 Use Mock AI for testing or deploy to Claude Artifacts
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            {/* Real AI Button (if available) */}
            {isAIAvailable && (
              <button
                onClick={() => handleAnalyzeClick(false)}
                disabled={isAILoading}
                className={`
                  flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200
                  ${isAILoading 
                    ? 'bg-yellow-600 text-white cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                  flex items-center justify-center space-x-2
                `}
              >
                <span>🤖</span>
                <span>
                  {isAILoading ? 'Analyzing...' : `AI Analyze ${selectedTimeframe.toUpperCase()}`}
                </span>
              </button>
            )}

            {/* Mock AI Button (always available for testing) */}
            <button
              onClick={() => handleAnalyzeClick(true)}
              disabled={isAILoading}
              className={`
                ${isAIAvailable ? 'flex-1' : 'flex-1'} px-4 py-3 rounded-lg font-medium transition-all duration-200
                ${isAILoading 
                  ? 'bg-yellow-600 text-white cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                }
                flex items-center justify-center space-x-2
              `}
            >
              <span>🧪</span>
              <span>
                {isAILoading ? 'Analyzing...' : `Test Analyze ${selectedTimeframe.toUpperCase()}`}
              </span>
            </button>
            
            {(aiResult || aiError) && (
              <button
                onClick={handleClearResults}
                disabled={isAILoading}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {aiError && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{aiError}</p>
        </div>
      )}

      {isAILoading && !aiResult && (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">🧠</div>
          <p className="text-gray-400">AI analyzing market conditions...</p>
        </div>
      )}

      {aiResult && (
        <div className="space-y-4">
          {/* AI Source Indicator */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              aiResult.aiSource === 'Real AI' 
                ? 'bg-green-900/30 text-green-400 border border-green-700' 
                : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
            }`}>
              <span className="mr-1">
                {aiResult.aiSource === 'Real AI' ? '🤖' : '🧪'}
              </span>
              {aiResult.aiSource}
            </div>
          </div>
          
          {/* Trading Signal */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h4 className="font-medium mb-2">Trading Signal</h4>
            <div className="flex items-center justify-between mb-2">
              <span className={`px-3 py-1 rounded text-sm font-bold ${
                aiResult.signal.type === 'BUY' ? 'bg-green-600' :
                aiResult.signal.type === 'SELL' ? 'bg-red-600' : 'bg-gray-600'
              }`}>
                {aiResult.signal.type}
              </span>
              <div className="text-right">
                <div className="text-sm text-gray-400">Strength</div>
                <div className="font-bold">{aiResult.signal.strength}%</div>
              </div>
            </div>
            <div className="text-right mb-2">
              <div className="text-sm text-gray-400">Confidence</div>
              <div className="font-bold">{aiResult.signal.confidence}%</div>
            </div>
            {aiResult.signal.entryPrice && (
              <div className="text-sm text-gray-400">
                Entry: ${aiResult.signal.entryPrice.toFixed(2)}
                {aiResult.signal.stopLoss && (
                  <span className="ml-2">SL: ${aiResult.signal.stopLoss.toFixed(2)}</span>
                )}
                {aiResult.signal.takeProfit && (
                  <span className="ml-2">TP: ${aiResult.signal.takeProfit.toFixed(2)}</span>
                )}
              </div>
            )}
          </div>

          {/* Market Sentiment */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h4 className="font-medium mb-2">Market Sentiment</h4>
            <p className="text-sm text-gray-300">{aiResult.marketSentiment}</p>
          </div>

          {/* AI Reasoning */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h4 className="font-medium mb-2">AI Reasoning</h4>
            <ul className="space-y-1">
              {aiResult.signal.reasoning.map((reason, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Key Factors */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h4 className="font-medium mb-2">Key Factors</h4>
            <ul className="space-y-1">
              {aiResult.keyFactors.map((factor, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start">
                  <span className="text-yellow-400 mr-2">▸</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          {/* Risk & Time Horizon */}
          <div className="grid grid-cols-1 gap-4">
            <div className="border border-gray-700 rounded-lg p-3">
              <h5 className="font-medium text-sm mb-1">Risk Assessment</h5>
              <p className="text-xs text-gray-300">{aiResult.riskAssessment}</p>
            </div>
            <div className="border border-gray-700 rounded-lg p-3">
              <h5 className="font-medium text-sm mb-1">Time Horizon</h5>
              <p className="text-xs text-gray-300">{aiResult.timeHorizon}</p>
            </div>
          </div>

          {/* Confidence Reasoning */}
          <div className="border border-gray-700 rounded-lg p-3">
            <h5 className="font-medium text-sm mb-1">Confidence Reasoning</h5>
            <p className="text-xs text-gray-300">{aiResult.confidenceReasoning}</p>
          </div>
        </div>
      )}
    </div>
  );
}