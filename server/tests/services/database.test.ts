/**
 * Database Service Tests
 * Tests all database operations including CRUD, error handling, and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSupabase,
  getAllTickers,
  getETFStatic,
  upsertETFStatic,
  updateETFMetrics,
  batchUpdateETFMetrics,
  getPriceHistory,
  getLatestPrice,
  upsertPrices,
  getDividendHistory,
  upsertDividends,
  getSyncLog,
  updateSyncLog,
  getAllSyncLogs,
} from '../../src/services/database.js';
import { mockSupabaseData } from '../setup.js';
import type { ETFStaticRecord, PriceRecord, DividendRecord, SyncLogRecord } from '../../src/types/index.js';

describe('Database Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data
    Object.keys(mockSupabaseData).forEach(key => {
      mockSupabaseData[key as keyof typeof mockSupabaseData] = [];
    });
    
    // Setup comprehensive test data
    mockSupabaseData.etf_static = [
      {
        ticker: 'SPY',
        issuer: 'State Street',
        description: 'S&P 500 ETF',
        pay_day_text: 'Quarterly',
        payments_per_year: 4,
        ipo_price: 50,
        price: 478,
        price_change: 2.5,
        price_change_pct: 0.52,
        last_dividend: 1.8,
        annual_dividend: 7.2,
        forward_yield: 1.5,
        dividend_sd: 0.1,
        dividend_cv: 0.02,
        dividend_cv_percent: 2.0,
        dividend_volatility_index: 'Very Low',
        weighted_rank: 1,
        tr_drip_1w: 0.5,
        tr_drip_1m: 1.2,
        tr_drip_3m: 2.8,
        tr_drip_6m: 4.5,
        tr_drip_12m: 8.2,
        tr_drip_3y: 25.6,
        price_return_1w: 0.5,
        price_return_1m: 1.2,
        price_return_3m: 2.8,
        price_return_6m: 4.5,
        price_return_12m: 8.2,
        price_return_3y: 25.6,
        tr_nodrip_1w: 0.5,
        tr_nodrip_1m: 1.2,
        tr_nodrip_3m: 2.8,
        tr_nodrip_6m: 4.5,
        tr_nodrip_12m: 8.2,
        tr_nodrip_3y: 25.6,
        week_52_high: 485,
        week_52_low: 410,
        last_updated: '2024-01-15T10:00:00Z',
        data_source: 'Tiingo',
      },
      {
        ticker: 'QQQ',
        issuer: 'Invesco',
        description: 'Nasdaq 100 ETF',
        pay_day_text: 'Quarterly',
        payments_per_year: 4,
        ipo_price: 40,
        price: 405,
        price_change: 1.8,
        price_change_pct: 0.45,
        last_dividend: 0.8,
        annual_dividend: 3.2,
        forward_yield: 0.79,
        dividend_sd: 0.05,
        dividend_cv: 0.015,
        dividend_cv_percent: 1.5,
        dividend_volatility_index: 'Very Low',
        weighted_rank: 2,
        tr_drip_1w: 0.3,
        tr_drip_1m: 0.9,
        tr_drip_3m: 2.1,
        tr_drip_6m: 3.8,
        tr_drip_12m: 12.5,
        tr_drip_3y: 45.2,
        price_return_1w: 0.3,
        price_return_1m: 0.9,
        price_return_3m: 2.1,
        price_return_6m: 3.8,
        price_return_12m: 12.5,
        price_return_3y: 45.2,
        tr_nodrip_1w: 0.3,
        tr_nodrip_1m: 0.9,
        tr_nodrip_3m: 2.1,
        tr_nodrip_6m: 3.8,
        tr_nodrip_12m: 12.5,
        tr_nodrip_3y: 45.2,
        week_52_high: 420,
        week_52_low: 350,
        last_updated: '2024-01-15T10:00:00Z',
        data_source: 'Tiingo',
      },
    ];
    
    mockSupabaseData.etfs = [
      { symbol: 'SPY', issuer: 'State Street', description: 'S&P 500 ETF', pay_day: 'Quarterly', payments_per_year: 4, ipo_price: 50 },
      { symbol: 'QQQ', issuer: 'Invesco', description: 'Nasdaq 100 ETF', pay_day: 'Quarterly', payments_per_year: 4, ipo_price: 40 },
    ];
    
    const today = new Date();
    mockSupabaseData.prices_daily = [
      {
        ticker: 'SPY',
        date: formatDate(today, -2),
        open: 470,
        high: 475,
        low: 468,
        close: 470,
        adj_close: 470,
        volume: 50000000,
        div_cash: 0,
        split_factor: 1,
      },
      {
        ticker: 'SPY',
        date: formatDate(today, -1),
        open: 472,
        high: 477,
        low: 470,
        close: 472,
        adj_close: 472,
        volume: 48000000,
        div_cash: 0,
        split_factor: 1,
      },
      {
        ticker: 'SPY',
        date: formatDate(today, 0),
        open: 475,
        high: 480,
        low: 473,
        close: 475,
        adj_close: 475,
        volume: 52000000,
        div_cash: 0,
        split_factor: 1,
      },
      {
        ticker: 'QQQ',
        date: formatDate(today, 0),
        open: 402,
        high: 408,
        low: 400,
        close: 405,
        adj_close: 405,
        volume: 30000000,
        div_cash: 0,
        split_factor: 1,
      },
    ];
    
    mockSupabaseData.dividends_detail = [
      {
        ticker: 'SPY',
        ex_date: formatDate(today, -30),
        pay_date: formatDate(today, -25),
        div_cash: 1.75,
        adj_amount: 1.75,
        div_type: 'regular',
      },
      {
        ticker: 'SPY',
        ex_date: formatDate(today, -120),
        pay_date: formatDate(today, -115),
        div_cash: 1.70,
        adj_amount: 1.70,
        div_type: 'regular',
      },
      {
        ticker: 'QQQ',
        ex_date: formatDate(today, -30),
        pay_date: formatDate(today, -25),
        div_cash: 0.8,
        adj_amount: 0.8,
        div_type: 'regular',
      },
    ];
    
    mockSupabaseData.data_sync_log = [
      {
        id: 1,
        ticker: 'SPY',
        data_type: 'prices',
        last_sync: '2024-01-15T10:00:00Z',
        sync_status: 'success',
        records_processed: 252,
        error_message: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 2,
        ticker: 'SPY',
        data_type: 'dividends',
        last_sync: '2024-01-15T09:00:00Z',
        sync_status: 'success',
        records_processed: 8,
        error_message: null,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z',
      },
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      
      expect(tickers).toEqual(['SPY', 'QQQ']);
      expect(tickers).toHaveLength(2);
    });

    it('should return empty array when no tickers exist', async () => {
      mockSupabaseData.etf_static = [];
      const tickers = await getAllTickers();
      
      expect(tickers).toEqual([]);
    });

    it('should fallback to etfs table when etf_static is empty', async () => {
      mockSupabaseData.etf_static = [];
      mockSupabaseData.etfs = [
        { symbol: 'VTI', issuer: 'Vanguard' },
        { symbol: 'VOO', issuer: 'Vanguard' },
      ];
      
      const tickers = await getAllTickers();
      
      expect(tickers).toEqual(['VTI', 'VOO']);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.mocked(getSupabase().from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            then: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      } as any);
      
      await expect(getAllTickers()).rejects.toThrow('Failed to fetch tickers');
    });

    it('should return tickers in alphabetical order', async () => {
      mockSupabaseData.etf_static = [
        { ticker: 'ZZZ' },
        { ticker: 'AAA' },
        { ticker: 'MMM' },
      ];
      
      const tickers = await getAllTickers();
      
      expect(tickers).toEqual(['AAA', 'MMM', 'ZZZ']);
    });
  });

  describe('getETFStatic', () => {
    it('should return ETF static data for valid ticker', async () => {
      const result = await getETFStatic('SPY');
      
      expect(result).toBeDefined();
      expect(result?.ticker).toBe('SPY');
      expect(result?.issuer).toBe('State Street');
      expect(result?.description).toBe('S&P 500 ETF');
      expect(result?.payments_per_year).toBe(4);
    });

    it('should return null for invalid ticker', async () => {
      const result = await getETFStatic('INVALID');
      
      expect(result).toBeNull();
    });

    it('should handle case insensitive ticker lookup', async () => {
      const result1 = await getETFStatic('spy');
      const result2 = await getETFStatic('SPY');
      const result3 = await getETFStatic('Spy');
      
      expect(result1?.ticker).toBe('SPY');
      expect(result2?.ticker).toBe('SPY');
      expect(result3?.ticker).toBe('SPY');
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('should fallback to legacy table for old data', async () => {
      mockSupabaseData.etf_static = [];
      mockSupabaseData.etfs = [
        {
          symbol: 'VTI',
          issuer: 'Vanguard',
          description: 'Total Stock Market ETF',
          pay_day: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 100,
        },
      ];
      
      const result = await getETFStatic('VTI');
      
      expect(result).toBeDefined();
      expect(result?.ticker).toBe('VTI');
      expect(result?.issuer).toBe('Vanguard');
      // Legacy data should have null computed fields
      expect(result?.price).toBeNull();
      expect(result?.forward_yield).toBeNull();
      expect(result?.dividend_sd).toBeNull();
    });

    it('should return null when ticker not found in either table', async () => {
      mockSupabaseData.etf_static = [];
      mockSupabaseData.etfs = [];
      
      const result = await getETFStatic('NOTFOUND');
      
      expect(result).toBeNull();
    });
  });

  describe('upsertETFStatic', () => {
    it('should upsert ETF static records successfully', async () => {
      const records: ETFStaticRecord[] = [
        {
          ticker: 'NEW',
          issuer: 'New Corp',
          description: 'New ETF',
          pay_day_text: 'Monthly',
          payments_per_year: 12,
          ipo_price: 50,
          price: 100,
          price_change: 0,
          price_change_pct: 0,
          last_dividend: 0.5,
          annual_dividend: 6,
          forward_yield: 6,
          dividend_sd: 0.1,
          dividend_cv: 0.02,
          dividend_cv_percent: 2,
          dividend_volatility_index: 'Very Low',
          weighted_rank: null,
          tr_drip_1w: null,
          tr_drip_1m: null,
          tr_drip_3m: null,
          tr_drip_6m: null,
          tr_drip_12m: null,
          tr_drip_3y: null,
          price_return_1w: null,
          price_return_1m: null,
          price_return_3m: null,
          price_return_6m: null,
          price_return_12m: null,
          price_return_3y: null,
          tr_nodrip_1w: null,
          tr_nodrip_1m: null,
          tr_nodrip_3m: null,
          tr_nodrip_6m: null,
          tr_nodrip_12m: null,
          tr_nodrip_3y: null,
          week_52_high: null,
          week_52_low: null,
          last_updated: null,
          data_source: null,
        },
      ];
      
      const result = await upsertETFStatic(records);
      
      expect(result).toBe(1);
      expect(mockSupabaseData.etf_static).toContainEqual(records[0]);
    });

    it('should handle multiple records', async () => {
      const records: ETFStaticRecord[] = [
        { ...mockSupabaseData.etf_static[0], ticker: 'TEST1' },
        { ...mockSupabaseData.etf_static[0], ticker: 'TEST2' },
        { ...mockSupabaseData.etf_static[0], ticker: 'TEST3' },
      ];
      
      const result = await upsertETFStatic(records);
      
      expect(result).toBe(3);
      expect(mockSupabaseData.etf_static).toHaveLength(5); // 2 existing + 3 new
    });

    it('should handle empty records array', async () => {
      const result = await upsertETFStatic([]);
      
      expect(result).toBe(0);
    });

    it('should handle database errors during upsert', async () => {
      const records: ETFStaticRecord[] = [{ ...mockSupabaseData.etf_static[0], ticker: 'ERROR' }];
      
      // Mock database error
      vi.mocked(getSupabase().from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          then: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      } as any);
      
      await expect(upsertETFStatic(records)).rejects.toThrow('Failed to upsert etf_static');
    });
  });

  describe('updateETFMetrics', () => {
    it('should update metrics for specific ticker', async () => {
      const metrics = {
        price: 500,
        forward_yield: 2.5,
        dividend_cv_percent: 3.0,
      };
      
      await updateETFMetrics('SPY', metrics);
      
      const updated = mockSupabaseData.etf_static.find(etf => etf.ticker === 'SPY');
      expect(updated?.price).toBe(500);
      expect(updated?.forward_yield).toBe(2.5);
      expect(updated?.dividend_cv_percent).toBe(3.0);
      expect(updated?.last_updated).toBeDefined();
    });

    it('should handle case insensitive ticker update', async () => {
      const metrics = { price: 600 };
      
      await updateETFMetrics('spy', metrics);
      
      const updated = mockSupabaseData.etf_static.find(etf => etf.ticker === 'SPY');
      expect(updated?.price).toBe(600);
    });

    it('should handle update for non-existent ticker (no error thrown)', async () => {
      const metrics = { price: 700 };
      
      // Should not throw error
      await expect(updateETFMetrics('NONEXISTENT', metrics)).resolves.not.toThrow();
    });

    it('should include timestamp in update', async () => {
      const metrics = { price: 800 };
      
      await updateETFMetrics('SPY', metrics);
      
      const updated = mockSupabaseData.etf_static.find(etf => etf.ticker === 'SPY');
      expect(updated?.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('batchUpdateETFMetrics', () => {
    it('should update metrics for multiple tickers', async () => {
      const updates = [
        { ticker: 'SPY', metrics: { price: 500, forward_yield: 2.5 } },
        { ticker: 'QQQ', metrics: { price: 410, dividend_cv_percent: 1.8 } },
      ];
      
      const result = await batchUpdateETFMetrics(updates);
      
      expect(result).toBe(2);
      
      const spyUpdated = mockSupabaseData.etf_static.find(etf => etf.ticker === 'SPY');
      const qqqUpdated = mockSupabaseData.etf_static.find(etf => etf.ticker === 'QQQ');
      
      expect(spyUpdated?.price).toBe(500);
      expect(spyUpdated?.forward_yield).toBe(2.5);
      expect(qqqUpdated?.price).toBe(410);
      expect(qqqUpdated?.dividend_cv_percent).toBe(1.8);
    });

    it('should handle partial failures gracefully', async () => {
      const updates = [
        { ticker: 'SPY', metrics: { price: 500 } },
        { ticker: 'NONEXISTENT', metrics: { price: 600 } },
        { ticker: 'QQQ', metrics: { price: 410 } },
      ];
      
      const result = await batchUpdateETFMetrics(updates);
      
      // Should update 2 out of 3 (NONEXISTENT fails silently)
      expect(result).toBe(2);
    });

    it('should handle empty updates array', async () => {
      const result = await batchUpdateETFMetrics([]);
      
      expect(result).toBe(0);
    });

    it('should continue processing after individual failures', async () => {
      const updates = [
        { ticker: 'SPY', metrics: { price: 500 } },
        { ticker: 'ERROR', metrics: { price: 600 } }, // This will cause an error
        { ticker: 'QQQ', metrics: { price: 410 } },
      ];
      
      // Mock error for one ticker
      const originalUpdate = updateETFMetrics;
      vi.mocked(updateETFMetrics).mockImplementation(async (ticker, metrics) => {
        if (ticker === 'ERROR') {
          throw new Error('Database error');
        }
        return originalUpdate(ticker, metrics);
      });
      
      const result = await batchUpdateETFMetrics(updates);
      
      // Should process 2 out of 3 successfully
      expect(result).toBe(2);
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for valid ticker and date range', async () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const result = await getPriceHistory('SPY', startDate);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].ticker).toBe('SPY');
    });

    it('should filter by start date', async () => {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0]; // Only today
      
      const result = await getPriceHistory('SPY', startDate);
      
      expect(result.length).toBe(1);
      expect(result[0].date).toBe(startDate);
    });

    it('should filter by end date', async () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Yesterday
      
      const result = await getPriceHistory('SPY', startDate, endDate);
      
      expect(result.length).toBe(1);
      expect(new Date(result[0].date).getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
    });

    it('should return empty array for invalid ticker', async () => {
      const result = await getPriceHistory('INVALID', '2024-01-01');
      
      expect(result).toEqual([]);
    });

    it('should return prices in chronological order', async () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const result = await getPriceHistory('SPY', startDate);
      
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(new Date(result[i].date).getTime()).toBeGreaterThan(new Date(result[i-1].date).getTime());
        }
      }
    });

    it('should handle case insensitive ticker lookup', async () => {
      const result1 = await getPriceHistory('spy', '2024-01-01');
      const result2 = await getPriceHistory('SPY', '2024-01-01');
      
      expect(result1).toEqual(result2);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.mocked(getSupabase().from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                then: vi.fn().mockRejectedValue(new Error('Database error')),
              }),
            }),
          }),
        }),
      } as any);
      
      const result = await getPriceHistory('SPY', '2024-01-01');
      
      expect(result).toEqual([]);
    });
  });

  describe('getLatestPrice', () => {
    it('should return latest prices with default limit', async () => {
      const result = await getLatestPrice('SPY');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(2);
      expect(result[0].ticker).toBe('SPY');
      // Should be in chronological order (oldest first)
      if (result.length > 1) {
        expect(new Date(result[0].date).getTime()).toBeLessThan(new Date(result[1].date).getTime());
      }
    });

    it('should respect custom limit', async () => {
      const result = await getLatestPrice('SPY', 1);
      
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for invalid ticker', async () => {
      const result = await getLatestPrice('INVALID');
      
      expect(result).toEqual([]);
    });

    it('should handle case insensitive ticker lookup', async () => {
      const result1 = await getLatestPrice('spy');
      const result2 = await getLatestPrice('SPY');
      
      expect(result1).toEqual(result2);
    });

    it('should return prices in chronological order', async () => {
      const result = await getLatestPrice('SPY', 2);
      
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(new Date(result[i].date).getTime()).toBeGreaterThan(new Date(result[i-1].date).getTime());
        }
      }
    });
  });

  describe('upsertPrices', () => {
    it('should upsert price records successfully', async () => {
      const records: PriceRecord[] = [
        {
          ticker: 'NEW',
          date: '2024-01-15',
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          adj_close: 102,
          volume: 1000000,
          div_cash: 0,
          split_factor: 1,
        },
      ];
      
      const result = await upsertPrices(records);
      
      expect(result).toBe(1);
      expect(mockSupabaseData.prices_daily).toContainEqual(records[0]);
    });

    it('should handle multiple records', async () => {
      const records: PriceRecord[] = [
        { ...mockSupabaseData.prices_daily[0], ticker: 'TEST1', date: '2024-01-15' },
        { ...mockSupabaseData.prices_daily[0], ticker: 'TEST2', date: '2024-01-15' },
        { ...mockSupabaseData.prices_daily[0], ticker: 'TEST3', date: '2024-01-15' },
      ];
      
      const result = await upsertPrices(records);
      
      expect(result).toBe(3);
      expect(mockSupabaseData.prices_daily).toHaveLength(7); // 4 existing + 3 new
    });

    it('should handle empty records array', async () => {
      const result = await upsertPrices([]);
      
      expect(result).toBe(0);
    });

    it('should process records in batches', async () => {
      const records: PriceRecord[] = Array.from({ length: 1200 }, (_, i) => ({
        ...mockSupabaseData.prices_daily[0],
        ticker: `TEST${i}`,
        date: `2024-01-${String(i % 28 + 1).padStart(2, '0')}`,
      }));
      
      const result = await upsertPrices(records, 500);
      
      expect(result).toBe(1200);
    });

    it('should handle batch errors gracefully', async () => {
      const records: PriceRecord[] = [
        { ...mockSupabaseData.prices_daily[0], ticker: 'GOOD' },
        { ...mockSupabaseData.prices_daily[0], ticker: 'ERROR' },
      ];
      
      // Mock error for second batch
      let callCount = 0;
      vi.mocked(getSupabase().from).mockImplementation((table: string) => ({
        upsert: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            return Promise.resolve({ error: { message: 'Database error' } });
          }
          return Promise.resolve({ error: null });
        }),
      } as any));
      
      const result = await upsertPrices(records, 1);
      
      // Should insert 1 out of 2 records
      expect(result).toBe(1);
    });
  });

  describe('getDividendHistory', () => {
    it('should return dividend history for valid ticker', async () => {
      const result = await getDividendHistory('SPY');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].ticker).toBe('SPY');
    });

    it('should filter by start date', async () => {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      
      const result = await getDividendHistory('SPY', startDate);
      
      expect(result.length).toBe(1);
      expect(result[0].ex_date).toBe(startDate);
    });

    it('should return dividends in descending order by ex_date', async () => {
      const result = await getDividendHistory('SPY');
      
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(new Date(result[i].ex_date).getTime()).toBeLessThanOrEqual(new Date(result[i-1].ex_date).getTime());
        }
      }
    });

    it('should return empty array for invalid ticker', async () => {
      const result = await getDividendHistory('INVALID');
      
      expect(result).toEqual([]);
    });

    it('should handle case insensitive ticker lookup', async () => {
      const result1 = await getDividendHistory('spy');
      const result2 = await getDividendHistory('SPY');
      
      expect(result1).toEqual(result2);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(getSupabase().from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              then: vi.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      } as any);
      
      const result = await getDividendHistory('SPY');
      
      expect(result).toEqual([]);
    });
  });

  describe('upsertDividends', () => {
    it('should upsert dividend records successfully', async () => {
      const records: DividendRecord[] = [
        {
          ticker: 'NEW',
          ex_date: '2024-01-15',
          pay_date: '2024-01-20',
          div_cash: 1.0,
          adj_amount: 1.0,
          div_type: 'regular',
        },
      ];
      
      const result = await upsertDividends(records);
      
      expect(result).toBe(1);
      expect(mockSupabaseData.dividends_detail).toContainEqual(records[0]);
    });

    it('should handle multiple records', async () => {
      const records: DividendRecord[] = [
        { ...mockSupabaseData.dividends_detail[0], ticker: 'TEST1', ex_date: '2024-01-15' },
        { ...mockSupabaseData.dividends_detail[0], ticker: 'TEST2', ex_date: '2024-01-16' },
        { ...mockSupabaseData.dividends_detail[0], ticker: 'TEST3', ex_date: '2024-01-17' },
      ];
      
      const result = await upsertDividends(records);
      
      expect(result).toBe(3);
      expect(mockSupabaseData.dividends_detail).toHaveLength(6); // 3 existing + 3 new
    });

    it('should handle empty records array', async () => {
      const result = await upsertDividends([]);
      
      expect(result).toBe(0);
    });

    it('should process records in batches', async () => {
      const records: DividendRecord[] = Array.from({ length: 250 }, (_, i) => ({
        ...mockSupabaseData.dividends_detail[0],
        ticker: `TEST${i}`,
        ex_date: `2024-01-${String(i % 28 + 1).padStart(2, '0')}`,
      }));
      
      const result = await upsertDividends(records, 100);
      
      expect(result).toBe(250);
    });

    it('should handle batch errors gracefully', async () => {
      const records: DividendRecord[] = [
        { ...mockSupabaseData.dividends_detail[0], ticker: 'GOOD', ex_date: '2024-01-15' },
        { ...mockSupabaseData.dividends_detail[0], ticker: 'ERROR', ex_date: '2024-01-16' },
      ];
      
      let callCount = 0;
      vi.mocked(getSupabase().from).mockImplementation((table: string) => ({
        upsert: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            return Promise.resolve({ error: { message: 'Database error' } });
          }
          return Promise.resolve({ error: null });
        }),
      } as any));
      
      const result = await upsertDividends(records, 1);
      
      expect(result).toBe(1);
    });
  });

  describe('getSyncLog', () => {
    it('should return sync log for valid ticker and data type', async () => {
      const result = await getSyncLog('SPY', 'prices');
      
      expect(result).toBeDefined();
      expect(result?.ticker).toBe('SPY');
      expect(result?.data_type).toBe('prices');
      expect(result?.sync_status).toBe('success');
    });

    it('should return null for invalid combination', async () => {
      const result = await getSyncLog('INVALID', 'prices');
      
      expect(result).toBeNull();
    });

    it('should return null for valid ticker but invalid data type', async () => {
      const result = await getSyncLog('SPY', 'invalid_type');
      
      expect(result).toBeNull();
    });

    it('should handle different data types for same ticker', async () => {
      const pricesResult = await getSyncLog('SPY', 'prices');
      const dividendsResult = await getSyncLog('SPY', 'dividends');
      
      expect(pricesResult?.data_type).toBe('prices');
      expect(dividendsResult?.data_type).toBe('dividends');
      expect(pricesResult?.id).not.toBe(dividendsResult?.id);
    });
  });

  describe('updateSyncLog', () => {
    it('should update existing sync log', async () => {
      const record: Omit<SyncLogRecord, 'id' | 'created_at'> = {
        ticker: 'SPY',
        data_type: 'prices',
        last_sync: '2024-01-15T11:00:00Z',
        sync_status: 'success',
        records_processed: 300,
        error_message: null,
        updated_at: '2024-01-15T11:00:00Z',
      };
      
      await updateSyncLog(record);
      
      const updated = mockSupabaseData.data_sync_log.find(
        log => log.ticker === 'SPY' && log.data_type === 'prices'
      );
      
      expect(updated?.last_sync).toBe('2024-01-15T11:00:00Z');
      expect(updated?.records_processed).toBe(300);
      expect(updated?.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should create new sync log if not exists', async () => {
      const record: Omit<SyncLogRecord, 'id' | 'created_at'> = {
        ticker: 'NEW',
        data_type: 'prices',
        last_sync: '2024-01-15T12:00:00Z',
        sync_status: 'success',
        records_processed: 100,
        error_message: null,
        updated_at: '2024-01-15T12:00:00Z',
      };
      
      await updateSyncLog(record);
      
      const created = mockSupabaseData.data_sync_log.find(
        log => log.ticker === 'NEW' && log.data_type === 'prices'
      );
      
      expect(created).toBeDefined();
      expect(created?.ticker).toBe('NEW');
      expect(created?.data_type).toBe('prices');
    });

    it('should handle error records', async () => {
      const record: Omit<SyncLogRecord, 'id' | 'created_at'> = {
        ticker: 'ERROR',
        data_type: 'prices',
        last_sync: '2024-01-15T13:00:00Z',
        sync_status: 'failed',
        records_processed: 0,
        error_message: 'Network timeout',
        updated_at: '2024-01-15T13:00:00Z',
      };
      
      await updateSyncLog(record);
      
      const created = mockSupabaseData.data_sync_log.find(
        log => log.ticker === 'ERROR' && log.data_type === 'prices'
      );
      
      expect(created?.sync_status).toBe('failed');
      expect(created?.error_message).toBe('Network timeout');
    });
  });

  describe('getAllSyncLogs', () => {
    it('should return all sync logs', async () => {
      const result = await getAllSyncLogs();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should return logs in descending order by updated_at', async () => {
      const result = await getAllSyncLogs();
      
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(new Date(result[i].updated_at).getTime()).toBeLessThanOrEqual(
            new Date(result[i-1].updated_at).getTime()
          );
        }
      }
    });

    it('should return empty array when no logs exist', async () => {
      mockSupabaseData.data_sync_log = [];
      
      const result = await getAllSyncLogs();
      
      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(getSupabase().from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            then: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      } as any);
      
      const result = await getAllSyncLogs();
      
      expect(result).toEqual([]);
    });
  });

  describe('Cross-Table Operations', () => {
    it('should maintain data consistency across related operations', async () => {
      // Add ETF static data
      const etfRecord: ETFStaticRecord = {
        ticker: 'CONSISTENCY',
        issuer: 'Test Corp',
        description: 'Consistency Test ETF',
        pay_day_text: 'Quarterly',
        payments_per_year: 4,
        ipo_price: 100,
        price: null,
        price_change: null,
        price_change_pct: null,
        last_dividend: null,
        annual_dividend: null,
        forward_yield: null,
        dividend_sd: null,
        dividend_cv: null,
        dividend_cv_percent: null,
        dividend_volatility_index: null,
        weighted_rank: null,
        tr_drip_1w: null,
        tr_drip_1m: null,
        tr_drip_3m: null,
        tr_drip_6m: null,
        tr_drip_12m: null,
        tr_drip_3y: null,
        price_return_1w: null,
        price_return_1m: null,
        price_return_3m: null,
        price_return_6m: null,
        price_return_12m: null,
        price_return_3y: null,
        tr_nodrip_1w: null,
        tr_nodrip_1m: null,
        tr_nodrip_3m: null,
        tr_nodrip_6m: null,
        tr_nodrip_12m: null,
        tr_nodrip_3y: null,
        week_52_high: null,
        week_52_low: null,
        last_updated: null,
        data_source: null,
      };
      
      await upsertETFStatic([etfRecord]);
      
      // Add price data
      const priceRecord: PriceRecord = {
        ticker: 'CONSISTENCY',
        date: '2024-01-15',
        open: 100,
        high: 105,
        low: 95,
        close: 102,
        adj_close: 102,
        volume: 1000000,
        div_cash: 0,
        split_factor: 1,
      };
      
      await upsertPrices([priceRecord]);
      
      // Add dividend data
      const dividendRecord: DividendRecord = {
        ticker: 'CONSISTENCY',
        ex_date: '2024-01-15',
        pay_date: '2024-01-20',
        div_cash: 1.0,
        adj_amount: 1.0,
        div_type: 'regular',
      };
      
      await upsertDividends([dividendRecord]);
      
      // Update metrics
      await updateETFMetrics('CONSISTENCY', {
        price: 102,
        forward_yield: 3.92,
      });
      
      // Verify all data is consistent
      const etf = await getETFStatic('CONSISTENCY');
      const prices = await getPriceHistory('CONSISTENCY', '2024-01-15');
      const dividends = await getDividendHistory('CONSISTENCY', '2024-01-15');
      
      expect(etf?.ticker).toBe('CONSISTENCY');
      expect(etf?.price).toBe(102);
      expect(prices).toHaveLength(1);
      expect(dividends).toHaveLength(1);
      expect(prices[0].ticker).toBe('CONSISTENCY');
      expect(dividends[0].ticker).toBe('CONSISTENCY');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null and undefined values gracefully', async () => {
      const etfRecord: ETFStaticRecord = {
        ticker: 'NULLTEST',
        issuer: 'Null Test Corp',
        description: 'Null Test ETF',
        pay_day_text: null,
        payments_per_year: null,
        ipo_price: null,
        price: null,
        price_change: null,
        price_change_pct: null,
        last_dividend: null,
        annual_dividend: null,
        forward_yield: null,
        dividend_sd: null,
        dividend_cv: null,
        dividend_cv_percent: null,
        dividend_volatility_index: null,
        weighted_rank: null,
        tr_drip_1w: null,
        tr_drip_1m: null,
        tr_drip_3m: null,
        tr_drip_6m: null,
        tr_drip_12m: null,
        tr_drip_3y: null,
        price_return_1w: null,
        price_return_1m: null,
        price_return_3m: null,
        price_return_6m: null,
        price_return_12m: null,
        price_return_3y: null,
        tr_nodrip_1w: null,
        tr_nodrip_1m: null,
        tr_nodrip_3m: null,
        tr_nodrip_6m: null,
        tr_nodrip_12m: null,
        tr_nodrip_3y: null,
        week_52_high: null,
        week_52_low: null,
        last_updated: null,
        data_source: null,
      };
      
      const result = await upsertETFStatic([etfRecord]);
      
      expect(result).toBe(1);
      
      const retrieved = await getETFStatic('NULLTEST');
      expect(retrieved?.ticker).toBe('NULLTEST');
      expect(retrieved?.pay_day_text).toBeNull();
    });

    it('should handle very large datasets', async () => {
      const largePriceSet: PriceRecord[] = Array.from({ length: 1000 }, (_, i) => ({
        ticker: 'LARGE',
        date: `2024-01-${String(i % 28 + 1).padStart(2, '0')}`,
        open: 100 + Math.random() * 10,
        high: 105 + Math.random() * 10,
        low: 95 + Math.random() * 10,
        close: 100 + Math.random() * 10,
        adj_close: 100 + Math.random() * 10,
        volume: Math.floor(Math.random() * 100000000),
        div_cash: 0,
        split_factor: 1,
      }));
      
      const result = await upsertPrices(largePriceSet, 1000);
      
      expect(result).toBe(1000);
    });

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        upsertETFStatic([{
          ticker: `CONCURRENT${i}`,
          issuer: `Concurrent Corp ${i}`,
          description: `Concurrent ETF ${i}`,
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 100,
          price: null,
          price_change: null,
          price_change_pct: null,
          last_dividend: null,
          annual_dividend: null,
          forward_yield: null,
          dividend_sd: null,
          dividend_cv: null,
          dividend_cv_percent: null,
          dividend_volatility_index: null,
          weighted_rank: null,
          tr_drip_1w: null,
          tr_drip_1m: null,
          tr_drip_3m: null,
          tr_drip_6m: null,
          tr_drip_12m: null,
          tr_drip_3y: null,
          price_return_1w: null,
          price_return_1m: null,
          price_return_3m: null,
          price_return_6m: null,
          price_return_12m: null,
          price_return_3y: null,
          tr_nodrip_1w: null,
          tr_nodrip_1m: null,
          tr_nodrip_3m: null,
          tr_nodrip_6m: null,
          tr_nodrip_12m: null,
          tr_nodrip_3y: null,
          week_52_high: null,
          week_52_low: null,
          last_updated: null,
          data_source: null,
        }])
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBe(1);
      });
      
      const tickers = await getAllTickers();
      const concurrentTickers = tickers.filter(t => t.startsWith('CONCURRENT'));
      expect(concurrentTickers).toHaveLength(10);
    });
  });
});

// Helper
function formatDate(date: Date, daysOffset: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}
