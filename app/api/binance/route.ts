import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for production
interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

// Cache TTL in milliseconds
const CACHE_TTL = {
  ticker: 30000, // 30 seconds for ticker data
  price: 15000,  // 15 seconds for price data
  klines: 300000 // 5 minutes for klines data
};

// Clean up expired cache entries
function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
}

// Get cached data if valid
function getCachedData(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

// Set cache data
function setCacheData(key: string, data: unknown, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Fallback data for when API fails
const FALLBACK_DATA = {
  ticker: {
    symbol: 'BTCUSDT',
    lastPrice: '95000.00',
    priceChange: '1500.00',
    priceChangePercent: '1.60',
    openPrice: '93500.00',
    highPrice: '96000.00',
    lowPrice: '93000.00',
    volume: '15000.50'
  },
  price: {
    symbol: 'BTCUSDT',
    price: '95000.00'
  }
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '5m';
  const limit = searchParams.get('limit') || '100';
  const endpoint = searchParams.get('endpoint') || 'klines';
  
  // Clean up expired cache entries periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup
    cleanupCache();
  }
  
  // Create cache key
  const cacheKey = `${endpoint}:${symbol}:${interval}:${limit}`;
  
  console.log(`[${new Date().toISOString()}] API Request:`, {
    endpoint,
    symbol,
    interval,
    limit,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    origin: request.headers.get('origin')
  });

  try {
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log(`[${new Date().toISOString()}] Cache hit for:`, cacheKey);
      return NextResponse.json(cachedData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey
        },
      });
    }

    let apiUrl: string;
    let cacheTtl: number;
    
    // Support different Binance API endpoints
    switch (endpoint) {
      case 'ticker':
        apiUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
        cacheTtl = CACHE_TTL.ticker;
        break;
      case 'price':
        apiUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
        cacheTtl = CACHE_TTL.price;
        break;
      case 'klines':
      default:
        apiUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        cacheTtl = CACHE_TTL.klines;
        break;
    }

    console.log(`[${new Date().toISOString()}] Fetching from Binance:`, apiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; BTC-Trading-Analyzer/1.0)',
      },
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error body');
      throw new Error(`HTTP ${response.status}: ${response.statusText}. Body: ${errorBody}`);
    }

    const data = await response.json();
    
    // Cache the successful response
    setCacheData(cacheKey, data, cacheTtl);
    
    const responseTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] API Success:`, {
      endpoint,
      symbol,
      responseTime: `${responseTime}ms`,
      dataSize: JSON.stringify(data).length,
      cached: false
    });
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Cache': 'MISS',
        'X-Response-Time': `${responseTime}ms`
      },
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint,
      symbol,
      interval,
      limit,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin')
    };
    
    console.error(`[${new Date().toISOString()}] API Error:`, errorDetails);
    
    // Try to provide fallback data for ticker and price endpoints
    if (endpoint === 'ticker' || endpoint === 'price') {
      const fallbackData = endpoint === 'ticker' 
        ? { ...FALLBACK_DATA.ticker, symbol }
        : { ...FALLBACK_DATA.price, symbol };
        
      console.log(`[${new Date().toISOString()}] Using fallback data for:`, endpoint);
      
      return NextResponse.json(fallbackData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'X-Fallback': 'true',
          'X-Error': errorDetails.message
        },
      });
    }
    
    // For klines, return error since we can't provide meaningful fallback
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from Binance',
        details: errorDetails,
        fallbackAvailable: false,
        endpoint,
        symbol,
        interval
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'X-Error-Time': `${responseTime}ms`
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}