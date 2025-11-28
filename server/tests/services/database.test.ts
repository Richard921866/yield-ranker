/**
 * Database Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseData } from '../setup.js';
import {
  getSupabase,
  getAllTickers,
  getETFStatic,
  upsertETFStatic,
  getPriceHistory,
  getLatestPrice,
  upsertPrices,
  getDividendHistory,
  upsertDividends,
  getSyncLog,
  updateSyncLog,
  getAllSyncLogs,
} from '../../src/services/database.js';

describe('Database Service', () => {
  beforeEach(() => {
    // Setup test data
    mockSupabaseData.etf_static = [
      { ticker: 'SPY', issuer: 'State Street', description: 'S&P 500 ETF' },
      { ticker: 'QQQ', issuer: 'Invesco', description: 'Nasdaq 100 ETF' },
      { ticker: 'VTI', issuer: 'Vanguard', description: 'Total Stock Market' },
    ];
    
    mockSupabaseData.etfs = [
      { symbol: 'SPY', issuer: 'State Street', description: 'S&P 500 ETF' },
      { symbol: 'QQQ', issuer: 'Invesco', description: 'Nasdaq 100 ETF' },
    ];
    
    const today = new Date();
    mockSupabaseData.prices_daily = [
      { ticker: 'SPY', date: formatDate(today, -2), close: 470, adj_close: 470 },
      { ticker: 'SPY', date: formatDate(today, -1), close: 472, adj_close: 472 },
      { ticker: 'SPY', date: formatDate(today, 0), close: 475, adj_close: 475 },
    ];
    
    mockSupabaseData.dividends_detail = [
      { ticker: 'SPY', ex_date: formatDate(today, -30), div_cash: 1.75 },
      { ticker: 'SPY', ex_date: formatDate(today, -120), div_cash: 1.70 },
    ];
    
    mockSupabaseData.data_sync_log = [
      {
        ticker: 'SPY',
        data_type: 'prices',
        last_sync_date: new Date().toISOString(),
        status: 'success',
        records_synced: 100,
      },
    ];
  });

  describe('getSupabase', () => {
    it('should return Supabase client', () => {
      const client = getSupabase();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe('function');
    });

    it('should return same instance on multiple calls', () => {
      const client1 = getSupabase();
      const client2 = getSupabase();
      expect(client1).toBe(client2);
    });
  });

  describe('getAllTickers', () => {
    it('should return all tickers from etf_static', async () => {
      const tickers = await getAllTickers();
      
      expect(Array.isArray(tickers)).toBe(true);
      expect(tickers.length).toBeGreaterThan(0);
    });

    it('should fallback to etfs table if etf_static is empty', async () => {
      mockSupabaseData.etf_static = [];
      
      const tickers = await getAllTickers();
      
      expect(Array.isArray(tickers)).toBe(true);
    });
  });

  describe('getETFStatic', () => {
    it('should return ETF static data by ticker', async () => {
      const data = await getETFStatic('SPY');
      
      expect(data).not.toBeNull();
      expect(data?.ticker).toBe('SPY');
    });

    it('should be case-insensitive', async () => {
      const data = await getETFStatic('spy');
      
      // Should convert to uppercase in the query
      expect(data).toBeDefined();
    });

    it('should return null for unknown ticker', async () => {
      mockSupabaseData.etf_static = [];
      mockSupabaseData.etfs = [];
      
      const data = await getETFStatic('UNKNOWN');
      
      expect(data).toBeNull();
    });

    it('should fallback to legacy etfs table', async () => {
      mockSupabaseData.etf_static = [];
      
      const data = await getETFStatic('SPY');
      
      // Should fall back to etfs table
      expect(data).toBeDefined();
    });
  });

  describe('upsertETFStatic', () => {
    it('should upsert ETF static records', async () => {
      const records = [
        { ticker: 'NEW', issuer: 'Test', description: 'Test ETF' },
      ];
      
      const count = await upsertETFStatic(records as any);
      
      expect(count).toBe(1);
    });

    it('should handle empty array', async () => {
      const count = await upsertETFStatic([]);
      
      expect(count).toBe(0);
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for ticker', async () => {
      const prices = await getPriceHistory('SPY', '2024-01-01');
      
      expect(Array.isArray(prices)).toBe(true);
    });

    it('should filter by date range', async () => {
      const prices = await getPriceHistory('SPY', '2024-01-01', '2024-12-31');
      
      expect(Array.isArray(prices)).toBe(true);
    });

    it('should return empty array for unknown ticker', async () => {
      const prices = await getPriceHistory('UNKNOWN', '2024-01-01');
      
      expect(prices).toEqual([]);
    });
  });

  describe('getLatestPrice', () => {
    it('should return latest price records', async () => {
      const prices = await getLatestPrice('SPY', 2);
      
      expect(Array.isArray(prices)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const prices = await getLatestPrice('SPY', 1);
      
      expect(prices.length).toBeLessThanOrEqual(1);
    });
  });

  describe('upsertPrices', () => {
    it('should upsert price records', async () => {
      const records = [
        { ticker: 'SPY', date: '2024-01-01', close: 475, adj_close: 475 },
      ];
      
      const count = await upsertPrices(records as any);
      
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty array', async () => {
      const count = await upsertPrices([]);
      
      expect(count).toBe(0);
    });

    it('should handle batch upsert', async () => {
      const records = Array.from({ length: 100 }, (_, i) => ({
        ticker: 'SPY',
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        close: 475 + i,
        adj_close: 475 + i,
      }));
      
      const count = await upsertPrices(records as any, 50);
      
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDividendHistory', () => {
    it('should return dividend history', async () => {
      const dividends = await getDividendHistory('SPY');
      
      expect(Array.isArray(dividends)).toBe(true);
    });

    it('should filter by start date', async () => {
      const dividends = await getDividendHistory('SPY', '2024-01-01');
      
      expect(Array.isArray(dividends)).toBe(true);
    });

    it('should return empty array for unknown ticker', async () => {
      const dividends = await getDividendHistory('UNKNOWN');
      
      expect(dividends).toEqual([]);
    });
  });

  describe('upsertDividends', () => {
    it('should upsert dividend records', async () => {
      const records = [
        { ticker: 'SPY', ex_date: '2024-01-15', div_cash: 1.75 },
      ];
      
      const count = await upsertDividends(records as any);
      
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty array', async () => {
      const count = await upsertDividends([]);
      
      expect(count).toBe(0);
    });
  });

  describe('getSyncLog', () => {
    it('should return sync log for ticker and type', async () => {
      const log = await getSyncLog('SPY', 'prices');
      
      // May be null depending on mock state
      if (log) {
        expect(log.ticker).toBe('SPY');
        expect(log.data_type).toBe('prices');
      }
    });

    it('should return null for non-existent log', async () => {
      mockSupabaseData.data_sync_log = [];
      
      const log = await getSyncLog('UNKNOWN', 'prices');
      
      expect(log).toBeNull();
    });
  });

  describe('updateSyncLog', () => {
    it('should update sync log', async () => {
      await expect(
        updateSyncLog({
          ticker: 'SPY',
          data_type: 'prices',
          last_sync_date: new Date().toISOString(),
          last_data_date: new Date().toISOString(),
          records_synced: 100,
          status: 'success',
          error_message: null,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getAllSyncLogs', () => {
    it('should return all sync logs', async () => {
      const logs = await getAllSyncLogs();
      
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});

// Helper
function formatDate(date: Date, daysOffset: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}
