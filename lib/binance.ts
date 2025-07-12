import { binanceFetch } from './timeout-fetch';

export type CandlestickData = [
  number,  // openTime
  string,  // open
  string,  // high
  string,  // low
  string,  // close
  string,  // volume
  number,  // closeTime
  string,  // quoteAssetVolume
  number,  // numberOfTrades
  string,  // takerBuyBaseAssetVolume
  string,  // takerBuyQuoteAssetVolume
  string   // ignore
];

export interface ProcessedCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type BinanceInterval = 
  '1m' | '3m' | '5m' | '15m' | '30m' | 
  '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | 
  '1d' | '3d' | '1w' | '1M';

export interface TickerData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export class BinanceDataFetcher {
  private readonly baseUrl = '/api/binance';
  
  async fetchKlines(symbol = 'BTCUSDT', interval: BinanceInterval = '5m', limit = 100): Promise<ProcessedCandle[]> {
    const requestId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    
    try {
      const url = `${this.baseUrl}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      console.log(`[${requestId}] Fetching klines from:`, url);
      
      const response = await binanceFetch(url, {
        method: 'GET'
      });
      
      const fetchTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.text().catch(() => 'Unable to read error response');
        const errorDetails = {
          requestId,
          status: response.status,
          statusText: response.statusText,
          url,
          symbol,
          interval,
          limit,
          fetchTime: `${fetchTime}ms`,
          errorBody: errorData,
          headers: Object.fromEntries(response.headers.entries())
        };
        
        console.error(`[${requestId}] Binance API error:`, errorDetails);
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Body: ${errorData}. Request ID: ${requestId}`);
      }
      
      const data: CandlestickData[] = await response.json();
      
      if (!Array.isArray(data)) {
        console.error(`[${requestId}] Invalid response format:`, typeof data, data);
        throw new Error(`Invalid response format: expected array, got ${typeof data}`);
      }
      
      const processed = data.map(candle => ({
        time: candle[0] / 1000, // Convert to seconds for lightweight-charts
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }))
      .sort((a, b) => a.time - b.time) // Ensure ascending time order
      .filter((candle, index, array) => {
        // Remove duplicates - keep only first occurrence of each timestamp
        if (index === 0) return true;
        const isDuplicate = candle.time === array[index - 1].time;
        if (isDuplicate) {
          console.warn(`[${requestId}] Removing duplicate timestamp:`, candle.time);
        }
        return !isDuplicate;
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`[${requestId}] Klines processed:`, {
        candleCount: processed.length,
        timeRange: `${processed[0]?.time} to ${processed[processed.length-1]?.time}`,
        totalTime: `${processingTime}ms`,
        fetchTime: `${fetchTime}ms`
      });
      
      // Validate time ordering
      for (let i = 1; i < processed.length; i++) {
        if (processed[i].time <= processed[i-1].time) {
          console.error(`[${requestId}] Data ordering error at index ${i}:`, {
            prev: processed[i-1].time,
            current: processed[i].time,
            prevCandle: processed[i-1],
            currentCandle: processed[i]
          });
        }
      }
      
      return processed;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorInfo = {
        requestId,
        symbol,
        interval,
        limit,
        totalTime: `${totalTime}ms`,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      };
      
      console.error(`[${requestId}] Klines fetch failed:`, errorInfo);
      throw error;
    }
  }
  
  async fetchLatestPrice(symbol = 'BTCUSDT'): Promise<number> {
    const requestId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    
    try {
      const url = `${this.baseUrl}?endpoint=price&symbol=${symbol}`;
      console.log(`[${requestId}] Fetching latest price from:`, url);
      
      const response = await binanceFetch(url, {
        method: 'GET'
      });
      
      const fetchTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.text().catch(() => 'Unable to read error response');
        const errorDetails = {
          requestId,
          status: response.status,
          statusText: response.statusText,
          url,
          symbol,
          fetchTime: `${fetchTime}ms`,
          errorBody: errorData
        };
        
        console.error(`[${requestId}] Price API error:`, errorDetails);
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Body: ${errorData}. Request ID: ${requestId}`);
      }
      
      const data = await response.json();
      
      if (!data || typeof data.price !== 'string') {
        console.error(`[${requestId}] Invalid price response format:`, data);
        throw new Error(`Invalid price response format`);
      }
      
      const price = parseFloat(data.price);
      const totalTime = Date.now() - startTime;
      
      console.log(`[${requestId}] Price fetched:`, {
        symbol,
        price,
        totalTime: `${totalTime}ms`
      });
      
      return price;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorInfo = {
        requestId,
        symbol,
        totalTime: `${totalTime}ms`,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : error
      };
      
      console.error(`[${requestId}] Price fetch failed:`, errorInfo);
      throw error;
    }
  }

  async fetch24hrTicker(symbol = 'BTCUSDT'): Promise<TickerData> {
    const requestId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    
    try {
      const url = `${this.baseUrl}?endpoint=ticker&symbol=${symbol}`;
      console.log(`[${requestId}] Fetching 24hr ticker from:`, url);
      
      const response = await binanceFetch(url, {
        method: 'GET'
      });
      
      const fetchTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.text().catch(() => 'Unable to read error response');
        const errorDetails = {
          requestId,
          status: response.status,
          statusText: response.statusText,
          url,
          symbol,
          fetchTime: `${fetchTime}ms`,
          errorBody: errorData,
          isFallback: response.headers.get('X-Fallback') === 'true'
        };
        
        console.error(`[${requestId}] Ticker API error:`, errorDetails);
        
        // If this was a fallback response (status 200 with fallback data), don't throw
        if (response.status === 200 && response.headers.get('X-Fallback') === 'true') {
          console.log(`[${requestId}] Using fallback ticker data`);
          const data: TickerData = await response.json();
          return data;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Body: ${errorData}. Request ID: ${requestId}`);
      }
      
      const data: TickerData = await response.json();
      
      if (!data || typeof data.symbol !== 'string' || typeof data.lastPrice !== 'string') {
        console.error(`[${requestId}] Invalid ticker response format:`, data);
        throw new Error(`Invalid ticker response format`);
      }
      
      const totalTime = Date.now() - startTime;
      const isCached = response.headers.get('X-Cache') === 'HIT';
      const isFallback = response.headers.get('X-Fallback') === 'true';
      
      console.log(`[${requestId}] Ticker data fetched:`, {
        symbol: data.symbol,
        lastPrice: data.lastPrice,
        priceChange: data.priceChange,
        priceChangePercent: data.priceChangePercent,
        totalTime: `${totalTime}ms`,
        cached: isCached,
        fallback: isFallback
      });
      
      return data;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorInfo = {
        requestId,
        symbol,
        totalTime: `${totalTime}ms`,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : error
      };
      
      console.error(`[${requestId}] Ticker fetch failed:`, errorInfo);
      throw error;
    }
  }
}

export const binanceFetcher = new BinanceDataFetcher();