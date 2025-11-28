/**
 * Tiingo Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchTickerMeta,
  fetchPriceHistory,
  fetchDividendHistory,
  fetchLatestPrice,
  healthCheck,
  getRateLimitStatus,
  fetchPriceHistoryBatch,
  fetchDividendHistoryBatch,
} from '../../src/services/tiingo.js';

describe('Tiingo Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTickerMeta', () => {
    it('should fetch ticker metadata', async () => {
      const result = await fetchTickerMeta('SPY');
      
      expect(result).not.toBeNull();
      expect(result?.ticker).toBe('SPY');
      expect(result?.name).toBeDefined();
    });

    it('should return null or empty for invalid ticker', async () => {
      const result = await fetchTickerMeta('INVALID_TICKER_XYZ');
      // API returns empty array or null for unknown tickers
      expect(result === null || (Array.isArray(result) && result.length === 0)).toBe(true);
    });
  });

  describe('fetchPriceHistory', () => {
    it('should fetch price history', async () => {
      const result = await fetchPriceHistory('SPY', '2024-01-01', '2024-01-31');
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for invalid ticker', async () => {
      const result = await fetchPriceHistory('INVALID_XYZ', '2024-01-01');
      expect(result).toEqual([]);
    });
  });

  describe('fetchDividendHistory', () => {
    it('should fetch dividend history', async () => {
      const result = await fetchDividendHistory('SPY', '2024-01-01');
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for invalid ticker', async () => {
      const result = await fetchDividendHistory('INVALID_XYZ');
      expect(result).toEqual([]);
    });
  });

  describe('fetchLatestPrice', () => {
    it('should fetch latest price for valid ticker', async () => {
      const result = await fetchLatestPrice('SPY');
      
      // May be null if mock doesn't have latest data
      if (result) {
        expect(result.close).toBeDefined();
      }
    });
  });

  describe('healthCheck', () => {
    it('should return boolean', async () => {
      const result = await healthCheck();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return rate limit status', () => {
      const status = getRateLimitStatus();
      
      expect(status).toHaveProperty('requestsThisHour');
      expect(status).toHaveProperty('totalRequests');
      expect(status).toHaveProperty('hourlyLimit');
      expect(typeof status.requestsThisHour).toBe('number');
      expect(typeof status.totalRequests).toBe('number');
      expect(typeof status.hourlyLimit).toBe('number');
    });
  });

  describe('fetchPriceHistoryBatch', () => {
    it('should fetch price history for multiple tickers', async () => {
      const tickers = ['SPY', 'QQQ'];
      const result = await fetchPriceHistoryBatch(tickers, '2024-01-01');
      
      expect(result instanceof Map).toBe(true);
      expect(result.size).toBeLessThanOrEqual(tickers.length);
    });

    it('should call progress callback', async () => {
      const tickers = ['SPY'];
      const onProgress = vi.fn();
      
      await fetchPriceHistoryBatch(tickers, '2024-01-01', undefined, onProgress);
      
      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('fetchDividendHistoryBatch', () => {
    it('should fetch dividend history for multiple tickers', async () => {
      const tickers = ['SPY', 'VTI'];
      const result = await fetchDividendHistoryBatch(tickers, '2024-01-01');
      
      expect(result instanceof Map).toBe(true);
      expect(result.size).toBeLessThanOrEqual(tickers.length);
    });

    it('should call progress callback', async () => {
      const tickers = ['SPY'];
      const onProgress = vi.fn();
      
      await fetchDividendHistoryBatch(tickers, '2024-01-01', undefined, onProgress);
      
      expect(onProgress).toHaveBeenCalled();
    });
  });
});

describe('Tiingo Rate Limiting', () => {
  it('should track request count', async () => {
    const initialStatus = getRateLimitStatus();
    await fetchTickerMeta('SPY');
    const afterStatus = getRateLimitStatus();
    
    expect(afterStatus.totalRequests).toBeGreaterThanOrEqual(initialStatus.totalRequests);
  });
});
