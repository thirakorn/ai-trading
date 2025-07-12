import { ProcessedCandle } from './binance';
import { Time } from 'lightweight-charts';

export interface IndicatorDataPoint {
  time: Time;
  value: number;
}

export interface TechnicalIndicators {
  sma20: number | null;
  sma50: number | null;
  ema12: number | null;
  ema26: number | null;
  rsi: number | null;
  macd: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  };
  bollinger: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  };
}

export interface IndicatorArrays {
  rsi: IndicatorDataPoint[];
  macd: {
    macd: IndicatorDataPoint[];
    signal: IndicatorDataPoint[];
    histogram: IndicatorDataPoint[];
  };
}

export class TechnicalAnalysis {
  static calculateSMA(candles: ProcessedCandle[], period: number): number | null {
    if (candles.length < period) {
      console.log('SMA: Not enough data', candles.length, 'need', period);
      return null;
    }
    
    const sum = candles.slice(-period).reduce((acc, candle) => acc + candle.close, 0);
    const sma = sum / period;
    console.log(`SMA${period} calculated:`, sma);
    return sma;
  }
  
  static calculateEMA(candles: ProcessedCandle[], period: number): number | null {
    if (candles.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = candles.slice(0, period).reduce((acc, candle) => acc + candle.close, 0) / period;
    
    for (let i = period; i < candles.length; i++) {
      ema = (candles[i].close * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }
  
  static calculateRSI(candles: ProcessedCandle[], period = 14): number | null {
    if (candles.length < period + 1) {
      console.log('RSI: Not enough data', candles.length, 'need', period + 1);
      return null;
    }
    
    let gains = 0;
    let losses = 0;
    
    // Start from index 1 to compare with previous candle
    for (let i = candles.length - period; i < candles.length; i++) {
      if (i > 0) {
        const change = candles[i].close - candles[i - 1].close;
        if (change > 0) {
          gains += change;
        } else {
          losses -= change;
        }
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    console.log('RSI calculated:', rsi, 'gains:', avgGain, 'losses:', avgLoss);
    return rsi;
  }

  static calculateRSIArray(candles: ProcessedCandle[], period = 14): IndicatorDataPoint[] {
    if (candles.length < period + 1) {
      return [];
    }

    const rsiData: IndicatorDataPoint[] = [];
    
    for (let i = period; i < candles.length; i++) {
      let gains = 0;
      let losses = 0;
      
      // Calculate gains and losses for current period
      for (let j = i - period + 1; j <= i; j++) {
        if (j > 0) {
          const change = candles[j].close - candles[j - 1].close;
          if (change > 0) {
            gains += change;
          } else {
            losses -= change;
          }
        }
      }
      
      const avgGain = gains / period;
      const avgLoss = losses / period;
      
      let rsi = 50; // Default neutral value
      if (avgLoss !== 0) {
        const rs = avgGain / avgLoss;
        rsi = 100 - (100 / (1 + rs));
      } else if (avgGain > 0) {
        rsi = 100; // All gains, no losses
      }
      
      rsiData.push({
        time: candles[i].time as Time,
        value: rsi
      });
    }
    
    return rsiData;
  }
  
  static calculateMACD(candles: ProcessedCandle[]): { macd: number | null; signal: number | null; histogram: number | null } {
    const ema12 = this.calculateEMA(candles, 12);
    const ema26 = this.calculateEMA(candles, 26);
    
    if (!ema12 || !ema26) {
      return { macd: null, signal: null, histogram: null };
    }
    
    const macd = ema12 - ema26;
    
    // For signal line, we would need to calculate EMA of MACD values
    // Simplified version for now
    const signal = macd * 0.9; // Simplified approximation
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  static calculateMACDArray(candles: ProcessedCandle[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
    macd: IndicatorDataPoint[];
    signal: IndicatorDataPoint[];
    histogram: IndicatorDataPoint[];
  } {
    if (candles.length < slowPeriod) {
      return { macd: [], signal: [], histogram: [] };
    }

    // Calculate EMA arrays for fast and slow periods
    const ema12Array = this.calculateEMAArray(candles, fastPeriod);
    const ema26Array = this.calculateEMAArray(candles, slowPeriod);
    
    if (ema12Array.length === 0 || ema26Array.length === 0) {
      return { macd: [], signal: [], histogram: [] };
    }

    // Calculate MACD line (EMA12 - EMA26)
    const macdData: IndicatorDataPoint[] = [];
    const minLength = Math.min(ema12Array.length, ema26Array.length);
    
    for (let i = 0; i < minLength; i++) {
      if (ema12Array[i].time === ema26Array[i].time) {
        macdData.push({
          time: ema12Array[i].time,
          value: ema12Array[i].value - ema26Array[i].value
        });
      }
    }

    // Calculate Signal line (EMA of MACD)
    const signalData = this.calculateEMAFromArray(macdData, signalPeriod);
    
    // Calculate Histogram (MACD - Signal)
    const histogramData: IndicatorDataPoint[] = [];
    const histMinLength = Math.min(macdData.length, signalData.length);
    
    for (let i = 0; i < histMinLength; i++) {
      if (macdData[i].time === signalData[i].time) {
        histogramData.push({
          time: macdData[i].time,
          value: macdData[i].value - signalData[i].value
        });
      }
    }

    return {
      macd: macdData,
      signal: signalData,
      histogram: histogramData
    };
  }

  static calculateEMAArray(candles: ProcessedCandle[], period: number): IndicatorDataPoint[] {
    if (candles.length < period) {
      return [];
    }

    const emaData: IndicatorDataPoint[] = [];
    const multiplier = 2 / (period + 1);
    
    // Calculate initial SMA for first EMA value
    let ema = candles.slice(0, period).reduce((acc, candle) => acc + candle.close, 0) / period;
    
    // Add first EMA point
    emaData.push({
      time: candles[period - 1].time as Time,
      value: ema
    });
    
    // Calculate remaining EMA values
    for (let i = period; i < candles.length; i++) {
      ema = (candles[i].close * multiplier) + (ema * (1 - multiplier));
      emaData.push({
        time: candles[i].time as Time,
        value: ema
      });
    }
    
    return emaData;
  }

  static calculateEMAFromArray(data: IndicatorDataPoint[], period: number): IndicatorDataPoint[] {
    if (data.length < period) {
      return [];
    }

    const emaData: IndicatorDataPoint[] = [];
    const multiplier = 2 / (period + 1);
    
    // Calculate initial SMA for first EMA value
    let ema = data.slice(0, period).reduce((acc, point) => acc + point.value, 0) / period;
    
    // Add first EMA point
    emaData.push({
      time: data[period - 1].time,
      value: ema
    });
    
    // Calculate remaining EMA values
    for (let i = period; i < data.length; i++) {
      ema = (data[i].value * multiplier) + (ema * (1 - multiplier));
      emaData.push({
        time: data[i].time,
        value: ema
      });
    }
    
    return emaData;
  }
  
  static calculateBollingerBands(candles: ProcessedCandle[], period = 20, stdDev = 2): { upper: number | null; middle: number | null; lower: number | null } {
    const sma = this.calculateSMA(candles, period);
    
    if (!sma || candles.length < period) {
      console.log('Bollinger: Not enough data or SMA failed');
      return { upper: null, middle: null, lower: null };
    }
    
    const recentCandles = candles.slice(-period);
    const variance = recentCandles.reduce((acc, candle) => {
      return acc + Math.pow(candle.close - sma, 2);
    }, 0) / period;
    
    const standardDeviation = Math.sqrt(variance);
    
    const result = {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
    
    console.log('Bollinger calculated:', result);
    return result;
  }
  
  static calculateAllIndicators(candles: ProcessedCandle[]): TechnicalIndicators {
    console.log('Calculating indicators for', candles.length, 'candles');
    console.log('First candle:', candles[0]);
    console.log('Last candle:', candles[candles.length - 1]);
    
    const indicators = {
      sma20: this.calculateSMA(candles, 20),
      sma50: this.calculateSMA(candles, 50),
      ema12: this.calculateEMA(candles, 12),
      ema26: this.calculateEMA(candles, 26),
      rsi: this.calculateRSI(candles),
      macd: this.calculateMACD(candles),
      bollinger: this.calculateBollingerBands(candles)
    };
    
    console.log('Final indicators:', indicators);
    return indicators;
  }

  static calculateIndicatorArrays(candles: ProcessedCandle[]): IndicatorArrays {
    console.log('Calculating indicator arrays for', candles.length, 'candles');
    
    const rsiArray = this.calculateRSIArray(candles);
    const macdArrays = this.calculateMACDArray(candles);
    
    console.log('RSI array length:', rsiArray.length);
    console.log('MACD array lengths:', {
      macd: macdArrays.macd.length,
      signal: macdArrays.signal.length,
      histogram: macdArrays.histogram.length
    });
    
    return {
      rsi: rsiArray,
      macd: macdArrays
    };
  }
}