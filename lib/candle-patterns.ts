import { ProcessedCandle } from './binance';

export interface CandlePatternInfo {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reliability: number; // 1-5 stars
  description: string;
  tradingImplication: string;
  when_to_trade: string;
  icon: string;
}

export interface DetectedPattern {
  pattern: CandlePatternInfo;
  confidence: number; // 0-100
  position: number; // Index in candles array where pattern was found
}

export const CANDLE_PATTERNS: Record<string, CandlePatternInfo> = {
  DOJI: {
    name: 'Doji',
    type: 'NEUTRAL',
    reliability: 3,
    description: 'เทียนที่มีราคาเปิดและปิดใกล้เคียงกัน แสดงถึงความไม่แน่นอนของตลาด',
    tradingImplication: 'สัญญาณความลังเลของตลาด รอสัญญาณยืนยันเพิ่มเติม',
    when_to_trade: 'รอเทียนถัดไปเพื่อยืนยันทิศทาง หลีกเลี่ยงการเทรดในขณะนี้',
    icon: '🟡'
  },
  
  HAMMER: {
    name: 'Hammer',
    type: 'BULLISH',
    reliability: 4,
    description: 'เทียนที่มีหางล่างยาวและตัวเทียนเล็ก พบที่จุดต่ำสุดของเทรนด์ลง',
    tradingImplication: 'สัญญาณการกลับตัวขึ้น แสดงว่าแรงขายอ่อนลง ผู้ซื้อเริ่มเข้ามา',
    when_to_trade: 'พิจารณาซื้อเมื่อพบที่ระดับ support หรือเทรนด์ลงระยะยาว',
    icon: '🟢'
  },
  
  SHOOTING_STAR: {
    name: 'Shooting Star',
    type: 'BEARISH',
    reliability: 4,
    description: 'เทียนที่มีหางบนยาวและตัวเทียนเล็ก พบที่จุดสูงสุดของเทรนด์ขึ้น',
    tradingImplication: 'สัญญาณการกลับตัวลง แสดงว่าแรงซื้ออ่อนลง ผู้ขายเริ่มเข้ามา',
    when_to_trade: 'พิจารณาขายเมื่อพบที่ระดับ resistance หรือเทรนด์ขึ้นระยะยาว',
    icon: '🔴'
  },
  
  BULLISH_ENGULFING: {
    name: 'Bullish Engulfing',
    type: 'BULLISH',
    reliability: 5,
    description: 'เทียนขาขึ้นใหญ่ที่กลืนเทียนขาลงก่อนหน้าทั้งหมด',
    tradingImplication: 'สัญญาณกลับตัวขึ้นที่แข็งแกร่ง แรงซื้อเอาชนะแรงขาย',
    when_to_trade: 'สัญญาณซื้อที่แข็งแกร่ง โดยเฉพาะที่ระดับ support ที่สำคัญ',
    icon: '🟢'
  },
  
  BEARISH_ENGULFING: {
    name: 'Bearish Engulfing',
    type: 'BEARISH',
    reliability: 5,
    description: 'เทียนขาลงใหญ่ที่กลืนเทียนขาขึ้นก่อนหน้าทั้งหมด',
    tradingImplication: 'สัญญาณกลับตัวลงที่แข็งแกร่ง แรงขายเอาชนะแรงซื้อ',
    when_to_trade: 'สัญญาณขายที่แข็งแกร่ง โดยเฉพาะที่ระดับ resistance ที่สำคัญ',
    icon: '🔴'
  },

  MORNING_STAR: {
    name: 'Morning Star',
    type: 'BULLISH',
    reliability: 5,
    description: 'แพทเทิร์น 3 เทียน: เทียนแดงยาว, เทียนเล็ก, เทียนเขียวยาว',
    tradingImplication: 'สัญญาณกลับตัวขึ้นที่แข็งแกร่งมาก เหมาะสำหรับเข้าซื้อ',
    when_to_trade: 'ซื้อหลังจากเทียนที่ 3 ปิด ตั้ง stop loss ที่จุดต่ำสุด',
    icon: '🟢'
  },

  EVENING_STAR: {
    name: 'Evening Star',
    type: 'BEARISH',
    reliability: 5,
    description: 'แพทเทิร์น 3 เทียน: เทียนเขียวยาว, เทียนเล็ก, เทียนแดงยาว',
    tradingImplication: 'สัญญาณกลับตัวลงที่แข็งแกร่งมาก เหมาะสำหรับเข้าขาย',
    when_to_trade: 'ขายหลังจากเทียนที่ 3 ปิด ตั้ง stop loss ที่จุดสูงสุด',
    icon: '🔴'
  },

  THREE_WHITE_SOLDIERS: {
    name: 'Three White Soldiers',
    type: 'BULLISH',
    reliability: 4,
    description: '3 เทียนเขียวติดกันที่เปิดสูงขึ้นเรื่อยๆ แสดงแรงซื้อต่อเนื่อง',
    tradingImplication: 'เทรนด์ขึ้นที่แข็งแกร่ง แรงซื้อมีความต่อเนื่อง',
    when_to_trade: 'เข้าซื้อในการ pullback หรือ breakout ของ resistance',
    icon: '🟢'
  },

  THREE_BLACK_CROWS: {
    name: 'Three Black Crows',
    type: 'BEARISH',
    reliability: 4,
    description: '3 เทียนแดงติดกันที่เปิดต่ำลงเรื่อยๆ แสดงแรงขายต่อเนื่อง',
    tradingImplication: 'เทรนด์ลงที่แข็งแกร่ง แรงขายมีความต่อเนื่อง',
    when_to_trade: 'เข้าขายในการ rally หรือ breakdown ของ support',
    icon: '🔴'
  },

  SPINNING_TOP: {
    name: 'Spinning Top',
    type: 'NEUTRAL',
    reliability: 2,
    description: 'เทียนที่มีตัวเล็กและหางบน-ล่างยาวเท่าๆ กัน แสดงความลังเล',
    tradingImplication: 'ความไม่แน่นอนของตลาด อาจเป็นการพักตัวก่อนเทรนด์ต่อ',
    when_to_trade: 'รอสัญญาณยืนยัน หลีกเลี่ยงการเปิดโพซิชั่นใหม่',
    icon: '🟡'
  },

  MARUBOZU_BULLISH: {
    name: 'Bullish Marubozu',
    type: 'BULLISH',
    reliability: 4,
    description: 'เทียนเขียวยาวที่ไม่มีหางบนและล่าง แสดงแรงซื้อที่แข็งแกร่ง',
    tradingImplication: 'แรงซื้อสุดจัด ราคาขึ้นตลอดช่วงเวลา',
    when_to_trade: 'สัญญาณซื้อที่แข็งแกร่ง โดยเฉพาะในเทรนด์ขึ้น',
    icon: '🟢'
  },

  MARUBOZU_BEARISH: {
    name: 'Bearish Marubozu',
    type: 'BEARISH',
    reliability: 4,
    description: 'เทียนแดงยาวที่ไม่มีหางบนและล่าง แสดงแรงขายที่แข็งแกร่ง',
    tradingImplication: 'แรงขายสุดจัด ราคาลงตลอดช่วงเวลา',
    when_to_trade: 'สัญญาณขายที่แข็งแกร่ง โดยเฉพาะในเทรนด์ลง',
    icon: '🔴'
  }
};

export class CandlePatternAnalyzer {
  static detectPatterns(candles: ProcessedCandle[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    
    if (candles.length < 1) return patterns;

    // Single candle patterns
    const lastCandle = candles[candles.length - 1];
    
    // Doji detection (improved)
    const bodySize = Math.abs(lastCandle.close - lastCandle.open);
    const fullRange = lastCandle.high - lastCandle.low;
    
    if (bodySize < fullRange * 0.1 && fullRange > 0) {
      patterns.push({
        pattern: CANDLE_PATTERNS.DOJI,
        confidence: 85,
        position: candles.length - 1
      });
    }

    // Hammer detection (improved)
    const upperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
    const lowerWick = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
    
    if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5 && bodySize > 0) {
      patterns.push({
        pattern: CANDLE_PATTERNS.HAMMER,
        confidence: 80,
        position: candles.length - 1
      });
    }

    // Shooting Star detection (improved)
    if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5 && bodySize > 0) {
      patterns.push({
        pattern: CANDLE_PATTERNS.SHOOTING_STAR,
        confidence: 80,
        position: candles.length - 1
      });
    }

    // Marubozu detection
    if (upperWick < fullRange * 0.01 && lowerWick < fullRange * 0.01) {
      if (lastCandle.close > lastCandle.open) {
        patterns.push({
          pattern: CANDLE_PATTERNS.MARUBOZU_BULLISH,
          confidence: 90,
          position: candles.length - 1
        });
      } else if (lastCandle.close < lastCandle.open) {
        patterns.push({
          pattern: CANDLE_PATTERNS.MARUBOZU_BEARISH,
          confidence: 90,
          position: candles.length - 1
        });
      }
    }

    // Spinning Top detection
    if (upperWick > bodySize * 1.5 && lowerWick > bodySize * 1.5 && 
        Math.abs(upperWick - lowerWick) < fullRange * 0.3) {
      patterns.push({
        pattern: CANDLE_PATTERNS.SPINNING_TOP,
        confidence: 70,
        position: candles.length - 1
      });
    }

    // Two candle patterns
    if (candles.length >= 2) {
      const prevCandle = candles[candles.length - 2];
      
      // Bullish Engulfing (improved)
      if (prevCandle.close < prevCandle.open && // Previous was bearish
          lastCandle.close > lastCandle.open &&   // Current is bullish
          lastCandle.close > prevCandle.open &&   // Current close > prev open
          lastCandle.open < prevCandle.close &&   // Current open < prev close
          Math.abs(lastCandle.close - lastCandle.open) > Math.abs(prevCandle.close - prevCandle.open) * 1.1) {
        patterns.push({
          pattern: CANDLE_PATTERNS.BULLISH_ENGULFING,
          confidence: 90,
          position: candles.length - 1
        });
      }
      
      // Bearish Engulfing (improved)
      if (prevCandle.close > prevCandle.open && // Previous was bullish
          lastCandle.close < lastCandle.open &&   // Current is bearish
          lastCandle.close < prevCandle.open &&   // Current close < prev open
          lastCandle.open > prevCandle.close &&   // Current open > prev close
          Math.abs(lastCandle.close - lastCandle.open) > Math.abs(prevCandle.close - prevCandle.open) * 1.1) {
        patterns.push({
          pattern: CANDLE_PATTERNS.BEARISH_ENGULFING,
          confidence: 90,
          position: candles.length - 1
        });
      }
    }

    // Three candle patterns
    if (candles.length >= 3) {
      const candle1 = candles[candles.length - 3];
      const candle2 = candles[candles.length - 2];
      const candle3 = candles[candles.length - 1];
      
      // Morning Star
      if (candle1.close < candle1.open && // First candle bearish
          Math.abs(candle2.close - candle2.open) < (candle2.high - candle2.low) * 0.3 && // Second candle small body
          candle3.close > candle3.open && // Third candle bullish
          candle3.close > (candle1.open + candle1.close) / 2) { // Third closes above midpoint of first
        patterns.push({
          pattern: CANDLE_PATTERNS.MORNING_STAR,
          confidence: 95,
          position: candles.length - 1
        });
      }
      
      // Evening Star
      if (candle1.close > candle1.open && // First candle bullish
          Math.abs(candle2.close - candle2.open) < (candle2.high - candle2.low) * 0.3 && // Second candle small body
          candle3.close < candle3.open && // Third candle bearish
          candle3.close < (candle1.open + candle1.close) / 2) { // Third closes below midpoint of first
        patterns.push({
          pattern: CANDLE_PATTERNS.EVENING_STAR,
          confidence: 95,
          position: candles.length - 1
        });
      }

      // Three White Soldiers
      if (candle1.close > candle1.open &&
          candle2.close > candle2.open &&
          candle3.close > candle3.open &&
          candle2.open > candle1.close * 0.99 &&
          candle2.open < candle1.close * 1.01 &&
          candle3.open > candle2.close * 0.99 &&
          candle3.open < candle2.close * 1.01) {
        patterns.push({
          pattern: CANDLE_PATTERNS.THREE_WHITE_SOLDIERS,
          confidence: 85,
          position: candles.length - 1
        });
      }

      // Three Black Crows
      if (candle1.close < candle1.open &&
          candle2.close < candle2.open &&
          candle3.close < candle3.open &&
          candle2.open < candle1.close * 1.01 &&
          candle2.open > candle1.close * 0.99 &&
          candle3.open < candle2.close * 1.01 &&
          candle3.open > candle2.close * 0.99) {
        patterns.push({
          pattern: CANDLE_PATTERNS.THREE_BLACK_CROWS,
          confidence: 85,
          position: candles.length - 1
        });
      }
    }

    return patterns;
  }

  static getReliabilityStars(reliability: number): string {
    return '⭐'.repeat(Math.max(1, Math.min(5, reliability)));
  }

  static getPatternTypeColor(type: 'BULLISH' | 'BEARISH' | 'NEUTRAL'): string {
    switch (type) {
      case 'BULLISH': return 'text-green-400 bg-green-900/20';
      case 'BEARISH': return 'text-red-400 bg-red-900/20';
      case 'NEUTRAL': return 'text-yellow-400 bg-yellow-900/20';
    }
  }
}