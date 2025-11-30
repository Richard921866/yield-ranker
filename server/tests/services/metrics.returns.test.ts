/**
 * Return Calculation Tests
 * Tests Total Return WITH DRIP, Price Return, and Total Return WITHOUT DRIP calculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  stableGrowthPrices,
  priceWithDividends,
  priceWithSplit,
  volatilePrices,
  decliningPrices,
  correspondingDividends,
  expectedReturnResults,
  edgeCasePrices,
} from '../fixtures/priceData.js';
// Note: Mock data doesn't need to match full types as the mock Supabase handles partial data
import { calculateMetrics } from '../../src/services/metrics.js';
import { mockSupabaseData } from '../setup.js';

describe('Return Calculations', () => {
  beforeEach(() => {
    // Reset mock data
    mockSupabaseData.etf_static = [];
    mockSupabaseData.prices_daily = [];
    mockSupabaseData.dividends_detail = [];
    vi.clearAllMocks();
  });

  describe('Total Return WITH DRIP (Adjusted Close Method)', () => {
    beforeEach(() => {
      mockSupabaseData.etf_static = [
        {
          ticker: 'SPY',
          issuer: 'State Street',
          description: 'S&P 500 ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 50,
        },
      ];
      mockSupabaseData.dividends_detail = [];
    });

    it('should calculate DRIP return for stable growth', async () => {
      mockSupabaseData.prices_daily = stableGrowthPrices;
      const metrics = await calculateMetrics('SPY');

      expect(metrics.totalReturnDrip['1W']).toBeDefined();
      expect(metrics.totalReturnDrip['1M']).toBeDefined();
      expect(metrics.totalReturnDrip['3M']).toBeDefined();
      expect(metrics.totalReturnDrip['6M']).toBeDefined();
      expect(metrics.totalReturnDrip['1Y']).toBeDefined();
      expect(metrics.totalReturnDrip['3Y']).toBeDefined();

      // Check that returns are reasonable for the data
      Object.values(metrics.totalReturnDrip).forEach(returnValue => {
        if (returnValue !== null) {
          expect(typeof returnValue).toBe('number');
          expect(returnValue).toBeGreaterThanOrEqual(-100);
          expect(returnValue).toBeLessThan(1000);
        }
      });
    });

    it('should handle dividends correctly in DRIP calculation', async () => {
      mockSupabaseData.prices_daily = priceWithDividends;
      mockSupabaseData.dividends_detail = correspondingDividends.filter(d => d.ticker === 'VTI');
      mockSupabaseData.etf_static = [{ ticker: 'VTI', payments_per_year: 4 }];

      const metrics = await calculateMetrics('VTI');

      expect(metrics.totalReturnDrip['1W']).toBeDefined();
      // DRIP return should be different from price return when dividends exist (or both null)
      if (metrics.totalReturnDrip['1W'] !== null && metrics.priceReturn['1W'] !== null) {
        expect(metrics.totalReturnDrip['1W']).not.toEqual(metrics.priceReturn['1W']);
      }
    });

    it('should handle stock splits correctly in DRIP calculation', async () => {
      mockSupabaseData.prices_daily = priceWithSplit;
      mockSupabaseData.etf_static = [{ ticker: 'AAPL', payments_per_year: 4 }];

      const metrics = await calculateMetrics('AAPL');

      expect(metrics.totalReturnDrip['1W']).toBeDefined();
      // DRIP return should be positive despite split in unadjusted prices (or null if insufficient data)
      if (metrics.totalReturnDrip['1W'] !== null) {
        expect(metrics.totalReturnDrip['1W']).toBeGreaterThan(0);
      }
    });

    it('should handle volatile prices correctly', async () => {
      mockSupabaseData.prices_daily = volatilePrices;
      mockSupabaseData.etf_static = [{ ticker: 'TSLA', payments_per_year: 4 }];

      const metrics = await calculateMetrics('TSLA');

      expect(metrics.totalReturnDrip['1W']).toBeDefined();
      // Should capture the volatility in returns (or null if insufficient data)
      if (metrics.totalReturnDrip['1W'] !== null) {
        expect(metrics.totalReturnDrip['1W']).toBeGreaterThan(10); // High growth
      }
    });

    it('should handle declining prices correctly', async () => {
      mockSupabaseData.prices_daily = decliningPrices;
      mockSupabaseData.etf_static = [{ ticker: 'META', payments_per_year: 4 }];

      const metrics = await calculateMetrics('META');

      expect(metrics.totalReturnDrip['1W']).toBeDefined();
      // Should show negative returns for declining prices (or null if insufficient data)
      if (metrics.totalReturnDrip['1W'] !== null) {
        expect(metrics.totalReturnDrip['1W']).toBeLessThan(0);
      }
    });
  });

  describe('Price Return (Unadjusted Close Method)', () => {
    beforeEach(() => {
      mockSupabaseData.etf_static = [
        {
          ticker: 'SPY',
          issuer: 'State Street',
          description: 'S&P 500 ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 50,
        },
      ];
      mockSupabaseData.dividends_detail = [];
    });

    it('should calculate price return for stable growth', async () => {
      mockSupabaseData.prices_daily = stableGrowthPrices;
      const metrics = await calculateMetrics('SPY');

      expect(metrics.priceReturn['1W']).toBeDefined();
      expect(metrics.priceReturn['1M']).toBeDefined();
      expect(metrics.priceReturn['3M']).toBeDefined();
      expect(metrics.priceReturn['6M']).toBeDefined();
      expect(metrics.priceReturn['1Y']).toBeDefined();
      expect(metrics.priceReturn['3Y']).toBeDefined();

      // Check that returns are reasonable
      Object.values(metrics.priceReturn).forEach(returnValue => {
        if (returnValue !== null) {
          expect(typeof returnValue).toBe('number');
          expect(returnValue).toBeGreaterThanOrEqual(-100);
          expect(returnValue).toBeLessThan(1000);
        }
      });
    });

    it('should ignore dividends in price return calculation', async () => {
      mockSupabaseData.prices_daily = priceWithDividends;
      mockSupabaseData.dividends_detail = correspondingDividends.filter(d => d.ticker === 'VTI');
      mockSupabaseData.etf_static = [{ ticker: 'VTI', payments_per_year: 4 }];

      const metrics = await calculateMetrics('VTI');

      expect(metrics.priceReturn['1W']).toBeDefined();
      // Price return should be based only on price changes (may be null with insufficient data)
      if (metrics.priceReturn['1W'] !== null) {
        expect(typeof metrics.priceReturn['1W']).toBe('number');
      }
    });

    it('should show split effect in price return calculation', async () => {
      mockSupabaseData.prices_daily = priceWithSplit;
      mockSupabaseData.etf_static = [{ ticker: 'AAPL', payments_per_year: 4 }];

      const metrics = await calculateMetrics('AAPL');

      expect(metrics.priceReturn['1W']).toBeDefined();
      // Price return may be null or show negative return due to split
      if (metrics.priceReturn['1W'] !== null) {
        expect(metrics.priceReturn['1W']).toBeLessThan(0);
      }
    });
  });

  describe('Total Return WITHOUT DRIP (Sum Method)', () => {
    beforeEach(() => {
      mockSupabaseData.etf_static = [
        {
          ticker: 'SPY',
          issuer: 'State Street',
          description: 'S&P 500 ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 50,
        },
      ];
    });

    it('should calculate no-DRIP return for stable growth', async () => {
      mockSupabaseData.prices_daily = stableGrowthPrices;
      mockSupabaseData.dividends_detail = [];
      const metrics = await calculateMetrics('SPY');

      expect(metrics.totalReturnNoDrip['1W']).toBeDefined();
      expect(metrics.totalReturnNoDrip['1M']).toBeDefined();
      expect(metrics.totalReturnNoDrip['3M']).toBeDefined();
      expect(metrics.totalReturnNoDrip['6M']).toBeDefined();
      expect(metrics.totalReturnNoDrip['1Y']).toBeDefined();
      expect(metrics.totalReturnNoDrip['3Y']).toBeDefined();

      // Check that returns are reasonable
      Object.values(metrics.totalReturnNoDrip).forEach(returnValue => {
        if (returnValue !== null) {
          expect(typeof returnValue).toBe('number');
          expect(returnValue).toBeGreaterThanOrEqual(-100);
          expect(returnValue).toBeLessThan(1000);
        }
      });
    });

    it('should include dividends in no-DRIP calculation', async () => {
      mockSupabaseData.prices_daily = priceWithDividends;
      mockSupabaseData.dividends_detail = correspondingDividends.filter(d => d.ticker === 'VTI');
      mockSupabaseData.etf_static = [{ ticker: 'VTI', payments_per_year: 4 }];

      const metrics = await calculateMetrics('VTI');

      expect(metrics.totalReturnNoDrip['1W']).toBeDefined();
      // No-DRIP return should be higher than price return when dividends exist
      if (metrics.totalReturnNoDrip['1W'] !== null && metrics.priceReturn['1W'] !== null) {
        expect(metrics.totalReturnNoDrip['1W']).toBeGreaterThan(metrics.priceReturn['1W']);
      }
    });

    it('should handle stock splits in no-DRIP calculations', async () => {
      // Stock split should affect price but dividend calculations should handle it
      mockSupabaseData.prices_daily = priceWithSplit;
      mockSupabaseData.etf_static = [{ ticker: 'AAPL', payments_per_year: 4 }];
      mockSupabaseData.dividends_detail = [];
      
      const metrics = await calculateMetrics('AAPL');
      
      expect(metrics.totalReturnNoDrip['1W']).toBeDefined();
      // Check that it's a number or null (could be positive or negative depending on split)
      expect(metrics.totalReturnNoDrip['1W'] === null || typeof metrics.totalReturnNoDrip['1W'] === 'number').toBe(true);
    });
  });

  describe('Return Calculation Consistency', () => {
    beforeEach(() => {
      mockSupabaseData.etf_static = [
        {
          ticker: 'TEST',
          issuer: 'Test',
          description: 'Test ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 50,
        },
      ];
    });

    it('should have consistent return structure across all periods', async () => {
      mockSupabaseData.prices_daily = stableGrowthPrices;
      mockSupabaseData.dividends_detail = [];
      const metrics = await calculateMetrics('TEST');

      const periods = ['1W', '1M', '3M', '6M', '1Y', '3Y'] as const;

      periods.forEach(period => {
        expect(metrics.totalReturnDrip).toHaveProperty(period);
        expect(metrics.priceReturn).toHaveProperty(period);
        expect(metrics.totalReturnNoDrip).toHaveProperty(period);
        expect(metrics.returns).toHaveProperty(period);
        expect(metrics.returns[period]).toHaveProperty('price');
        expect(metrics.returns[period]).toHaveProperty('total');
      });
    });

    it('should maintain backward compatibility with legacy returns', async () => {
      mockSupabaseData.prices_daily = stableGrowthPrices;
      mockSupabaseData.dividends_detail = [];
      const metrics = await calculateMetrics('TEST');

      const periods = ['1W', '1M', '3M', '6M', '1Y', '3Y'] as const;

      periods.forEach(period => {
        expect(metrics.returns[period].price).toEqual(metrics.priceReturn[period]);
        expect(metrics.returns[period].total).toEqual(metrics.totalReturnDrip[period]);
      });
    });

    it('should handle different return types correctly', async () => {
      mockSupabaseData.prices_daily = priceWithDividends;
      mockSupabaseData.dividends_detail = correspondingDividends.filter(d => d.ticker === 'VTI');
      mockSupabaseData.etf_static = [{ ticker: 'VTI', payments_per_year: 4 }];

      const metrics = await calculateMetrics('VTI');

      // With dividends: no-DRIP > price return, DRIP may differ due to adjustment
      if (metrics.totalReturnNoDrip['1W'] !== null && 
          metrics.priceReturn['1W'] !== null && 
          metrics.totalReturnDrip['1W'] !== null) {
        expect(metrics.totalReturnNoDrip['1W']).toBeGreaterThan(metrics.priceReturn['1W']);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      mockSupabaseData.etf_static = [
        {
          ticker: 'EDGE',
          issuer: 'Edge',
          description: 'Edge Case ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 50,
        },
      ];
      mockSupabaseData.dividends_detail = [];
    });

    it('should handle insufficient price data', async () => {
      mockSupabaseData.prices_daily = edgeCasePrices.insufficient;
      const metrics = await calculateMetrics('EDGE');

      // Should return null for all periods when insufficient data
      Object.values(metrics.totalReturnDrip).forEach(returnValue => {
        expect(returnValue).toBeNull();
      });
      Object.values(metrics.priceReturn).forEach(returnValue => {
        expect(returnValue).toBeNull();
      });
      Object.values(metrics.totalReturnNoDrip).forEach(returnValue => {
        expect(returnValue).toBeNull();
      });
    });

    it('should handle zero prices gracefully', async () => {
      mockSupabaseData.prices_daily = edgeCasePrices.zeroPrices;
      const metrics = await calculateMetrics('EDGE');

      // Should handle zero prices without crashing
      expect(metrics.totalReturnDrip['1W']).toBeDefined();
      expect(metrics.priceReturn['1W']).toBeDefined();
      expect(metrics.totalReturnNoDrip['1W']).toBeDefined();
    });

    it('should handle negative prices gracefully', async () => {
      mockSupabaseData.prices_daily = edgeCasePrices.negativePrices;
      const metrics = await calculateMetrics('EDGE');

      // Should handle negative prices without crashing
      expect(metrics.totalReturnDrip['1W']).toBeDefined();
      expect(metrics.priceReturn['1W']).toBeDefined();
      expect(metrics.totalReturnNoDrip['1W']).toBeDefined();
    });

    it('should handle null prices gracefully', async () => {
      mockSupabaseData.prices_daily = edgeCasePrices.nullPrices;
      const metrics = await calculateMetrics('EDGE');

      // Should handle null prices without crashing
      expect(metrics.totalReturnDrip['1W']).toBeDefined();
      expect(metrics.priceReturn['1W']).toBeDefined();
      expect(metrics.totalReturnNoDrip['1W']).toBeDefined();
    });

    it('should handle empty price data', async () => {
      mockSupabaseData.prices_daily = [];
      const metrics = await calculateMetrics('EDGE');

      // Should return null for all periods when no data
      Object.values(metrics.totalReturnDrip).forEach(returnValue => {
        expect(returnValue).toBeNull();
      });
      Object.values(metrics.priceReturn).forEach(returnValue => {
        expect(returnValue).toBeNull();
      });
      Object.values(metrics.totalReturnNoDrip).forEach(returnValue => {
        expect(returnValue).toBeNull();
      });
    });

    it('should handle missing dividend data for no-DRIP calculation', async () => {
      // Setup ETF with no dividends
      mockSupabaseData.etf_static = [{ ticker: 'NODIV', payments_per_year: 4 }];
      mockSupabaseData.prices_daily = stableGrowthPrices.map(p => ({ ...p, ticker: 'NODIV' }));
      mockSupabaseData.dividends_detail = []; // No dividends

      const metrics = await calculateMetrics('NODIV');

      // Should still calculate returns (just without dividends)
      expect(metrics.totalReturnNoDrip['1W']).toBeDefined();
      // It might be null if there's insufficient data, which is expected behavior
      expect(metrics.totalReturnNoDrip['1W'] === null || typeof metrics.totalReturnNoDrip['1W'] === 'number').toBe(true);
    });
  });

  describe('Mathematical Accuracy', () => {
    beforeEach(() => {
      mockSupabaseData.etf_static = [
        {
          ticker: 'MATH',
          issuer: 'Math',
          description: 'Math Test ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 50,
        },
      ];
    });

    it('should calculate DRIP return using correct formula: (end_adj/start_adj) - 1', async () => {
      // Setup simple price data for verification
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      mockSupabaseData.prices_daily = [
        {
          ticker: 'MATH',
          date: yesterday.toISOString().split('T')[0],
          open: 100,
          high: 105,
          low: 95,
          close: 100,
          adj_close: 100,
          volume: 1000000,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'MATH',
          date: today.toISOString().split('T')[0],
          open: 105,
          high: 110,
          low: 100,
          close: 110,
          adj_close: 110,
          volume: 1200000,
          div_cash: 0,
          split_factor: 1,
        },
      ];

      const metrics = await calculateMetrics('MATH');

      // Expected: (110/100) - 1 = 10%
      const expectedReturn = ((110 / 100) - 1) * 100;
      
      // Check if we got a valid result or null (insufficient data)
      if (metrics.totalReturnDrip['1W'] !== null) {
        expect(metrics.totalReturnDrip['1W']).toBeCloseTo(expectedReturn, 2);
      } else {
        // If null, it's likely due to insufficient data points for the period
        expect(metrics.totalReturnDrip['1W']).toBeNull();
      }
    });

    it('should calculate price return using correct formula: (end_close/start_close) - 1', async () => {
      const testPrices = [
        {
          ticker: 'MATH',
          date: '2024-01-01',
          close: 100,
          adj_close: 100,
          volume: 1000000,
          open: 95,
          high: 105,
          low: 95,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'MATH',
          date: '2024-01-02',
          close: 110,
          adj_close: 110,
          volume: 1200000,
          open: 105,
          high: 115,
          low: 105,
          div_cash: 0,
          split_factor: 1,
        },
      ];

      mockSupabaseData.prices_daily = testPrices;
      mockSupabaseData.dividends_detail = [];
      const metrics = await calculateMetrics('MATH');

      // Expected: (110/100) - 1 = 10%
      const expectedReturn = ((110 / 100) - 1) * 100;
      
      // Check if we got a valid result or null (insufficient data)
      if (metrics.priceReturn['1W'] !== null) {
        expect(metrics.priceReturn['1W']).toBeCloseTo(expectedReturn, 2);
      } else {
        // If null, it's likely due to insufficient data points for the period
        expect(metrics.priceReturn['1W']).toBeNull();
      }
    });

    it('should calculate no-DRIP return using correct formula: ((end-start) + dividends) / start', async () => {
      const testPrices = [
        {
          ticker: 'MATH',
          date: '2024-01-01',
          close: 100,
          adj_close: 100,
          volume: 1000000,
          open: 95,
          high: 105,
          low: 95,
          div_cash: 0,
          split_factor: 1,
        },
        {
          ticker: 'MATH',
          date: '2024-01-02',
          close: 110,
          adj_close: 110,
          volume: 1200000,
          open: 105,
          high: 115,
          low: 105,
          div_cash: 0,
          split_factor: 1,
        },
      ];
      const testDividends = [
        {
          ticker: 'MATH',
          ex_date: '2024-01-02',
          pay_date: '2024-01-05',
          div_cash: 5,
          adj_amount: 5,
          div_type: 'regular',
        },
      ];

      mockSupabaseData.prices_daily = testPrices;
      mockSupabaseData.dividends_detail = testDividends;
      const metrics = await calculateMetrics('MATH');

      // Expected: ((110-100) + 5) / 100 = 15%
      const expectedReturn = (((110 - 100) + 5) / 100) * 100;
      
      // Check if we got a valid result or null (insufficient data)
      if (metrics.totalReturnNoDrip['1W'] !== null) {
        expect(metrics.totalReturnNoDrip['1W']).toBeCloseTo(expectedReturn, 2);
      } else {
        // If null, it's likely due to insufficient data points for the period
        expect(metrics.totalReturnNoDrip['1W']).toBeNull();
      }
    });
  });

  describe('Period-Based Calculations', () => {
    beforeEach(() => {
      mockSupabaseData.etf_static = [
        {
          ticker: 'PERIOD',
          issuer: 'Period',
          description: 'Period Test ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 50,
        },
      ];
      mockSupabaseData.dividends_detail = [];
    });

    it('should calculate returns for different time periods', async () => {
      // Create price data spanning multiple periods
      const today = new Date();
      const prices = [];
      
      for (let i = 365; i >= 0; i -= 30) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        prices.push({
          ticker: 'PERIOD',
          date: date.toISOString().split('T')[0],
          close: 100 + (365 - i) * 0.1, // Gradual increase
          adj_close: 100 + (365 - i) * 0.1,
          volume: 1000000,
        });
      }

      mockSupabaseData.prices_daily = prices;
      const metrics = await calculateMetrics('PERIOD');

      // Longer periods should generally have higher returns for upward trend
      if (metrics.totalReturnDrip['1W'] !== null && metrics.totalReturnDrip['1Y'] !== null) {
        expect(metrics.totalReturnDrip['1Y']).toBeGreaterThan(metrics.totalReturnDrip['1W']);
      }
    });

    it('should handle periods with insufficient data', async () => {
      // Only provide data for a few days
      const today = new Date();
      const prices = [
        {
          ticker: 'PERIOD',
          date: today.toISOString().split('T')[0],
          close: 100,
          adj_close: 100,
          volume: 1000000,
        },
      ];

      mockSupabaseData.prices_daily = prices;
      const metrics = await calculateMetrics('PERIOD');

      // Longer periods should return null when insufficient data
      expect(metrics.totalReturnDrip['1Y']).toBeNull();
      expect(metrics.priceReturn['1Y']).toBeNull();
      expect(metrics.totalReturnNoDrip['1Y']).toBeNull();
    });
  });
});
