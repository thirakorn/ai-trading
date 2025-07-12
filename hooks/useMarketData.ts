'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { binanceFetcher, ProcessedCandle, BinanceInterval, TickerData } from '@/lib/binance';
import { AIAnalyzer, MarketAnalysis } from '@/lib/ai-analyzer';
import { generateMockData } from '@/lib/mock-data';
import { createBinanceWebSocket, WebSocketKlineData, WebSocketTickerData } from '@/lib/websocket';
import { TechnicalAnalysis, IndicatorArrays } from '@/lib/technical-analysis';

export function useMarketData() {
  const [candleData, setCandleData] = useState<ProcessedCandle[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [indicatorArrays, setIndicatorArrays] = useState<IndicatorArrays | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState<BinanceInterval>('1d');
  const [currentSymbol, setCurrentSymbol] = useState<string>('BTCUSDT');
  const [isConnected, setIsConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>('Not initialized');

  const wsRef = useRef<ReturnType<typeof createBinanceWebSocket> | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const lastPriceFetchRef = useRef<number>(0);
  const cacheTimeoutRef = useRef<number>(300000); // 5 minute cache for market data
  const priceCacheTimeoutRef = useRef<number>(30000); // 30 second cache for price data

  // Fetch initial price and ticker data with caching
  const fetchPriceData = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Check cache - only fetch if forced or cache expired
    if (!force && (now - lastPriceFetchRef.current) < priceCacheTimeoutRef.current) {
      console.log('Skipping price data fetch (cached)');
      return;
    }
    
    try {
      console.log(`Fetching initial price data for ${currentSymbol}...`);
      
      // Fetch 24hr ticker data for current price and changes
      const ticker = await binanceFetcher.fetch24hrTicker(currentSymbol);
      setTickerData(ticker);
      setCurrentPrice(parseFloat(ticker.lastPrice));
      setPriceChange(parseFloat(ticker.priceChange));
      setPriceChangePercent(parseFloat(ticker.priceChangePercent));
      
      // Update cache timestamp
      lastPriceFetchRef.current = now;
      
      console.log('Initial price data fetched:', {
        currentPrice: ticker.lastPrice,
        priceChange: ticker.priceChange,
        priceChangePercent: ticker.priceChangePercent
      });
    } catch (error) {
      console.error('Error fetching initial price data:', error);
      // Set fallback price data to prevent null states
      setCurrentPrice(95000); // Fallback BTC price
      setPriceChange(0);
      setPriceChangePercent(0);
      
      // Don't throw, just log - WebSocket might provide updates later
    }
  }, [currentSymbol]);

  const fetchData = useCallback(async (timeframe?: BinanceInterval, force = false) => {
    try {
      setError(null);
      const intervalToUse = timeframe || currentTimeframe;
      const now = Date.now();
      
      // Only fetch if forced (timeframe change) or if we don't have data yet or cache expired
      if (!force && candleData.length > 0 && (now - lastFetchTimeRef.current) < cacheTimeoutRef.current) {
        console.log('Skipping market data fetch (cached)');
        return;
      }
      
      console.log('Fetching market data for timeframe:', intervalToUse);
      
      // Fetch candlestick data only for AI analysis
      const candles = await binanceFetcher.fetchKlines(currentSymbol, intervalToUse, 100);
      console.log('Candles fetched for AI analysis:', candles.length);
      setCandleData(candles);
      
      // Set current price from latest candle if not already set
      if (candles.length > 0 && !currentPrice) {
        const latestCandle = candles[candles.length - 1];
        setCurrentPrice(latestCandle.close);
        console.log('Current price set from candles:', latestCandle.close);
      }
      
      // Analyze the data
      if (candles.length > 0) {
        const marketAnalysis = AIAnalyzer.analyzeMarket(candles);
        console.log('Analysis completed:', marketAnalysis);
        setAnalysis(marketAnalysis);
        
        // Calculate indicator arrays for AI analysis
        const indicators = TechnicalAnalysis.calculateIndicatorArrays(candles);
        console.log('Indicator arrays calculated for AI:', indicators);
        setIndicatorArrays(indicators);
      }
      
      // Update cache timestamp
      lastFetchTimeRef.current = now;
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
        
        // Calculate indicator arrays for mock data
        const indicators = TechnicalAnalysis.calculateIndicatorArrays(mockCandles);
        setIndicatorArrays(indicators);
      }
      
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [currentSymbol, currentTimeframe, currentPrice, candleData.length]);


  // WebSocket handlers - simplified for price updates only
  const handleKlineUpdate = useCallback((data: WebSocketKlineData) => {
    console.log('Kline update received:', data);
    
    // Update latest candle data for analysis purposes
    const currentCandle: ProcessedCandle = {
      time: data.k.t / 1000, // Convert to seconds
      open: parseFloat(data.k.o),
      high: parseFloat(data.k.h),
      low: parseFloat(data.k.l),
      close: parseFloat(data.k.c),
      volume: parseFloat(data.k.v),
    };

    // Update current price for price indicator
    setCurrentPrice(currentCandle.close);
    setLastUpdate(new Date());
  }, []);

  const handleTickerUpdate = useCallback((data: WebSocketTickerData) => {
    const price = parseFloat(data.c);
    const change = parseFloat(data.p);
    const changePercent = parseFloat(data.P);
    
    setCurrentPrice(price);
    setPriceChange(change);
    setPriceChangePercent(changePercent);
    setLastUpdate(new Date());
    
    console.log('Ticker update:', {
      price,
      change,
      changePercent: changePercent.toFixed(2) + '%'
    });
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
    wsRef.current = createBinanceWebSocket(currentSymbol, currentTimeframe);
    
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
  }, [currentSymbol, currentTimeframe, handleKlineUpdate, handleTickerUpdate, handleConnectionChange, handleWebSocketError]);

  const changeTimeframe = useCallback((newTimeframe: BinanceInterval) => {
    if (newTimeframe === currentTimeframe) {
      console.log('Same timeframe selected, skipping change');
      return;
    }
    
    console.log('Changing timeframe from', currentTimeframe, 'to', newTimeframe);
    setCurrentTimeframe(newTimeframe);
    setIsLoading(true);
    
    // Change WebSocket stream
    if (wsRef.current) {
      wsRef.current.changeStream(currentSymbol, newTimeframe);
    }
    
    // Force fetch new data for AI analysis (but respect caching for same timeframe)
    fetchData(newTimeframe, true);
  }, [currentSymbol, currentTimeframe, fetchData]);

  const changeSymbol = useCallback((newSymbol: string) => {
    if (newSymbol === currentSymbol) {
      console.log('Same symbol selected, skipping change');
      return;
    }
    
    console.log('Changing symbol from', currentSymbol, 'to', newSymbol);
    setCurrentSymbol(newSymbol);
    setIsLoading(true);
    
    // Reset states
    setCandleData([]);
    setAnalysis(null);
    setIndicatorArrays(null);
    setCurrentPrice(null);
    setPriceChange(0);
    setPriceChangePercent(0);
    setTickerData(null);
    setError(null);
    
    // Change WebSocket stream
    if (wsRef.current) {
      wsRef.current.changeStream(newSymbol, currentTimeframe);
    }
    
    // Force fetch new data for new symbol
    fetchData(currentTimeframe, true);
    fetchPriceData(true);
  }, [currentSymbol, currentTimeframe, fetchData, fetchPriceData]);

  const refreshData = useCallback(() => {
    console.log('Manual refresh triggered');
    setIsLoading(true);
    // Force fetch fresh data and price data
    fetchPriceData(true);
    fetchData(undefined, true);
  }, [fetchData, fetchPriceData]);

  // Initial data fetch - fetch price data first, then market data once
  useEffect(() => {
    const initializeData = async () => {
      console.log('Initializing market data (one-time only)...');
      // Fetch price data first for immediate price display
      await fetchPriceData(true);
      // Then fetch market data once for AI analysis
      fetchData(undefined, true);
    };
    
    initializeData();
  }, []); // Empty deps - only run once on mount

  // Remove auto-refresh timer since TradingView widget handles real-time data
  // and WebSocket provides price updates

  // Re-run analysis when candleData changes
  useEffect(() => {
    if (candleData.length > 0) {
      try {
        const marketAnalysis = AIAnalyzer.analyzeMarket(candleData);
        setAnalysis(marketAnalysis);
        
        // Calculate indicator arrays
        const indicators = TechnicalAnalysis.calculateIndicatorArrays(candleData);
        setIndicatorArrays(indicators);
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
    currentSymbol,
    isConnected,
    currentPrice,
    priceChange,
    priceChangePercent,
    tickerData,
    wsError,
    connectionState,
    indicators: analysis?.indicators || null,
    refreshData,
    changeTimeframe,
    changeSymbol
  };
}