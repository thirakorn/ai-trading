import { ProcessedCandle } from './binance';
import { TechnicalAnalysis, TechnicalIndicators } from './technical-analysis';

export interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 0-100
  confidence: number; // 0-100
  reasoning: string[];
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface MarketAnalysis {
  currentPrice: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  signals: TradingSignal;
  indicators: TechnicalIndicators;
  patterns: string[];
  support: number | null;
  resistance: number | null;
}

export class AIAnalyzer {
  static analyzeMarket(candles: ProcessedCandle[]): MarketAnalysis {
    if (candles.length === 0) {
      throw new Error('No candlestick data provided');
    }

    const currentCandle = candles[candles.length - 1];
    const indicators = TechnicalAnalysis.calculateAllIndicators(candles);
    const trend = this.determineTrend(candles, indicators);
    const signals = this.generateSignals(candles, indicators, trend);
    const patterns = this.identifyPatterns(candles);
    const { support, resistance } = this.findSupportResistance(candles);

    return {
      currentPrice: currentCandle.close,
      trend,
      signals,
      indicators,
      patterns,
      support,
      resistance
    };
  }

  private static determineTrend(candles: ProcessedCandle[], indicators: TechnicalIndicators): 'BULLISH' | 'BEARISH' | 'SIDEWAYS' {
    const currentPrice = candles[candles.length - 1].close;
    let bullishSignals = 0;
    let bearishSignals = 0;

    // SMA trend analysis
    if (indicators.sma20 && indicators.sma50) {
      if (indicators.sma20 > indicators.sma50) bullishSignals++;
      else bearishSignals++;
    }

    // Price vs SMA
    if (indicators.sma20) {
      if (currentPrice > indicators.sma20) bullishSignals++;
      else bearishSignals++;
    }

    // RSI analysis
    if (indicators.rsi) {
      if (indicators.rsi < 30) bullishSignals++; // Oversold
      else if (indicators.rsi > 70) bearishSignals++; // Overbought
    }

    // MACD analysis
    if (indicators.macd.macd && indicators.macd.signal) {
      if (indicators.macd.macd > indicators.macd.signal) bullishSignals++;
      else bearishSignals++;
    }

    if (bullishSignals > bearishSignals) return 'BULLISH';
    if (bearishSignals > bullishSignals) return 'BEARISH';
    return 'SIDEWAYS';
  }

  private static generateSignals(candles: ProcessedCandle[], indicators: TechnicalIndicators, trend: string): TradingSignal {
    const currentPrice = candles[candles.length - 1].close;
    const reasoning: string[] = [];
    let signalType: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let strength = 0;
    let confidence = 50;

    // RSI-based signals
    if (indicators.rsi) {
      if (indicators.rsi < 30) {
        reasoning.push(`RSI oversold at ${indicators.rsi.toFixed(2)} - potential buy opportunity`);
        signalType = 'BUY';
        strength += 30;
        confidence += 20;
      } else if (indicators.rsi > 70) {
        reasoning.push(`RSI overbought at ${indicators.rsi.toFixed(2)} - potential sell opportunity`);
        signalType = 'SELL';
        strength += 30;
        confidence += 20;
      }
    }

    // MACD signals
    if (indicators.macd.macd && indicators.macd.signal) {
      if (indicators.macd.macd > indicators.macd.signal && indicators.macd.histogram && indicators.macd.histogram > 0) {
        reasoning.push('MACD bullish crossover detected');
        if (signalType === 'HOLD') signalType = 'BUY';
        strength += 25;
        confidence += 15;
      } else if (indicators.macd.macd < indicators.macd.signal && indicators.macd.histogram && indicators.macd.histogram < 0) {
        reasoning.push('MACD bearish crossover detected');
        if (signalType === 'HOLD') signalType = 'SELL';
        strength += 25;
        confidence += 15;
      }
    }

    // Bollinger Bands signals
    if (indicators.bollinger.upper && indicators.bollinger.lower) {
      if (currentPrice <= indicators.bollinger.lower) {
        reasoning.push('Price touching lower Bollinger Band - potential bounce');
        if (signalType === 'HOLD') signalType = 'BUY';
        strength += 20;
        confidence += 10;
      } else if (currentPrice >= indicators.bollinger.upper) {
        reasoning.push('Price touching upper Bollinger Band - potential reversal');
        if (signalType === 'HOLD') signalType = 'SELL';
        strength += 20;
        confidence += 10;
      }
    }

    // Trend confirmation
    if (trend === 'BULLISH' && signalType === 'BUY') {
      reasoning.push('Signal aligns with bullish trend');
      confidence += 15;
    } else if (trend === 'BEARISH' && signalType === 'SELL') {
      reasoning.push('Signal aligns with bearish trend');
      confidence += 15;
    } else if (trend === 'SIDEWAYS') {
      reasoning.push('Market in sideways trend - use caution');
      confidence -= 10;
    }

    // Price action analysis
    const recentCandles = candles.slice(-5);
    const isUptrend = recentCandles.every((candle, i) => 
      i === 0 || candle.close > recentCandles[i - 1].close
    );
    const isDowntrend = recentCandles.every((candle, i) => 
      i === 0 || candle.close < recentCandles[i - 1].close
    );

    if (isUptrend && signalType === 'BUY') {
      reasoning.push('Strong upward momentum in recent candles');
      strength += 15;
    } else if (isDowntrend && signalType === 'SELL') {
      reasoning.push('Strong downward momentum in recent candles');
      strength += 15;
    }

    // Ensure values are within bounds
    strength = Math.min(100, Math.max(0, strength));
    confidence = Math.min(100, Math.max(0, confidence));

    // Set entry levels
    const entryPrice = currentPrice;
    let stopLoss: number | undefined;
    let takeProfit: number | undefined;

    if (signalType === 'BUY') {
      stopLoss = currentPrice * 0.98; // 2% stop loss
      takeProfit = currentPrice * 1.04; // 4% take profit
    } else if (signalType === 'SELL') {
      stopLoss = currentPrice * 1.02; // 2% stop loss
      takeProfit = currentPrice * 0.96; // 4% take profit
    }

    if (reasoning.length === 0) {
      reasoning.push('No clear signals detected - market analysis suggests holding position');
    }

    return {
      type: signalType,
      strength,
      confidence,
      reasoning,
      entryPrice,
      stopLoss,
      takeProfit
    };
  }

  private static identifyPatterns(candles: ProcessedCandle[]): string[] {
    const patterns: string[] = [];
    
    if (candles.length < 3) return patterns;

    const recent = candles.slice(-3);
    
    // Doji pattern
    if (Math.abs(recent[2].open - recent[2].close) < (recent[2].high - recent[2].low) * 0.1) {
      patterns.push('Doji - Indecision');
    }

    // Hammer/Shooting Star
    const bodySize = Math.abs(recent[2].close - recent[2].open);
    const upperWick = recent[2].high - Math.max(recent[2].open, recent[2].close);
    const lowerWick = Math.min(recent[2].open, recent[2].close) - recent[2].low;

    if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5) {
      patterns.push('Hammer - Potential reversal');
    }

    if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5) {
      patterns.push('Shooting Star - Potential reversal');
    }

    // Engulfing patterns
    if (recent.length >= 2) {
      const prev = recent[1];
      const curr = recent[2];
      
      if (prev.close < prev.open && curr.close > curr.open && 
          curr.close > prev.open && curr.open < prev.close) {
        patterns.push('Bullish Engulfing');
      }
      
      if (prev.close > prev.open && curr.close < curr.open && 
          curr.close < prev.open && curr.open > prev.close) {
        patterns.push('Bearish Engulfing');
      }
    }

    return patterns;
  }

  private static findSupportResistance(candles: ProcessedCandle[]): { support: number | null; resistance: number | null } {
    if (candles.length < 20) return { support: null, resistance: null };

    const recent = candles.slice(-20);
    const lows = recent.map(c => c.low).sort((a, b) => a - b);
    const highs = recent.map(c => c.high).sort((a, b) => b - a);

    // Find support (lowest lows cluster)
    const support = lows.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
    
    // Find resistance (highest highs cluster)
    const resistance = highs.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;

    return { support, resistance };
  }
}