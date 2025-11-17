import { ETF } from "@/types/etf";
import { mockETFs } from "@/data/mockETFs";

const FINNHUB_API_KEY = 'd4ardjpr01qseda32skgd4ardjpr01qseda32sl0';
const FINNHUB_WS_URL = `wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`;

type PriceUpdate = {
  symbol: string;
  price: number;
  change: number;
};

type WebSocketCallback = (updates: Map<string, PriceUpdate>) => void;

class FinnhubWebSocketService {
  private socket: WebSocket | null = null;
  private priceData: Map<string, PriceUpdate> = new Map();
  private subscribers: Set<WebSocketCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private subscribedSymbols: Set<string> = new Set();
  private isConnecting = false;

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    console.log('Connecting to Finnhub WebSocket...');

    try {
      this.socket = new WebSocket(FINNHUB_WS_URL);

      this.socket.addEventListener('open', () => {
        console.log('WebSocket connected to Finnhub');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Resubscribe to all symbols
        this.subscribedSymbols.forEach(symbol => {
          this.subscribeToSymbol(symbol);
        });
      });

      this.socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'trade' && data.data) {
            data.data.forEach((trade: any) => {
              const symbol = trade.s;
              const price = trade.p;
              const previousPrice = this.priceData.get(symbol)?.price || price;
              const change = price - previousPrice;

              this.priceData.set(symbol, {
                symbol,
                price,
                change,
              });
            });

            // Notify all subscribers
            this.notifySubscribers();
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      });

      this.socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        this.isConnecting = false;
        this.socket = null;
        this.attemptReconnect();
      });
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private subscribeToSymbol(symbol: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type: 'subscribe', symbol });
      this.socket.send(message);
      console.log(`Subscribed to ${symbol}`);
    }
  }

  private unsubscribeFromSymbol(symbol: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type: 'unsubscribe', symbol });
      this.socket.send(message);
      console.log(`Unsubscribed from ${symbol}`);
    }
  }

  subscribeToSymbols(symbols: string[]) {
    symbols.forEach(symbol => {
      this.subscribedSymbols.add(symbol);
      this.subscribeToSymbol(symbol);
    });
  }

  subscribe(callback: WebSocketCallback) {
    this.subscribers.add(callback);
    
    // Immediately notify with current data
    if (this.priceData.size > 0) {
      callback(this.priceData);
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      callback(this.priceData);
    });
  }

  getCurrentPrices(): Map<string, PriceUpdate> {
    return new Map(this.priceData);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      // Unsubscribe from all symbols
      this.subscribedSymbols.forEach(symbol => {
        this.unsubscribeFromSymbol(symbol);
      });
      
      this.socket.close();
      this.socket = null;
    }

    this.subscribedSymbols.clear();
    this.priceData.clear();
    this.subscribers.clear();
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const finnhubWS = new FinnhubWebSocketService();

export const initializeWebSocket = () => {
  finnhubWS.connect();
  
  // Subscribe to all ETF symbols
  const symbols = mockETFs.map(etf => etf.symbol);
  finnhubWS.subscribeToSymbols(symbols);
};

export const subscribeToETFUpdates = (callback: (etfs: ETF[]) => void) => {
  return finnhubWS.subscribe((priceUpdates) => {
    const updatedETFs = mockETFs.map(etf => {
      const priceUpdate = priceUpdates.get(etf.symbol);
      
      if (priceUpdate) {
        return {
          ...etf,
          price: priceUpdate.price,
          priceChange: priceUpdate.change,
        };
      }
      
      return etf;
    });

    callback(updatedETFs);
  });
};

export const disconnectWebSocket = () => {
  finnhubWS.disconnect();
};

export const isWebSocketConnected = () => {
  return finnhubWS.isConnected();
};

export default finnhubWS;
