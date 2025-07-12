'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { binanceFetcher, ProcessedCandle, BinanceInterval } from '@/lib/binance';
import { AIAnalyzer, MarketAnalysis } from '@/lib/ai-analyzer';
import { generateMockData } from '@/lib/mock-data';
import { createBinanceWebSocket, WebSocketKlineData, WebSocketTickerData } from '@/lib/websocket';

export function useMarketData(onCandleUpdate?: (candle: ProcessedCandle) => void) {
  const [candleData, setCandleData] = useState<ProcessedCandle[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState<BinanceInterval>('1d');
  const [isConnected, setIsConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>('Not initialized');

  const wsRef = useRef<ReturnType<typeof createBinanceWebSocket> | null>(null);
  const onCandleUpdateRef = useRef(onCandleUpdate);

  const fetchData = useCallback(async (timeframe?: BinanceInterval) => {
    try {
      setError(null);
      const intervalToUse = timeframe || currentTimeframe;
      console.log('Fetching market data for timeframe:', intervalToUse);
      
      // Fetch candlestick data
      const candles = await binanceFetcher.fetchKlines('BTCUSDT', intervalToUse, 100);
      console.log('Candles fetched:', candles.length);
      setCandleData(candles);
      
      // Analyze the data
      if (candles.length > 0) {
        const marketAnalysis = AIAnalyzer.analyzeMarket(candles);
        console.log('Analysis completed:', marketAnalysis);
        setAnalysis(marketAnalysis);
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      
      // Use mock data as fallback
      console.log('Using mock data as fallback...');
      const mockCandles = generateMockData();
      setCandleData(mockCandles);
      
      if (mockCandles.length > 0) {
        const marketAnalysis = AIAnalyzer.analyzeMarket(mockCandles);
        setAnalysis(marketAnalysis);
      }
      
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [currentTimeframe]);

  // Update ref when callback changes
  useEffect(() => {
    onCandleUpdateRef.current = onCandleUpdate;
  }, [onCandleUpdate]);

  // WebSocket handlers
  const handleKlineUpdate = useCallback((data: WebSocketKlineData) => {
    console.log('Kline update received:', data);
    
    const currentCandle: ProcessedCandle = {
      time: data.k.t / 1000, // Convert to seconds
      open: parseFloat(data.k.o),
      high: parseFloat(data.k.h),
      low: parseFloat(data.k.l),
      close: parseFloat(data.k.c),
      volume: parseFloat(data.k.v),
    };

    // Update chart immediately for real-time effect
    if (onCandleUpdateRef.current) {
      onCandleUpdateRef.current(currentCandle);
    }

    // Update state data
    setCandleData(prev => {
      const newData = [...prev];
      const candleTime = currentCandle.time;
      
      // Check if this is updating the current (last) candle or adding a new one
      if (newData.length > 0 && newData[newData.length - 1].time === candleTime) {
        // Update existing candle (live updates)
        newData[newData.length - 1] = currentCandle;
      } else {
        // Add new candle (when time changes or first candle)
        newData.push(currentCandle);
        // Keep only last 100 candles
        if (newData.length > 100) {
          newData.shift();
        }
      }
      return newData;
    });

    setLastUpdate(new Date());
  }, []);

  const handleTickerUpdate = useCallback((data: WebSocketTickerData) => {
    const price = parseFloat(data.c);
    const change = parseFloat(data.p);
    
    setCurrentPrice(price);
    setPriceChange(change);
    setLastUpdate(new Date());
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      console.log('WebSocket disconnected');
    }
    
    // Update connection state when status changes
    if (wsRef.current) {
      setConnectionState(wsRef.current.getConnectionState());
    }
  }, []);
  
  const handleWebSocketError = useCallback((error: string) => {
    console.error('WebSocket error received:', error);
    setWsError(error);
    
    // Clear error after 10 seconds
    setTimeout(() => {
      setWsError(null);
    }, 10000);
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    wsRef.current = createBinanceWebSocket('BTCUSDT', currentTimeframe);
    
    wsRef.current.onKline(handleKlineUpdate);
    wsRef.current.onTicker(handleTickerUpdate);
    wsRef.current.onConnection(handleConnectionChange);
    wsRef.current.onError(handleWebSocketError);
    
    // Connect after setting up handlers
    wsRef.current.connect();
    
    // Update connection state immediately
    setConnectionState(wsRef.current.getConnectionState());

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [currentTimeframe, handleKlineUpdate, handleTickerUpdate, handleConnectionChange, handleWebSocketError]);

  const changeTimeframe = useCallback((newTimeframe: BinanceInterval) => {
    setCurrentTimeframe(newTimeframe);
    setIsLoading(true);
    
    // Change WebSocket stream
    if (wsRef.current) {
      wsRef.current.changeStream('BTCUSDT', newTimeframe);
    }
    
    fetchData(newTimeframe);
  }, [fetchData]);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh with different intervals based on timeframe
  useEffect(() => {
    const getRefreshInterval = (timeframe: BinanceInterval) => {
      switch (timeframe) {
        case '5m': return 300000; // 5 minutes
        case '15m': return 900000; // 15 minutes
        case '1h': return 3600000; // 1 hour
        case '4h': return 14400000; // 4 hours
        case '1d': return 86400000; // 1 day
        default: return 300000;
      }
    };

    const interval = setInterval(() => {
      fetchData();
    }, getRefreshInterval(currentTimeframe));

    return () => clearInterval(interval);
  }, [fetchData, currentTimeframe]);

  // Re-run analysis when candleData changes
  useEffect(() => {
    if (candleData.length > 0) {
      try {
        const marketAnalysis = AIAnalyzer.analyzeMarket(candleData);
        setAnalysis(marketAnalysis);
      } catch (err) {
        console.error('Error analyzing market data:', err);
      }
    }
  }, [candleData]);

  return {
    candleData,
    analysis,
    isLoading,
    error,
    lastUpdate,
    currentTimeframe,
    isConnected,
    currentPrice,
    priceChange,
    wsError,
    connectionState,
    indicators: analysis?.indicators || null,
    refreshData,
    changeTimeframe
  };
}