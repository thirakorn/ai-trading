import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '5m';
  const limit = searchParams.get('limit') || '100';
  const endpoint = searchParams.get('endpoint') || 'klines'; // Add endpoint parameter

  try {
    let apiUrl: string;
    
    // Support different Binance API endpoints
    switch (endpoint) {
      case 'ticker':
        // 24hr ticker statistics
        apiUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
        break;
      case 'price':
        // Current price only
        apiUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
        break;
      case 'klines':
      default:
        // Historical klines data
        apiUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        break;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; BTC-Trading-Analyzer/1.0)',
      },
      cache: 'no-store', // Disable caching for real-time data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from Binance',
        details: error instanceof Error ? error.message : 'Unknown error',
        endpoint: endpoint,
        symbol: symbol,
        interval: interval
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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