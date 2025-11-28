/**
 * Metrics Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseData } from '../setup.js';

// Import after mocks are set up
import { calculateMetrics, getChartData, calculateRankings } from '../../src/services/metrics.js';

describe('Metrics Service', () => {
  beforeEach(() => {
    // Setup test data
    mockSupabaseData.etf_static = [
      {
        ticker: 'SPY',
        issuer: 'State Street',
        description: 'S&P 500 ETF',
        pay_day_text: 'Monthly',
        payments_per_year: 4,
        ipo_price: 50,
      },
      {
        ticker: 'QQQ',
        issuer: 'Invesco',
        description: 'Nasdaq 100 ETF',
        pay_day_text: 'Quarterly',
        payments_per_year: 4,
        ipo_price: 40,
      },
    ];

    // Add price data
    const today = new Date();
    mockSupabaseData.prices_daily = [
      {
        ticker: 'SPY',
        date: formatTestDate(today, -2),
        open: 470,
        high: 475,
        low: 468,
        close: 472,
        adj_close: 472,
        volume: 50000000,
      },
      {
        ticker: 'SPY',
        date: formatTestDate(today, -1),
        open: 472,
        high: 478,
        low: 471,
        close: 476,
        adj_close: 476,
        volume: 45000000,
      },
      {
        ticker: 'SPY',
        date: formatTestDate(today, 0),
        open: 476,
        high: 480,
        low: 474,
        close: 478,
        adj_close: 478,
        volume: 48000000,
      },
      {
        ticker: 'QQQ',
        date: formatTestDate(today, -1),
        open: 400,
        high: 405,
        low: 398,
        close: 402,
        adj_close: 402,
        volume: 30000000,
      },
      {
        ticker: 'QQQ',
        date: formatTestDate(today, 0),
        open: 402,
        high: 408,
        low: 400,
        close: 405,
        adj_close: 405,
        volume: 32000000,
      },
    ];

    // Add dividend data
    mockSupabaseData.dividends_detail = [
      {
        ticker: 'SPY',
        ex_date: formatTestDate(today, -30),
        pay_date: formatTestDate(today, -25),
        div_cash: 1.75,
      },
      {
        ticker: 'SPY',
        ex_date: formatTestDate(today, -120),
        pay_date: formatTestDate(today, -115),
        div_cash: 1.70,
      },
      {
        ticker: 'SPY',
        ex_date: formatTestDate(today, -210),
        pay_date: formatTestDate(today, -205),
        div_cash: 1.65,
      },
      {
        ticker: 'SPY',
        ex_date: formatTestDate(today, -300),
        pay_date: formatTestDate(today, -295),
        div_cash: 1.60,
      },
    ];
  });

  describe('calculateMetrics', () => {
    it('should calculate metrics for valid ticker', async () => {
      const metrics = await calculateMetrics('SPY');

      expect(metrics.ticker).toBe('SPY');
      expect(metrics.calculatedAt).toBeDefined();
      expect(metrics.paymentsPerYear).toBe(4);
    });

    it('should include return data structure', async () => {
      const metrics = await calculateMetrics('SPY');

      expect(metrics.returns).toHaveProperty('1W');
      expect(metrics.returns).toHaveProperty('1M');
      expect(metrics.returns).toHaveProperty('3M');
      expect(metrics.returns).toHaveProperty('6M');
      expect(metrics.returns).toHaveProperty('1Y');
      expect(metrics.returns).toHaveProperty('3Y');

      // Each return should have price and total
      expect(metrics.returns['1W']).toHaveProperty('price');
      expect(metrics.returns['1W']).toHaveProperty('total');
    });

    it('should handle unknown ticker', async () => {
      const metrics = await calculateMetrics('UNKNOWN');

      expect(metrics.ticker).toBe('UNKNOWN');
      expect(metrics.currentPrice).toBeNull();
    });

    it('should default to 12 payments per year if not specified', async () => {
      mockSupabaseData.etf_static = [];
      const metrics = await calculateMetrics('XYZ');

      expect(metrics.paymentsPerYear).toBe(12);
    });
  });

  describe('getChartData', () => {
    it('should return chart data for valid ticker and period', async () => {
      const data = await getChartData('SPY', '1Y');

      expect(Array.isArray(data)).toBe(true);
    });

    it('should include calculated returns in chart data', async () => {
      const data = await getChartData('SPY', '1M');

      if (data.length > 0) {
        const point = data[0];
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('timestamp');
        expect(point).toHaveProperty('close');
        expect(point).toHaveProperty('adjClose');
        expect(point).toHaveProperty('priceReturn');
        expect(point).toHaveProperty('totalReturn');
      }
    });

    it('should return empty array for unknown ticker', async () => {
      const data = await getChartData('UNKNOWN', '1Y');

      expect(data).toEqual([]);
    });

    it('should handle different periods', async () => {
      const periods = ['1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'] as const;

      for (const period of periods) {
        const data = await getChartData('SPY', period);
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  describe('calculateRankings', () => {
    it('should calculate rankings with default weights', async () => {
      const rankings = await calculateRankings();

      expect(Array.isArray(rankings)).toBe(true);
    });

    it('should calculate rankings with custom weights', async () => {
      const weights = {
        yield: 50,
        totalReturn: 30,
        volatility: 20,
      };

      const rankings = await calculateRankings(weights);

      expect(Array.isArray(rankings)).toBe(true);
    });

    it('should include normalized scores', async () => {
      const rankings = await calculateRankings();

      if (rankings.length > 0) {
        const first = rankings[0];
        expect(first).toHaveProperty('ticker');
        expect(first).toHaveProperty('normalizedScores');
        expect(first).toHaveProperty('compositeScore');
        expect(first).toHaveProperty('rank');
        expect(first.rank).toBe(1);
      }
    });

    it('should rank ETFs in descending order by score', async () => {
      const rankings = await calculateRankings();

      for (let i = 1; i < rankings.length; i++) {
        expect(rankings[i].compositeScore).toBeLessThanOrEqual(rankings[i - 1].compositeScore);
        expect(rankings[i].rank).toBe(i + 1);
      }
    });

    it('should handle empty ETF list', async () => {
      mockSupabaseData.etf_static = [];
      const rankings = await calculateRankings();

      expect(Array.isArray(rankings)).toBe(true);
    });
  });
});

// Helper function to format test dates
function formatTestDate(baseDate: Date, daysOffset: number): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}
