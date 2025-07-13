'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ClaudeAI, AIAnalysisResult } from '@/lib/claude-ai';
import { ProcessedCandle, BinanceInterval, binanceFetcher } from '@/lib/binance';
import { TechnicalIndicators, TechnicalAnalysis } from '@/lib/technical-analysis';

interface AIAnalysisPanelProps {
  candles: ProcessedCandle[];
  indicators: TechnicalIndicators | null;
  isLoading?: boolean;
  currentTimeframe?: BinanceInterval;
  currentSymbol?: string;
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

export default function AIAnalysisPanel({ candles, indicators, currentTimeframe = '5m', currentSymbol = 'BTCUSDT' }: AIAnalysisPanelProps) {
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAIAvailable, setIsAIAvailable] = useState(false);
  const [isInArtifacts, setIsInArtifacts] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<BinanceInterval>(currentTimeframe);
  const hadPreviousResultRef = useRef(false);

  // Manual AI analysis function
  const handleAnalyzeClick = useCallback(async (useMock = false) => {
    setIsAILoading(true);
    setAiError(null);
    
    try {
      // Fetch data for selected timeframe if different from current
      let analysisCandles = candles;
      let analysisIndicators = indicators;
      
      if (selectedTimeframe !== currentTimeframe) {
        console.log(`Fetching ${selectedTimeframe} data for AI analysis...`);
        analysisCandles = await binanceFetcher.fetchKlines(currentSymbol, selectedTimeframe, 100);
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
      hadPreviousResultRef.current = true;
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI analysis failed');
      console.error('AI Analysis error:', error);
    } finally {
      setIsAILoading(false);
    }
  }, [candles, indicators, selectedTimeframe, currentTimeframe, currentSymbol, isAIAvailable]);

  // Auto-refresh when symbol changes
  useEffect(() => {
    const hadPreviousResult = hadPreviousResultRef.current;
    setAiResult(null);
    setAiError(null);
    console.log('Symbol changed to:', currentSymbol, '- clearing AI results');
    
    // Auto-trigger analysis if there was a previous result
    if (hadPreviousResult && candles.length > 0 && indicators) {
      console.log('Auto-triggering analysis for new symbol...');
      setTimeout(() => {
        handleAnalyzeClick(!isAIAvailable);
      }, 500); // Small delay to ensure data is loaded
    }
  }, [currentSymbol, handleAnalyzeClick, candles.length, indicators, isAIAvailable]);

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


  // Clear results function
  const handleClearResults = useCallback(() => {
    setAiResult(null);
    setAiError(null);
    hadPreviousResultRef.current = false;
  }, []);

  // Show development mode UI even if AI not available
  // const showDevelopmentMode = isDevelopmentMode || !isAIAvailable;

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <h3 className="text-lg font-semibold flex items-center">
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
        
        {/* Analysis Button */}
        <button
          onClick={() => handleAnalyzeClick(!isAIAvailable)}
          disabled={isAILoading}
          className={`
            w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm
            ${isAILoading 
              ? 'bg-yellow-600 text-white cursor-not-allowed' 
              : isAIAvailable 
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }
            flex items-center justify-center space-x-2
          `}
        >
          <span>{isAIAvailable ? '🤖' : '🧪'}</span>
          <span className="hidden xs:inline">
            {isAILoading ? 'Analyzing...' : 'Analysis'}
          </span>
          <span className="inline xs:hidden">
            {isAILoading ? '...' : 'Analyze'}
          </span>
        </button>
      </div>

      {/* Control Panel */}
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        {/* Current Symbol and Timeframe */}
        <div className="text-xs sm:text-sm text-gray-400 space-y-1">
          <div className="flex flex-col xs:flex-row xs:gap-4">
            <div>Trading Pair: <span className="text-yellow-400 font-medium">{currentSymbol.replace('USDT', '/USDT')}</span></div>
            <div>Currently: <span className="text-blue-400 font-medium">{currentTimeframe.toUpperCase()}</span></div>
          </div>
          <div>Analyze timeframe: <span className="text-green-400 font-medium">{selectedTimeframe.toUpperCase()}</span></div>
        </div>

        {/* Timeframe Selector */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
            Select Timeframe for AI Analysis:
          </label>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as BinanceInterval)}
            disabled={isAILoading}
            className={`
              w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm
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
          <div className="text-xs text-gray-400 bg-gray-700 rounded p-2 sm:p-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isAIAvailable ? 'bg-green-400' : 'bg-orange-400'}`}></div>
              <span className="text-xs">
                {isAIAvailable ? (
                  '🤖 Real Claude AI Connected'
                ) : isInArtifacts ? (
                  '⚙️ Artifacts Environment'
                ) : (
                  '🧪 Development Mode'
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
                      💡 Enable AI-powered artifacts in Claude settings
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-red-400">❌ Not in Claude Artifacts</div>
                    <div className="text-red-400">❌ window.claude.complete() not available</div>
                    <div className="text-blue-300">
                      💡 Use Mock AI for testing
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Real AI Button (if available) */}
            {isAIAvailable && (
              <button
                onClick={() => handleAnalyzeClick(false)}
                disabled={isAILoading}
                className={`
                  flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm
                  ${isAILoading 
                    ? 'bg-yellow-600 text-white cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                  flex items-center justify-center space-x-1 sm:space-x-2
                `}
              >
                <span>🤖</span>
                <span className="hidden sm:inline">
                  {isAILoading ? 'Analyzing...' : `AI Analyze ${selectedTimeframe.toUpperCase()}`}
                </span>
                <span className="inline sm:hidden">
                  {isAILoading ? 'AI...' : `AI ${selectedTimeframe.toUpperCase()}`}
                </span>
              </button>
            )}

            {/* Mock AI Button (always available for testing) */}
            <button
              onClick={() => handleAnalyzeClick(true)}
              disabled={isAILoading}
              className={`
                flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm
                ${isAILoading 
                  ? 'bg-yellow-600 text-white cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                }
                flex items-center justify-center space-x-1 sm:space-x-2
              `}
            >
              <span>🧪</span>
              <span className="hidden sm:inline">
                {isAILoading ? 'Analyzing...' : `Test Analyze ${selectedTimeframe.toUpperCase()}`}
              </span>
              <span className="inline sm:hidden">
                {isAILoading ? 'Test...' : `Test ${selectedTimeframe.toUpperCase()}`}
              </span>
            </button>
            
            {(aiResult || aiError) && (
              <button
                onClick={handleClearResults}
                disabled={isAILoading}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {aiError && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-xs sm:text-sm">{aiError}</p>
        </div>
      )}

      {isAILoading && !aiResult && (
        <div className="text-center py-6 sm:py-8">
          <div className="text-xl sm:text-2xl mb-2">🧠</div>
          <p className="text-gray-400 text-sm">AI analyzing market conditions...</p>
        </div>
      )}

      {aiResult && (
        <div className="space-y-3 sm:space-y-4">
          {/* AI Source Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold">Analysis Results</h3>
            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start ${
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
          <div className="border border-gray-700 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium mb-2 text-sm sm:text-base">Trading Signal</h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2">
              <span className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-bold self-start ${
                aiResult.signal.type === 'BUY' ? 'bg-green-600' :
                aiResult.signal.type === 'SELL' ? 'bg-red-600' : 'bg-gray-600'
              }`}>
                {aiResult.signal.type}
              </span>
              <div className="flex gap-4 sm:gap-6">
                <div className="text-left sm:text-right">
                  <div className="text-xs sm:text-sm text-gray-400">Strength</div>
                  <div className="font-bold text-sm sm:text-base">{aiResult.signal.strength}%</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs sm:text-sm text-gray-400">Confidence</div>
                  <div className="font-bold text-sm sm:text-base">{aiResult.signal.confidence}%</div>
                </div>
              </div>
            </div>
            {aiResult.signal.entryPrice && (
              <div className="text-xs sm:text-sm text-gray-400 mt-2">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span>Entry: ${aiResult.signal.entryPrice.toFixed(2)}</span>
                  {aiResult.signal.stopLoss && (
                    <span>SL: ${aiResult.signal.stopLoss.toFixed(2)}</span>
                  )}
                  {aiResult.signal.takeProfit && (
                    <span>TP: ${aiResult.signal.takeProfit.toFixed(2)}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Market Sentiment */}
          <div className="border border-gray-700 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium mb-2 text-sm sm:text-base">Market Sentiment</h4>
            <p className="text-xs sm:text-sm text-gray-300">{aiResult.marketSentiment}</p>
          </div>

          {/* AI Reasoning */}
          <div className="border border-gray-700 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium mb-2 text-sm sm:text-base">AI Reasoning</h4>
            <ul className="space-y-1">
              {aiResult.signal.reasoning.map((reason, index) => (
                <li key={index} className="text-xs sm:text-sm text-gray-300 flex items-start">
                  <span className="text-blue-400 mr-2 mt-0.5">•</span>
                  <span className="flex-1">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Factors */}
          <div className="border border-gray-700 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium mb-2 text-sm sm:text-base">Key Factors</h4>
            <ul className="space-y-1">
              {aiResult.keyFactors.map((factor, index) => (
                <li key={index} className="text-xs sm:text-sm text-gray-300 flex items-start">
                  <span className="text-yellow-400 mr-2 mt-0.5">▸</span>
                  <span className="flex-1">{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risk & Time Horizon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="border border-gray-700 rounded-lg p-2 sm:p-3">
              <h5 className="font-medium text-xs sm:text-sm mb-1">Risk Assessment</h5>
              <p className="text-xs text-gray-300">{aiResult.riskAssessment}</p>
            </div>
            <div className="border border-gray-700 rounded-lg p-2 sm:p-3">
              <h5 className="font-medium text-xs sm:text-sm mb-1">Time Horizon</h5>
              <p className="text-xs text-gray-300">{aiResult.timeHorizon}</p>
            </div>
          </div>

          {/* Confidence Reasoning */}
          <div className="border border-gray-700 rounded-lg p-2 sm:p-3">
            <h5 className="font-medium text-xs sm:text-sm mb-1">Confidence Reasoning</h5>
            <p className="text-xs text-gray-300">{aiResult.confidenceReasoning}</p>
          </div>
        </div>
      )}
    </div>
  );
}