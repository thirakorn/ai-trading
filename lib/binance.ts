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
    try {
      const url = `${this.baseUrl}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      console.log('Fetching klines from:', url);
      
      const response = await binanceFetch(url, {
        method: 'GET'
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Binance API error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`);
      }
      
      const data: CandlestickData[] = await response.json();
      
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
          console.warn('Removing duplicate timestamp from Binance data:', candle.time);
        }
        return !isDuplicate;
      });
      
      console.log('Binance data processed:', processed.length, 'candles');
      console.log('Time range:', processed[0]?.time, 'to', processed[processed.length-1]?.time);
      console.log('Sample processed candle:', processed[0]);
      
      // Validate time ordering
      for (let i = 1; i < processed.length; i++) {
        if (processed[i].time <= processed[i-1].time) {
          console.error('Binance data not properly ordered at index:', i, 
            'prev:', processed[i-1].time, 'current:', processed[i].time);
        }
      }
      
      return processed;
    } catch (error) {
      console.error('Error fetching Binance data:', error);
      throw error;
    }
  }
  
  async fetchLatestPrice(symbol = 'BTCUSDT'): Promise<number> {
    try {
      const url = `${this.baseUrl}?endpoint=price&symbol=${symbol}`;
      console.log('Fetching latest price from:', url);
      
      const response = await binanceFetch(url, {
        method: 'GET'
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Price API error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`);
      }
      
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('Error fetching latest price:', error);
      throw error;
    }
  }

  async fetch24hrTicker(symbol = 'BTCUSDT'): Promise<TickerData> {
    try {
      const url = `${this.baseUrl}?endpoint=ticker&symbol=${symbol}`;
      console.log('Fetching 24hr ticker from:', url);
      
      const response = await binanceFetch(url, {
        method: 'GET'
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Ticker API error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`);
      }
      
      const data: TickerData = await response.json();
      console.log('24hr ticker data fetched:', {
        symbol: data.symbol,
        lastPrice: data.lastPrice,
        priceChange: data.priceChange,
        priceChangePercent: data.priceChangePercent
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching 24hr ticker:', error);
      throw error;
    }
  }
}

export const binanceFetcher = new BinanceDataFetcher();