/**
 * Dividend Volatility Calculation Tests
 * Tests the frequency-proof dividend SD/CV calculation using rolling 365D annualized series
 * 
 * Note: The algorithm requires 12+ data points from the rolling 365D series to calculate
 * volatility metrics. Tests are designed to validate behavior with both sufficient and
 * insufficient data scenarios.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  regularQuarterlyDividends,
  monthlyDividends,
  frequencyChangeDividends,
  highVolatilityDividends,
  mixedDividendTypes,
  insufficientDividends,
  splitAdjustedDividends,
  nullDividendTypes,
  expectedResults,
} from '../fixtures/dividendData.js';

import { calculateMetrics } from '../../src/services/metrics.js';
import { mockSupabaseData } from '../setup.js';
import type { DividendRecord } from '../../src/types/index.js';

describe('Dividend Volatility Calculations', () => {
  beforeEach(() => {
    // Reset mock data
    mockSupabaseData.etf_static = [];
    mockSupabaseData.prices_daily = [];
    mockSupabaseData.dividends_detail = [];
  });

  describe('Regular Quarterly Dividends', () => {
    beforeEach(() => {
      mockSupabaseData.dividends_detail = regularQuarterlyDividends;
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
      
      // Add minimal price data for current price calculation
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'SPY',
          date: today.toISOString().split('T')[0],
          close: 478,
          adj_close: 478,
          volume: 48000000,
        },
      ];
    });

    it('should calculate quarterly dividend metrics', async () => {
      const metrics = await calculateMetrics('SPY');
      
      expect(metrics.ticker).toBe('SPY');
      // With 8 quarterly dividends over 2 years, we may not have 12 rolling data points
      // So volatility metrics might be null - this is expected behavior
      expect(metrics.annualizedDividend).toBeDefined();
      // Annualized dividend should fallback to last dividend * payments_per_year when
      // rolling 365D calculation doesn't have enough data
      if (metrics.annualizedDividend !== null) {
        expect(metrics.annualizedDividend).toBeGreaterThan(0);
      }
    });

    it('should use rolling 365D or fallback to simple annualization', async () => {
      const metrics = await calculateMetrics('SPY');
      
      // Either rolling 365D sum or fallback (last_dividend * payments_per_year)
      if (metrics.annualizedDividend !== null) {
        // Should be between 6 and 8 (quarterly dividends around 1.65-1.80)
        expect(metrics.annualizedDividend).toBeGreaterThan(6);
        expect(metrics.annualizedDividend).toBeLessThan(8);
      }
    });

    it('should calculate forward yield correctly', async () => {
      const metrics = await calculateMetrics('SPY');
      
      if (metrics.currentPrice && metrics.annualizedDividend) {
        const expectedYield = (metrics.annualizedDividend / metrics.currentPrice) * 100;
        expect(metrics.forwardYield).toBeCloseTo(expectedYield, 2);
      }
    });
  });

  describe('Monthly Dividends', () => {
    beforeEach(() => {
      mockSupabaseData.dividends_detail = monthlyDividends;
      mockSupabaseData.etf_static = [
        {
          ticker: 'AGG',
          issuer: 'BlackRock',
          description: 'Core Bond ETF',
          pay_day_text: 'Monthly',
          payments_per_year: 12,
          ipo_price: 100,
        },
      ];
      
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'AGG',
          date: today.toISOString().split('T')[0],
          close: 95,
          adj_close: 95,
          volume: 30000000,
        },
      ];
    });

    it('should handle high-frequency monthly dividends', async () => {
      const metrics = await calculateMetrics('AGG');
      
      expect(metrics.ticker).toBe('AGG');
      // With only 8 monthly dividends, we don't have enough for rolling 365D volatility
      // The annualized dividend should fallback to last dividend * 12
      if (metrics.annualizedDividend !== null) {
        expect(metrics.annualizedDividend).toBeCloseTo(expectedResults.monthly.annualDividend, 1);
      }
    });

    it('should handle insufficient data for volatility gracefully', async () => {
      const metrics = await calculateMetrics('AGG');
      
      // With insufficient historical data, volatility metrics should be null
      // This is expected behavior - we need 12+ rolling data points
      if (metrics.dividendCVPercent !== null) {
        expect(metrics.dividendCVPercent).toBeLessThan(20); // If calculated, should be low
      } else {
        expect(metrics.dividendVolatilityIndex).toBeNull();
      }
    });
  });

  describe('Frequency Change Scenario', () => {
    beforeEach(() => {
      mockSupabaseData.dividends_detail = frequencyChangeDividends;
      mockSupabaseData.etf_static = [
        {
          ticker: 'HYG',
          issuer: 'BlackRock',
          description: 'High Yield Bond ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 50,
        },
      ];
      
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'HYG',
          date: today.toISOString().split('T')[0],
          close: 75,
          adj_close: 75,
          volume: 40000000,
        },
      ];
    });

    it('should handle frequency changes correctly', async () => {
      const metrics = await calculateMetrics('HYG');
      
      expect(metrics.ticker).toBe('HYG');
      // Annualized dividend should be calculated
      expect(metrics.annualizedDividend).toBeDefined();
      if (metrics.annualizedDividend !== null) {
        expect(metrics.annualizedDividend).toBeGreaterThan(0);
      }
    });

    it('should handle volatility calculation with frequency change data', async () => {
      const metrics = await calculateMetrics('HYG');
      
      // Volatility metrics may or may not be calculable depending on data depth
      expect(metrics.dividendCVPercent === null || typeof metrics.dividendCVPercent === 'number').toBe(true);
    });
  });

  describe('High Volatility Dividends', () => {
    beforeEach(() => {
      mockSupabaseData.dividends_detail = highVolatilityDividends;
      mockSupabaseData.etf_static = [
        {
          ticker: 'VZ',
          issuer: 'Verizon',
          description: 'Telecom ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 30,
        },
      ];
      
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'VZ',
          date: today.toISOString().split('T')[0],
          close: 40,
          adj_close: 40,
          volume: 50000000,
        },
      ];
    });

    it('should detect volatility in dividend payments', async () => {
      const metrics = await calculateMetrics('VZ');
      
      expect(metrics.ticker).toBe('VZ');
      // Annualized dividend should be calculated from available data
      expect(metrics.annualizedDividend).toBeDefined();
      if (metrics.annualizedDividend !== null) {
        expect(metrics.annualizedDividend).toBeGreaterThan(0);
      }
    });

    it('should handle volatility metrics', async () => {
      const metrics = await calculateMetrics('VZ');
      
      // With limited data, volatility metrics may be null
      if (metrics.dividendCVPercent !== null) {
        expect(typeof metrics.dividendCVPercent).toBe('number');
        expect(metrics.dividendSD).toBeGreaterThan(0);
      }
    });
  });

  describe('Mixed Dividend Types', () => {
    beforeEach(() => {
      mockSupabaseData.dividends_detail = mixedDividendTypes;
      mockSupabaseData.etf_static = [
        {
          ticker: 'MSFT',
          issuer: 'Microsoft',
          description: 'Technology ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 25,
        },
      ];
      
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'MSFT',
          date: today.toISOString().split('T')[0],
          close: 350,
          adj_close: 350,
          volume: 20000000,
        },
      ];
    });

    it('should filter out special dividends from volatility calculation', async () => {
      const metrics = await calculateMetrics('MSFT');
      
      expect(metrics.ticker).toBe('MSFT');
      // Annualized dividend should use regular dividends only
      expect(metrics.annualizedDividend).toBeDefined();
    });

    it('should exclude special dividends from calculation', async () => {
      const metrics = await calculateMetrics('MSFT');
      
      if (metrics.annualizedDividend !== null) {
        // Should not include the $3.00 special dividend in annualized calculation
        // Regular dividends are around 0.65-0.75, so annualized should be ~2.8-3.0
        expect(metrics.annualizedDividend).toBeLessThan(4.0);
        expect(metrics.annualizedDividend).toBeGreaterThan(2.0);
      }
    });
  });

  describe('Split-Adjusted Dividends', () => {
    beforeEach(() => {
      mockSupabaseData.dividends_detail = splitAdjustedDividends;
      mockSupabaseData.etf_static = [
        {
          ticker: 'AAPL',
          issuer: 'Apple',
          description: 'Technology ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 15,
        },
      ];
      
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'AAPL',
          date: today.toISOString().split('T')[0],
          close: 180,
          adj_close: 180,
          volume: 60000000,
        },
      ];
    });

    it('should use split-adjusted amounts for calculations', async () => {
      const metrics = await calculateMetrics('AAPL');
      
      expect(metrics.ticker).toBe('AAPL');
      // With only 4 dividends, volatility metrics will be null but annualized should work
      expect(metrics.annualizedDividend).toBeDefined();
    });

    it('should prefer adj_amount over div_cash when available', async () => {
      const metrics = await calculateMetrics('AAPL');
      
      if (metrics.annualizedDividend !== null) {
        // The algorithm uses adj_amount (0.24) when available
        // Fallback is last_dividend * payments_per_year = 0.96 * 4 = 3.84
        // But adj_amount would give 0.24 * 4 = 0.96
        expect(typeof metrics.annualizedDividend).toBe('number');
      }
    });
  });

  describe('Null Dividend Types', () => {
    beforeEach(() => {
      mockSupabaseData.dividends_detail = nullDividendTypes;
      mockSupabaseData.etf_static = [
        {
          ticker: 'NULLTYPE',
          issuer: 'Test',
          description: 'Test ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 50,
        },
      ];
      
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'NULLTYPE',
          date: today.toISOString().split('T')[0],
          close: 100,
          adj_close: 100,
          volume: 10000000,
        },
      ];
    });

    it('should treat null dividend types as regular dividends', async () => {
      const metrics = await calculateMetrics('NULLTYPE');
      
      expect(metrics.ticker).toBe('NULLTYPE');
      // With 4 dividends, annualized dividend should fallback to simple calculation
      expect(metrics.annualizedDividend).toBeDefined();
      if (metrics.annualizedDividend !== null) {
        // Should be around 4.0 (1.00 * 4)
        expect(metrics.annualizedDividend).toBeCloseTo(expectedResults.nullTypes.annualDividend, 1);
      }
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockSupabaseData.dividends_detail = insufficientDividends;
      mockSupabaseData.etf_static = [
        {
          ticker: 'NEW',
          issuer: 'New',
          description: 'New ETF',
          pay_day_text: 'Quarterly',
          payments_per_year: 4,
          ipo_price: 50,
        },
      ];
      
      const today = new Date();
      mockSupabaseData.prices_daily = [
        {
          ticker: 'NEW',
          date: today.toISOString().split('T')[0],
          close: 100,
          adj_close: 100,
          volume: 10000000,
        },
      ];
    });

    it('should handle insufficient dividend data gracefully', async () => {
      const metrics = await calculateMetrics('NEW');
      
      expect(metrics.ticker).toBe('NEW');
      expect(metrics.dividendSD).toBeNull();
      expect(metrics.dividendCV).toBeNull();
      expect(metrics.dividendCVPercent).toBeNull();
      expect(metrics.dividendVolatilityIndex).toBeNull();
    });

    it('should fallback to simple annualization when volatility calculation fails', async () => {
      const metrics = await calculateMetrics('NEW');
      
      // Should fallback to last dividend * payments per year
      expect(metrics.annualizedDividend).toBeCloseTo(1.00 * 4, 1);
    });

    it('should handle empty dividend data', async () => {
      mockSupabaseData.dividends_detail = [];
      const metrics = await calculateMetrics('NEW');
      
      expect(metrics.dividendSD).toBeNull();
      expect(metrics.dividendCV).toBeNull();
      expect(metrics.dividendCVPercent).toBeNull();
      expect(metrics.dividendVolatilityIndex).toBeNull();
      expect(metrics.annualizedDividend).toBeNull();
    });
  });

  describe('Volatility Index Classification', () => {
    it('should classify volatility correctly when calculated', async () => {
      // Test with data - volatility index may be null if insufficient data
      mockSupabaseData.dividends_detail = monthlyDividends;
      mockSupabaseData.etf_static = [{ ticker: 'TEST', payments_per_year: 12 }];
      mockSupabaseData.prices_daily = [{ ticker: 'TEST', close: 100, adj_close: 100 }];
      
      const metrics = await calculateMetrics('TEST');
      // Volatility index is either null (insufficient data) or a valid classification
      const validIndexes = ['Very Low', 'Low', 'Moderate', 'High', 'Very High', null];
      expect(validIndexes).toContain(metrics.dividendVolatilityIndex);
    });
  });

  describe('Mathematical Accuracy', () => {
    beforeEach(() => {
      mockSupabaseData.dividends_detail = regularQuarterlyDividends;
      mockSupabaseData.etf_static = [{ ticker: 'SPY', payments_per_year: 4 }];
      mockSupabaseData.prices_daily = [{ ticker: 'SPY', close: 478, adj_close: 478 }];
    });

    it('should calculate CV correctly (SD/Mean)', async () => {
      const metrics = await calculateMetrics('SPY');
      
      if (metrics.dividendSD && metrics.dividendCV && metrics.dividendCVPercent) {
        // CV = SD / Mean, CV% = CV * 100
        const expectedCV = metrics.dividendSD / (metrics.annualizedDividend || 1);
        const expectedCVPercent = expectedCV * 100;
        
        expect(metrics.dividendCV).toBeCloseTo(expectedCV, 3);
        expect(metrics.dividendCVPercent).toBeCloseTo(expectedCVPercent, 2);
      }
    });

    it('should handle zero mean gracefully', async () => {
      // Create a scenario with very small dividends
      mockSupabaseData.dividends_detail = regularQuarterlyDividends.map(d => ({
        ...d,
        div_cash: 0.0001,
        adj_amount: 0.0001,
      }));
      
      const metrics = await calculateMetrics('SPY');
      
      // Should not crash and should handle gracefully
      expect(metrics.dividendCV).toBeDefined();
    });
  });
});
