import { ProcessedCandle } from './binance';
import { TechnicalIndicators } from './technical-analysis';
import { TradingSignal, MarketAnalysis } from './ai-analyzer';

declare global {
  interface Window {
    claude?: {
      complete: (prompt: string) => Promise<string>;
    };
  }
}

export interface AIAnalysisResult {
  signal: TradingSignal;
  marketSentiment: string;
  keyFactors: string[];
  riskAssessment: string;
  timeHorizon: string;
  confidenceReasoning: string;
  aiSource: 'Real AI' | 'Mock AI';
}

export class ClaudeAI {
  static async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && 
           typeof window.claude?.complete === 'function';
  }

  static async mockAnalyze(candles: ProcessedCandle[], indicators: TechnicalIndicators): Promise<AIAnalysisResult> {
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const currentPrice = candles[candles.length - 1].close;
    const rsi = indicators.rsi || 50;
    
    // Generate mock analysis based on technical indicators
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let strength = 50;
    let confidence = 60;
    const reasoning: string[] = [];

    if (rsi < 30) {
      signal = 'BUY';
      strength = 75;
      confidence = 80;
      reasoning.push(`RSI oversold at ${rsi.toFixed(2)} - strong buy signal`);
      reasoning.push('Historical support level nearby');
      reasoning.push('Volume confirms accumulation pattern');
    } else if (rsi > 70) {
      signal = 'SELL';
      strength = 70;
      confidence = 75;
      reasoning.push(`RSI overbought at ${rsi.toFixed(2)} - potential reversal`);
      reasoning.push('Resistance level reached');
      reasoning.push('Profit-taking pressure expected');
    } else {
      reasoning.push('Market in neutral zone - wait for clearer signals');
      reasoning.push('Volume analysis shows indecision');
      reasoning.push('Technical indicators mixed');
    }

    return {
      signal: {
        type: signal,
        strength,
        confidence,
        reasoning,
        entryPrice: currentPrice,
        stopLoss: signal === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02,
        takeProfit: signal === 'BUY' ? currentPrice * 1.04 : currentPrice * 0.96
      },
      marketSentiment: signal === 'BUY' ? 'Cautiously optimistic with oversold bounce potential' :
                      signal === 'SELL' ? 'Bearish momentum building, consider profit taking' :
                      'Neutral consolidation phase, waiting for direction',
      keyFactors: [
        `Current RSI: ${rsi.toFixed(2)}`,
        `Price level: $${currentPrice.toFixed(2)}`,
        'Volume profile analysis',
        'Market microstructure signals'
      ],
      riskAssessment: signal === 'HOLD' ? 'Medium risk - unclear direction' :
                     `${signal === 'BUY' ? 'Moderate' : 'Elevated'} risk with defined stop-loss`,
      timeHorizon: 'Short to medium term (1-7 days)',
      confidenceReasoning: `${confidence}% confidence based on ${reasoning.length} confirming factors and current market volatility`,
      aiSource: 'Mock AI'
    };
  }

  static async analyzeMarket(
    candles: ProcessedCandle[], 
    indicators: TechnicalIndicators
  ): Promise<AIAnalysisResult> {
    if (!await this.isAvailable()) {
      throw new Error('Claude AI not available in this context');
    }

    const currentCandle = candles[candles.length - 1];
    const recentCandles = candles.slice(-10);
    
    const prompt = this.buildAnalysisPrompt(currentCandle, recentCandles, indicators);
    
    try {
      const response = await window.claude!.complete(prompt);
      return this.parseAIResponse(response, currentCandle.close);
    } catch (error) {
      console.error('Claude AI analysis failed:', error);
      throw new Error('Failed to get AI analysis');
    }
  }

  private static buildAnalysisPrompt(
    currentCandle: ProcessedCandle,
    recentCandles: ProcessedCandle[],
    indicators: TechnicalIndicators
  ): string {
    return `As a professional cryptocurrency trader, analyze the current BTCUSD market conditions and provide trading recommendations.

CURRENT MARKET DATA:
- Current Price: $${currentCandle.close.toFixed(2)}
- Current Volume: ${currentCandle.volume.toFixed(0)}
- High: $${currentCandle.high.toFixed(2)}
- Low: $${currentCandle.low.toFixed(2)}

TECHNICAL INDICATORS:
- RSI: ${indicators.rsi?.toFixed(2) || 'N/A'}
- MACD: ${indicators.macd.macd?.toFixed(4) || 'N/A'} | Signal: ${indicators.macd.signal?.toFixed(4) || 'N/A'}
- SMA 20: $${indicators.sma20?.toFixed(2) || 'N/A'}
- SMA 50: $${indicators.sma50?.toFixed(2) || 'N/A'}
- EMA 12: $${indicators.ema12?.toFixed(2) || 'N/A'}
- EMA 26: $${indicators.ema26?.toFixed(2) || 'N/A'}
- Bollinger Upper: $${indicators.bollinger.upper?.toFixed(2) || 'N/A'}
- Bollinger Lower: $${indicators.bollinger.lower?.toFixed(2) || 'N/A'}

RECENT PRICE ACTION (Last 10 candles):
${recentCandles.map((candle, i) => 
  `${i + 1}. Open: $${candle.open.toFixed(2)}, Close: $${candle.close.toFixed(2)}, Vol: ${candle.volume.toFixed(0)}`
).join('\n')}

Please provide your analysis in the following JSON format:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "strength": 0-100,
  "confidence": 0-100,
  "reasoning": ["reason1", "reason2", "reason3"],
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "marketSentiment": "Brief sentiment description",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "riskAssessment": "Risk level and explanation",
  "timeHorizon": "Short/Medium/Long term outlook",
  "confidenceReasoning": "Why this confidence level"
}

Focus on:
1. Current market momentum and trend direction
2. Support/resistance levels
3. Volume analysis and market participation
4. Risk-reward ratio for potential trades
5. Market microstructure and order flow implications
6. Potential catalysts or concerns

Be specific about entry points, stop losses, and take profit levels based on current price action.`;
  }

  private static parseAIResponse(response: string, currentPrice: number): AIAnalysisResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and structure the response
      const signal: TradingSignal = {
        type: parsed.signal || 'HOLD',
        strength: Math.min(100, Math.max(0, parsed.strength || 50)),
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : ['AI analysis completed'],
        entryPrice: parsed.entryPrice || currentPrice,
        stopLoss: parsed.stopLoss || (parsed.signal === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02),
        takeProfit: parsed.takeProfit || (parsed.signal === 'BUY' ? currentPrice * 1.04 : currentPrice * 0.96)
      };

      return {
        signal,
        marketSentiment: parsed.marketSentiment || 'Neutral market conditions',
        keyFactors: Array.isArray(parsed.keyFactors) ? parsed.keyFactors : ['Technical analysis'],
        riskAssessment: parsed.riskAssessment || 'Moderate risk',
        timeHorizon: parsed.timeHorizon || 'Short term',
        confidenceReasoning: parsed.confidenceReasoning || 'Based on technical indicators',
        aiSource: 'Real AI'
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Return fallback analysis
      return {
        signal: {
          type: 'HOLD',
          strength: 50,
          confidence: 30,
          reasoning: ['AI parsing failed, manual review recommended'],
          entryPrice: currentPrice
        },
        marketSentiment: 'Unable to determine sentiment',
        keyFactors: ['AI analysis unavailable'],
        riskAssessment: 'High risk - manual analysis required',
        timeHorizon: 'Uncertain',
        confidenceReasoning: 'Low confidence due to parsing error',
        aiSource: 'Real AI'
      };
    }
  }

  static async generateMarketAnalysis(
    candles: ProcessedCandle[],
    indicators: TechnicalIndicators,
    currentTrend: string
  ): Promise<MarketAnalysis> {
    const currentCandle = candles[candles.length - 1];
    
    try {
      const aiResult = await this.analyzeMarket(candles, indicators);
      
      return {
        currentPrice: currentCandle.close,
        trend: currentTrend as 'BULLISH' | 'BEARISH' | 'SIDEWAYS',
        signals: aiResult.signal,
        indicators,
        patterns: [
          `AI Sentiment: ${aiResult.marketSentiment}`,
          `Risk Level: ${aiResult.riskAssessment}`,
          `Time Horizon: ${aiResult.timeHorizon}`
        ],
        support: aiResult.signal.stopLoss || null,
        resistance: aiResult.signal.takeProfit || null
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw error;
    }
  }
}