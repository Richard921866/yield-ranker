/**
 * Tiingo API Service
 * 
 * Handles all interactions with the Tiingo API with rate limiting and retry logic
 */

import config from '../config/index.js';
import { logger, sleep, retry } from '../utils/index.js';
import type { TiingoPriceData, TiingoDividendData, TiingoMetaData, TiingoIEXQuote } from '../types/index.js';

// ============================================================================
// Rate Limiting State
// ============================================================================

interface RateLimitState {
  requestCount: number;
  hourlyRequestCount: number;
  lastRequestTime: number;
  hourStartTime: number;
}

const state: RateLimitState = {
  requestCount: 0,
  hourlyRequestCount: 0,
  lastRequestTime: 0,
  hourStartTime: Date.now(),
};

// ============================================================================
// Rate Limiting
// ============================================================================

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const { rateLimit } = config.tiingo;
  
  // Reset hourly counter if hour has passed
  if (now - state.hourStartTime > 3600000) {
    state.hourlyRequestCount = 0;
    state.hourStartTime = now;
  }
  
  // Check if we've hit hourly limit
  if (state.hourlyRequestCount >= rateLimit.requestsPerHour) {
    const waitTime = 3600000 - (now - state.hourStartTime);
    logger.warn('Tiingo', `Hourly rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s`);
    await sleep(waitTime);
    state.hourlyRequestCount = 0;
    state.hourStartTime = Date.now();
  }
  
  // Ensure minimum delay between requests
  const timeSinceLastRequest = now - state.lastRequestTime;
  if (timeSinceLastRequest < rateLimit.minDelayMs) {
    await sleep(rateLimit.minDelayMs - timeSinceLastRequest);
  }
  
  state.lastRequestTime = Date.now();
  state.requestCount++;
  state.hourlyRequestCount++;
}

// ============================================================================
// API Request Handler
// ============================================================================

async function tiingoRequest<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  await waitForRateLimit();
  
  const url = new URL(`${config.tiingo.baseUrl}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${config.tiingo.apiKey}`,
    },
  });
  
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
    logger.warn('Tiingo', `Rate limited. Retrying after ${retryAfter}s`);
    await sleep(retryAfter * 1000);
    return tiingoRequest<T>(endpoint, params);
  }
  
  if (response.status === 404) {
    logger.debug('Tiingo', `Ticker not found: ${endpoint}`);
    return [] as T;
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tiingo API error ${response.status}: ${errorText}`);
  }
  
  return response.json() as Promise<T>;
}

// ============================================================================
// Public API Methods
// ============================================================================

export async function fetchTickerMeta(ticker: string): Promise<TiingoMetaData | null> {
  try {
    return await retry(
      () => tiingoRequest<TiingoMetaData>(`/tiingo/daily/${ticker.toUpperCase()}`),
      3,
      1000,
      (attempt, error) => logger.warn('Tiingo', `Retry ${attempt} for meta ${ticker}: ${error.message}`)
    );
  } catch (error) {
    logger.error('Tiingo', `Error fetching metadata for ${ticker}: ${(error as Error).message}`);
    return null;
  }
}

export async function fetchPriceHistory(
  ticker: string,
  startDate: string,
  endDate?: string
): Promise<TiingoPriceData[]> {
  const params: Record<string, string> = { startDate };
  if (endDate) params.endDate = endDate;
  
  try {
    const data = await retry(
      () => tiingoRequest<TiingoPriceData[]>(`/tiingo/daily/${ticker.toUpperCase()}/prices`, params),
      3,
      1000,
      (attempt, error) => logger.warn('Tiingo', `Retry ${attempt} for prices ${ticker}: ${error.message}`)
    );
    
    logger.debug('Tiingo', `Fetched ${data.length} price records for ${ticker}`);
    return data;
  } catch (error) {
    logger.error('Tiingo', `Error fetching prices for ${ticker}: ${(error as Error).message}`);
    return [];
  }
}

export async function fetchDividendHistory(
  ticker: string,
  startDate?: string,
  endDate?: string
): Promise<TiingoDividendData[]> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  try {
    const data = await retry(
      () => tiingoRequest<TiingoDividendData[]>(`/tiingo/daily/${ticker.toUpperCase()}/dividends`, params),
      3,
      1000,
      (attempt, error) => logger.warn('Tiingo', `Retry ${attempt} for dividends ${ticker}: ${error.message}`)
    );
    
    logger.debug('Tiingo', `Fetched ${data.length} dividend records for ${ticker}`);
    return data;
  } catch (error) {
    logger.error('Tiingo', `Error fetching dividends for ${ticker}: ${(error as Error).message}`);
    return [];
  }
}

export async function fetchLatestPrice(ticker: string): Promise<TiingoPriceData | null> {
  try {
    const data = await tiingoRequest<TiingoPriceData[]>(`/tiingo/daily/${ticker.toUpperCase()}/prices`);
    return data.length > 0 ? data[data.length - 1] : null;
  } catch (error) {
    logger.error('Tiingo', `Error fetching latest price for ${ticker}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Fetch realtime IEX quote for a ticker.
 * This provides current intraday prices during market hours.
 * Falls back to EOD data if IEX quote is unavailable.
 */
export async function fetchRealtimePrice(ticker: string): Promise<{
  price: number;
  prevClose: number;
  timestamp: string;
  isRealtime: boolean;
} | null> {
  try {
    // Try IEX endpoint first for realtime data
    const iexData = await tiingoRequest<TiingoIEXQuote[]>(`/iex/${ticker.toUpperCase()}`);
    
    if (iexData.length > 0) {
      const quote = iexData[0];
      // Use tngoLast (Tiingo's last price) or last price
      const price = quote.tngoLast || quote.last || quote.mid;
      
      if (price && price > 0) {
        return {
          price,
          prevClose: quote.prevClose || 0,
          timestamp: quote.lastSaleTimestamp || quote.timestamp,
          isRealtime: true,
        };
      }
    }
    
    // Fallback to EOD data if IEX is unavailable
    const eodData = await fetchLatestPrice(ticker);
    if (eodData) {
      return {
        price: eodData.close,
        prevClose: eodData.close, // Same day, so no previous close available
        timestamp: eodData.date,
        isRealtime: false,
      };
    }
    
    return null;
  } catch (error) {
    logger.warn('Tiingo', `IEX fetch failed for ${ticker}, trying EOD: ${(error as Error).message}`);
    
    // Fallback to EOD data
    try {
      const eodData = await fetchLatestPrice(ticker);
      if (eodData) {
        return {
          price: eodData.close,
          prevClose: eodData.close,
          timestamp: eodData.date,
          isRealtime: false,
        };
      }
    } catch {
      logger.error('Tiingo', `Both IEX and EOD fetch failed for ${ticker}`);
    }
    
    return null;
  }
}

/**
 * Fetch realtime prices for multiple tickers in batch
 * Uses the IEX endpoint which supports comma-separated tickers
 */
export async function fetchRealtimePricesBatch(tickers: string[]): Promise<Map<string, {
  price: number;
  prevClose: number;
  timestamp: string;
  isRealtime: boolean;
}>> {
  const results = new Map<string, {
    price: number;
    prevClose: number;
    timestamp: string;
    isRealtime: boolean;
  }>();
  
  if (tickers.length === 0) return results;
  
  try {
    // IEX supports comma-separated tickers (up to ~100 at a time)
    const tickerChunks: string[][] = [];
    for (let i = 0; i < tickers.length; i += 50) {
      tickerChunks.push(tickers.slice(i, i + 50));
    }
    
    for (const chunk of tickerChunks) {
      const tickerList = chunk.map(t => t.toUpperCase()).join(',');
      const iexData = await tiingoRequest<TiingoIEXQuote[]>(`/iex/?tickers=${tickerList}`);
      
      for (const quote of iexData) {
        const price = quote.tngoLast || quote.last || quote.mid;
        if (price && price > 0) {
          results.set(quote.ticker.toUpperCase(), {
            price,
            prevClose: quote.prevClose || 0,
            timestamp: quote.lastSaleTimestamp || quote.timestamp,
            isRealtime: true,
          });
        }
      }
    }
  } catch (error) {
    logger.warn('Tiingo', `Batch IEX fetch failed: ${(error as Error).message}`);
  }
  
  // Fetch EOD for any tickers that didn't get IEX data
  for (const ticker of tickers) {
    if (!results.has(ticker.toUpperCase())) {
      const realtimePrice = await fetchRealtimePrice(ticker);
      if (realtimePrice) {
        results.set(ticker.toUpperCase(), realtimePrice);
      }
    }
  }
  
  return results;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const data = await fetchTickerMeta('SPY');
    return data !== null;
  } catch {
    return false;
  }
}

export function getRateLimitStatus(): {
  requestsThisHour: number;
  totalRequests: number;
  hourlyLimit: number;
} {
  return {
    requestsThisHour: state.hourlyRequestCount,
    totalRequests: state.requestCount,
    hourlyLimit: config.tiingo.rateLimit.requestsPerHour,
  };
}

// ============================================================================
// Batch Processing
// ============================================================================

export async function fetchPriceHistoryBatch(
  tickers: string[],
  startDate: string,
  endDate?: string,
  onProgress?: (ticker: string, index: number, total: number) => void
): Promise<Map<string, TiingoPriceData[]>> {
  const results = new Map<string, TiingoPriceData[]>();
  
  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    onProgress?.(ticker, i + 1, tickers.length);
    
    const prices = await fetchPriceHistory(ticker, startDate, endDate);
    results.set(ticker, prices);
  }
  
  return results;
}

export async function fetchDividendHistoryBatch(
  tickers: string[],
  startDate?: string,
  endDate?: string,
  onProgress?: (ticker: string, index: number, total: number) => void
): Promise<Map<string, TiingoDividendData[]>> {
  const results = new Map<string, TiingoDividendData[]>();
  
  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    onProgress?.(ticker, i + 1, tickers.length);
    
    const dividends = await fetchDividendHistory(ticker, startDate, endDate);
    results.set(ticker, dividends);
  }
  
  return results;
}
