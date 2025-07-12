import { BinanceInterval } from './binance';

export interface WebSocketKlineData {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    f: number; // First trade ID
    L: number; // Last trade ID
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Base asset volume
    n: number; // Number of trades
    x: boolean; // Is this kline closed?
    q: string; // Quote asset volume
    V: string; // Taker buy base asset volume
    Q: string; // Taker buy quote asset volume
  };
}

export interface WebSocketTickerData {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  c: string; // Close price
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  P: string; // Price change percent
  p: string; // Price change
}

export class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private symbol: string;
  private interval: BinanceInterval;
  private onKlineUpdate?: (data: WebSocketKlineData) => void;
  private onTickerUpdate?: (data: WebSocketTickerData) => void;
  private onConnectionChange?: (connected: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private lastConnectionTime = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  
  // Fallback WebSocket URLs (corrected according to Binance documentation)
  private readonly wsUrls = [
    'wss://stream.binance.com:9443',
    'wss://stream.binance.com:443', 
    'wss://data-stream.binance.vision'
  ];
  private currentUrlIndex = 0;

  constructor(symbol: string, interval: BinanceInterval) {
    this.symbol = symbol.toLowerCase();
    this.interval = interval;
  }

  connect() {
    if (this.isConnecting) {
      console.log('Connection already in progress, skipping...');
      return;
    }

    this.isConnecting = true;
    this.lastConnectionTime = Date.now();
    
    // Clear any existing timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    try {
      // Get current WebSocket URL (corrected format: baseUrl/ws/streamName)
      const streamName = `${this.symbol}@kline_${this.interval}`;
      const wsUrl = `${this.wsUrls[this.currentUrlIndex]}/ws/${streamName}`;
      console.log(`[WebSocket] Connecting to: ${wsUrl} (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      this.ws = new WebSocket(wsUrl);
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.error('[WebSocket] Connection timeout after 10 seconds');
          this.handleConnectionError('Connection timeout');
          this.ws.close();
        }
      }, 10000);
      
      this.ws.onopen = () => {
        console.log(`[WebSocket] Connected successfully to ${wsUrl}`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.currentUrlIndex = 0; // Reset to primary URL on successful connection
        
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        // Start ping/pong heartbeat (Binance requires response within 1 minute)
        this.startHeartbeat();
        
        this.onConnectionChange?.(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.e === 'kline') {
            this.onKlineUpdate?.(data as WebSocketKlineData);
            // Extract price data for ticker simulation
            if (data.k && data.k.c) {
              const tickerData: WebSocketTickerData = {
                e: '24hrTicker',
                E: data.E,
                s: data.s,
                c: data.k.c, // Current close price
                o: data.k.o, // Open price
                h: data.k.h, // High price
                l: data.k.l, // Low price
                P: '0.00', // Price change percent (placeholder)
                p: '0.00'  // Price change (placeholder)
              };
              this.onTickerUpdate?.(tickerData);
            }
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
          this.handleConnectionError(`Message parsing error: ${error}`);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        const reason = this.getCloseReason(event.code);
        console.log(`[WebSocket] Disconnected: ${event.code} - ${reason}`);
        
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        // Stop heartbeat on disconnect
        this.stopHeartbeat();
        
        this.onConnectionChange?.(false);
        
        // Only attempt reconnect if not manually closed
        if (event.code !== 1000) {
          this.handleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        const errorMsg = this.getErrorMessage(error);
        console.error(`[WebSocket] Error: ${errorMsg}`);
        
        this.handleConnectionError(errorMsg);
        this.onConnectionChange?.(false);
      };
    } catch (error) {
      this.isConnecting = false;
      const errorMsg = `Failed to create WebSocket: ${error}`;
      console.error(`[WebSocket] ${errorMsg}`);
      this.handleConnectionError(errorMsg);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Try next URL if current one failed multiple times
      if (this.reconnectAttempts > 2) {
        this.currentUrlIndex = (this.currentUrlIndex + 1) % this.wsUrls.length;
        console.log(`[WebSocket] Switching to fallback URL: ${this.wsUrls[this.currentUrlIndex]}`);
      }
      
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      
      console.log(`[WebSocket] Reconnecting in ${Math.round(delay/1000)}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isConnected()) {
          this.connect();
        }
      }, delay);
    } else {
      console.error(`[WebSocket] Max reconnection attempts reached. Tried all URLs: ${this.wsUrls.join(', ')}`);
      this.handleConnectionError('Max reconnection attempts reached');
    }
  }
  
  private handleConnectionError(error: string) {
    this.onErrorCallback?.(error);
  }
  
  private getErrorMessage(error: Event): string {
    if (error instanceof ErrorEvent) {
      return error.message || 'Unknown WebSocket error';
    }
    return `Connection error: ${error.type || 'Unknown'}`;
  }
  
  private getCloseReason(code: number): string {
    switch (code) {
      case 1000: return 'Normal closure';
      case 1001: return 'Going away';
      case 1002: return 'Protocol error';
      case 1003: return 'Unsupported data';
      case 1005: return 'No status received';
      case 1006: return 'Abnormal closure';
      case 1007: return 'Invalid frame payload data';
      case 1008: return 'Policy violation';
      case 1009: return 'Message too big';
      case 1010: return 'Mandatory extension';
      case 1011: return 'Internal server error';
      case 1015: return 'TLS handshake failure';
      default: return `Unknown close code: ${code}`;
    }
  }
  
  private startHeartbeat() {
    // Clear any existing heartbeat
    this.stopHeartbeat();
    
    // Binance requires ping response within 1 minute, so we ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          // Browser WebSocket doesn't have ping method, use text message for heartbeat
          this.ws.send(JSON.stringify({method: 'ping', timestamp: Date.now()}));
          console.log('[WebSocket] Heartbeat sent');
        } catch (error) {
          console.warn('[WebSocket] Heartbeat failed:', error);
        }
      }
    }, 30000); // 30 seconds
    
    console.log('[WebSocket] Heartbeat started (30s interval)');
  }
  
  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      console.log('[WebSocket] Heartbeat stopped');
    }
  }

  disconnect() {
    console.log('[WebSocket] Manually disconnecting...');
    
    // Clear timeouts
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Reset state
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  changeStream(symbol: string, interval: BinanceInterval) {
    console.log(`[WebSocket] Changing stream to ${symbol}@kline_${interval}`);
    this.symbol = symbol.toLowerCase();
    this.interval = interval;
    
    // Reset URL index for new stream
    this.currentUrlIndex = 0;
    this.reconnectAttempts = 0;
    
    // Reconnect with new stream
    this.disconnect();
    setTimeout(() => this.connect(), 100);
  }

  onKline(callback: (data: WebSocketKlineData) => void) {
    this.onKlineUpdate = callback;
  }

  onTicker(callback: (data: WebSocketTickerData) => void) {
    this.onTickerUpdate = callback;
  }

  onConnection(callback: (connected: boolean) => void) {
    this.onConnectionChange = callback;
  }
  
  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  getConnectionState(): string {
    if (!this.ws) return 'Not initialized';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'Connecting';
      case WebSocket.OPEN: return 'Connected';
      case WebSocket.CLOSING: return 'Closing';
      case WebSocket.CLOSED: return 'Closed';
      default: return 'Unknown';
    }
  }
  
  getConnectionInfo(): {
    state: string;
    attempts: number;
    currentUrl: string;
    isConnecting: boolean;
    lastConnectionTime: number;
  } {
    return {
      state: this.getConnectionState(),
      attempts: this.reconnectAttempts,
      currentUrl: this.wsUrls[this.currentUrlIndex],
      isConnecting: this.isConnecting,
      lastConnectionTime: this.lastConnectionTime
    };
  }
}

export const createBinanceWebSocket = (symbol: string, interval: BinanceInterval) => {
  return new BinanceWebSocket(symbol, interval);
};