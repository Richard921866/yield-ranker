/**
 * Chart Data Generation Tests
 * Tests the getChartData function for different periods and data scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getChartData } from '../../src/services/metrics.js';
import { mockSupabaseData } from '../setup.js';
import type { ChartPeriod } from '../../src/types/index.js';

describe('Chart Data Generation', () => {
  beforeEach(() => {
    // Reset mock data
    mockSupabaseData.prices_daily = [];
    mockSupabaseData.etf_static = [];
  });

  describe('Basic Chart Data Structure', () => {
    beforeEach(() => {
      // Setup basic price data
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
          open: 450,
          high: 455,
          low: 448,
          close: 452,
          adj_close: 452,
          volume: 50000000,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days ago
          open: 452,
          high: 458,
          low: 450,
          close: 456,
          adj_close: 456,
          volume: 48000000,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
          open: 456,
          high: 462,
          low: 454,
          close: 460,
          adj_close: 460,
          volume: 52000000,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
          open: 460,
          high: 466,
          low: 458,
          close: 464,
          adj_close: 464,
          volume: 49000000,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
          open: 464,
          high: 470,
          low: 462,
          close: 468,
          adj_close: 468,
          volume: 51000000,
          div_cash: 0,
          split_factor: 1,
        },
      ];
    });

    it('should return chart data for valid ticker and period', async () => {
      const data = await getChartData('SPY', '1W');

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should include all required fields in chart data points', async () => {
      const data = await getChartData('SPY', '1W');

      if (data.length > 0) {
        const point = data[0];
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('timestamp');
        expect(point).toHaveProperty('open');
        expect(point).toHaveProperty('high');
        expect(point).toHaveProperty('low');
        expect(point).toHaveProperty('close');
        expect(point).toHaveProperty('adjClose');
        expect(point).toHaveProperty('volume');
        expect(point).toHaveProperty('divCash');
        expect(point).toHaveProperty('priceReturn');
        expect(point).toHaveProperty('totalReturn');
      }
    });

    it('should calculate returns relative to first data point', async () => {
      const data = await getChartData('SPY', '1W');

      if (data.length > 0) {
        // First point should have 0% return (baseline)
        expect(data[0].priceReturn).toBe(0);
        expect(data[0].totalReturn).toBe(0);

        // Last point should have positive return (prices are increasing)
        expect(data[data.length - 1].priceReturn).toBeGreaterThan(0);
        expect(data[data.length - 1].totalReturn).toBeGreaterThan(0);
      }
    });

    it('should convert dates to timestamps correctly', async () => {
      const data = await getChartData('SPY', '1W');

      if (data.length > 0) {
        const point = data[0];
        const expectedTimestamp = new Date(point.date).getTime() / 1000;
        expect(point.timestamp).toBe(expectedTimestamp);
      }
    });

    it('should handle null values gracefully', async () => {
      // Add data with null values
      mockSupabaseData.prices_daily.push({
        ticker: 'SPY',
        date: new Date().toISOString().split('T')[0],
        open: null,
        high: null,
        low: null,
        close: null,
        adj_close: null,
        volume: null,
        div_cash: null,
        split_factor: 1,
      });

      const data = await getChartData('SPY', '1W');

      expect(Array.isArray(data)).toBe(true);
      // Should handle null values without crashing
      data.forEach(point => {
        expect(typeof point.open).toBe('number');
        expect(typeof point.high).toBe('number');
        expect(typeof point.low).toBe('number');
        expect(typeof point.close).toBe('number');
        expect(typeof point.adjClose).toBe('number');
        expect(typeof point.volume).toBe('number');
        expect(typeof point.divCash).toBe('number');
      });
    });
  });

  describe('Period Handling', () => {
    beforeEach(() => {
      // Setup extended price data for different periods
      const today = new Date();
      const prices = [];

      // Generate data for the past 5 years
      for (let i = 1825; i >= 0; i -= 30) { // Every 30 days for 5 years
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const basePrice = 100;
        const priceIncrement = (1825 - i) * 0.05; // Gradual increase
        
        prices.push({
          ticker: 'SPY',
          date: date.toISOString().split('T')[0],
          open: basePrice + priceIncrement,
          high: basePrice + priceIncrement + 2,
          low: basePrice + priceIncrement - 2,
          close: basePrice + priceIncrement + 1,
          adj_close: basePrice + priceIncrement + 1,
          volume: 50000000 + Math.random() * 10000000,
          div_cash: i % 90 === 0 ? 1.5 : 0, // Quarterly dividends
          split_factor: 1,
        });
      }

      mockSupabaseData.prices_daily = prices;
    });

    it('should handle all supported periods', async () => {
      const periods: ChartPeriod[] = ['1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'];

      for (const period of periods) {
        const data = await getChartData('SPY', period);
        expect(Array.isArray(data)).toBe(true);
        
        if (data.length > 0) {
          // Should have at least some data for each period
          expect(data.length).toBeGreaterThan(0);
        }
      }
    });

    it('should return appropriate data volume for different periods', async () => {
      const data1W = await getChartData('SPY', '1W');
      const data1M = await getChartData('SPY', '1M');
      const data1Y = await getChartData('SPY', '1Y');
      const data5Y = await getChartData('SPY', '5Y');

      // Longer periods should generally have more data points
      expect(data5Y.length).toBeGreaterThanOrEqual(data1Y.length);
      expect(data1Y.length).toBeGreaterThanOrEqual(data1M.length);
      expect(data1M.length).toBeGreaterThanOrEqual(data1W.length);
    });

    it('should filter data by period correctly', async () => {
      const today = new Date();
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const data1W = await getChartData('SPY', '1W');
      const data1M = await getChartData('SPY', '1M');

      if (data1W.length > 0 && data1M.length > 0) {
        const firstDate1W = new Date(data1W[0].date);
        const firstDate1M = new Date(data1M[0].date);

        // 1W data should start more recent than 1M data
        expect(firstDate1W.getTime()).toBeGreaterThan(firstDate1M.getTime());
        expect(firstDate1W.getTime()).toBeGreaterThan(oneWeekAgo.getTime());
        expect(firstDate1M.getTime()).toBeGreaterThan(oneMonthAgo.getTime());
      }
    });
  });

  describe('Return Calculations in Chart Data', () => {
    beforeEach(() => {
      // Setup predictable price data for return calculations
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: 100,
          high: 105,
          low: 95,
          close: 100,
          adj_close: 100,
          volume: 50000000,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: 100,
          high: 105,
          low: 95,
          close: 110,
          adj_close: 110,
          volume: 50000000,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: 110,
          high: 115,
          low: 105,
          close: 120,
          adj_close: 120,
          volume: 50000000,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: 120,
          high: 125,
          low: 115,
          close: 130,
          adj_close: 130,
          volume: 50000000,
          div_cash: 0,
          split_factor: 1,
        },
      ];
    });

    it('should calculate price returns correctly', async () => {
      const data = await getChartData('SPY', '1W');

      if (data.length >= 4) {
        // First point: 0% return (baseline)
        expect(data[0].priceReturn).toBe(0);

        // Second point: (110/100) - 1 = 10%
        expect(data[1].priceReturn).toBeCloseTo(10, 1);

        // Third point: (120/100) - 1 = 20%
        expect(data[2].priceReturn).toBeCloseTo(20, 1);

        // Fourth point: (130/100) - 1 = 30%
        expect(data[3].priceReturn).toBeCloseTo(30, 1);
      }
    });

    it('should calculate total returns correctly', async () => {
      const data = await getChartData('SPY', '1W');

      if (data.length >= 4) {
        // Should match price returns when no dividends
        expect(data[0].totalReturn).toBe(data[0].priceReturn);
        expect(data[1].totalReturn).toBe(data[1].priceReturn);
        expect(data[2].totalReturn).toBe(data[2].priceReturn);
        expect(data[3].totalReturn).toBe(data[3].priceReturn);
      }
    });

    it('should handle dividends in total return calculation', async () => {
      // Add dividend data
      mockSupabaseData.prices_daily[1] = {
        ...mockSupabaseData.prices_daily[1],
        div_cash: 2,
        adj_close: 108, // Adjusted for dividend
      };

      const data = await getChartData('SPY', '1W');

      if (data.length >= 2) {
        // Total return should account for dividends (using adjusted close)
        // Price return: (110/100) - 1 = 10%
        // Total return: (108/100) - 1 = 8%
        expect(data[1].priceReturn).toBeCloseTo(10, 1);
        expect(data[1].totalReturn).toBeCloseTo(8, 1);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return empty array for unknown ticker', async () => {
      const data = await getChartData('UNKNOWN', '1Y');

      expect(data).toEqual([]);
    });

    it('should return empty array for empty price data', async () => {
      mockSupabaseData.prices_daily = [];
      const data = await getChartData('SPY', '1Y');

      expect(data).toEqual([]);
    });

    it('should handle single data point', async () => {
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'SPY',
          date: today.toISOString().split('T')[0],
          open: 100,
          high: 105,
          low: 95,
          close: 100,
          adj_close: 100,
          volume: 50000000,
          div_cash: 0,
          split_factor: 1,
        },
      ];

      const data = await getChartData('SPY', '1W');

      expect(data.length).toBe(1);
      expect(data[0].priceReturn).toBe(0);
      expect(data[0].totalReturn).toBe(0);
    });

    it('should handle zero prices', async () => {
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'SPY',
          date: today.toISOString().split('T')[0],
          open: 0,
          high: 0,
          low: 0,
          close: 0,
          adj_close: 0,
          volume: 0,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: 0,
          high: 0,
          low: 0,
          close: 0,
          adj_close: 0,
          volume: 0,
          div_cash: 0,
          split_factor: 1,
        },
      ];

      const data = await getChartData('SPY', '1W');

      expect(Array.isArray(data)).toBe(true);
      // Should handle zero prices without crashing
      data.forEach(point => {
        expect(typeof point.priceReturn).toBe('number');
        expect(typeof point.totalReturn).toBe('number');
      });
    });

    it('should handle negative prices', async () => {
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'SPY',
          date: today.toISOString().split('T')[0],
          open: -100,
          high: -95,
          low: -105,
          close: -100,
          adj_close: -100,
          volume: 50000000,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: -90,
          high: -85,
          low: -95,
          close: -90,
          adj_close: -90,
          volume: 50000000,
          div_cash: 0,
          split_factor: 1,
        },
      ];

      const data = await getChartData('SPY', '1W');

      expect(Array.isArray(data)).toBe(true);
      // Should handle negative prices without crashing
      data.forEach(point => {
        expect(typeof point.priceReturn).toBe('number');
        expect(typeof point.totalReturn).toBe('number');
      });
    });

    it('should handle stock splits correctly', async () => {
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: 400,
          high: 410,
          low: 390,
          close: 400,
          adj_close: 100, // 4:1 split adjusted
          volume: 50000000,
          div_cash: 0,
          split_factor: 4,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: 102,
          high: 108,
          low: 100,
          close: 106,
          adj_close: 106,
          volume: 50000000,
          div_cash: 0,
          split_factor: 1,
        },
      ];

      const data = await getChartData('SPY', '1W');

      expect(Array.isArray(data)).toBe(true);
      if (data.length >= 2) {
        // Total return should use adjusted prices (handling split correctly)
        // Price return should show split effect
        expect(data[1].totalReturn).toBeGreaterThan(data[1].priceReturn);
      }
    });
  });

  describe('Data Validation', () => {
    beforeEach(() => {
      // Setup comprehensive test data
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          adj_close: 102,
          volume: 50000000,
          div_cash: 1,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: 102,
          high: 108,
          low: 100,
          close: 106,
          adj_close: 105, // adjusted for dividend
          volume: 52000000,
          div_cash: 0,
          split_factor: 1,
        },
      ];
    });

    it('should validate data types and ranges', async () => {
      const data = await getChartData('SPY', '1W');

      data.forEach(point => {
        expect(typeof point.date).toBe('string');
        expect(typeof point.timestamp).toBe('number');
        expect(typeof point.open).toBe('number');
        expect(typeof point.high).toBe('number');
        expect(typeof point.low).toBe('number');
        expect(typeof point.close).toBe('number');
        expect(typeof point.adjClose).toBe('number');
        expect(typeof point.volume).toBe('number');
        expect(typeof point.divCash).toBe('number');
        expect(typeof point.priceReturn).toBe('number');
        expect(typeof point.totalReturn).toBe('number');

        // Validate logical relationships
        expect(point.high).toBeGreaterThanOrEqual(point.open);
        expect(point.high).toBeGreaterThanOrEqual(point.close);
        expect(point.low).toBeLessThanOrEqual(point.open);
        expect(point.low).toBeLessThanOrEqual(point.close);
        expect(point.volume).toBeGreaterThanOrEqual(0);
      });
    });

    it('should maintain chronological order', async () => {
      const data = await getChartData('SPY', '1W');

      if (data.length > 1) {
        for (let i = 1; i < data.length; i++) {
          const prevDate = new Date(data[i - 1].date);
          const currDate = new Date(data[i].date);
          expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
          expect(data[i].timestamp).toBeGreaterThan(data[i - 1].timestamp);
        }
      }
    });

    it('should handle different date formats correctly', async () => {
      // Test with various date formats
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'SPY',
          date: '2024-01-15', // ISO format
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          adj_close: 102,
          volume: 50000000,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'SPY',
          date: '01/16/2024', // US format (should still work)
          open: 102,
          high: 108,
          low: 100,
          close: 106,
          adj_close: 106,
          volume: 52000000,
          div_cash: 0,
          split_factor: 1,
        },
      ];

      const data = await getChartData('SPY', '1W');

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });
});
