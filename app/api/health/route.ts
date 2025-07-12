import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test connection to Binance API
    const testResponse = await fetch('https://api.binance.com/api/v3/ping', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BTC-Trading-Analyzer/1.0)',
      },
      cache: 'no-store',
    });

    const responseTime = Date.now() - startTime;
    const isHealthy = testResponse.ok;

    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        binanceApi: {
          status: isHealthy ? 'up' : 'down',
          responseTime: `${responseTime}ms`,
          statusCode: testResponse.status
        }
      },
      server: {
        runtime: 'edge',
        environment: 'cloudflare-pages'
      }
    };

    return NextResponse.json(healthStatus, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        binanceApi: {
          status: 'down',
          responseTime: `${responseTime}ms`,
          error: error instanceof Error ? error.message : 'Connection failed'
        }
      }
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}