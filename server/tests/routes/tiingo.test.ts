/**
 * Tiingo Routes Tests
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockSupabaseData } from '../setup.js';
import tiingoRoutes from '../../src/routes/tiingo.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/tiingo', tiingoRoutes);

describe('Tiingo Routes', () => {
  beforeEach(() => {
    // Setup test data
    const today = new Date();
    mockSupabaseData.prices_daily = [
      {
        ticker: 'SPY',
        date: formatDate(today, -1),
        open: 470,
        high: 475,
        low: 468,
        close: 472,
        adj_close: 472,
        volume: 50000000,
      },
      {
        ticker: 'SPY',
        date: formatDate(today, 0),
        open: 472,
        high: 478,
        low: 471,
        close: 476,
        adj_close: 476,
        volume: 45000000,
      },
    ];

    mockSupabaseData.dividends_detail = [
      {
        ticker: 'SPY',
        ex_date: formatDate(today, -30),
        pay_date: formatDate(today, -25),
        div_cash: 1.75,
        div_type: 'Cash',
        currency: 'USD',
      },
    ];

    mockSupabaseData.etf_static = [
      {
        ticker: 'SPY',
        issuer: 'State Street',
        description: 'S&P 500 ETF',
        payments_per_year: 4,
      },
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

  describe('GET /api/tiingo/prices/:ticker', () => {
    it('should return price data for valid ticker', async () => {
      const response = await request(app)
        .get('/api/tiingo/prices/SPY')
        .query({ period: '1M' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ticker', 'SPY');
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should accept different period parameters', async () => {
      const periods = ['1W', '1M', '3M', '6M', '1Y'];

      for (const period of periods) {
        const response = await request(app)
          .get('/api/tiingo/prices/SPY')
          .query({ period });

        expect(response.status).toBe(200);
        expect(response.body.period).toBe(period);
      }
    });

    it('should default to 1Y period', async () => {
      const response = await request(app)
        .get('/api/tiingo/prices/SPY');

      expect(response.status).toBe(200);
      expect(response.body.period).toBe('1Y');
    });
  });

  describe('GET /api/tiingo/latest/:ticker', () => {
    it('should return latest price for valid ticker', async () => {
      const response = await request(app)
        .get('/api/tiingo/latest/SPY');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ticker', 'SPY');
      expect(response.body).toHaveProperty('currentPrice');
      expect(response.body).toHaveProperty('priceChange');
      expect(response.body).toHaveProperty('priceChangePercent');
    });

    it('should return 404 for ticker with no data', async () => {
      mockSupabaseData.prices_daily = [];

      const response = await request(app)
        .get('/api/tiingo/latest/UNKNOWN');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tiingo/dividends/:ticker', () => {
    it('should return dividend data for valid ticker', async () => {
      const response = await request(app)
        .get('/api/tiingo/dividends/SPY');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ticker', 'SPY');
      expect(response.body).toHaveProperty('paymentsPerYear');
      expect(response.body).toHaveProperty('dividends');
      expect(Array.isArray(response.body.dividends)).toBe(true);
    });

    it('should accept years parameter', async () => {
      const response = await request(app)
        .get('/api/tiingo/dividends/SPY')
        .query({ years: 3 });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/tiingo/metrics/:ticker', () => {
    it('should return calculated metrics', async () => {
      const response = await request(app)
        .get('/api/tiingo/metrics/SPY');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ticker', 'SPY');
      expect(response.body).toHaveProperty('returns');
      expect(response.body).toHaveProperty('calculatedAt');
    });
  });

  describe('POST /api/tiingo/compare', () => {
    it('should return comparison data for multiple tickers', async () => {
      mockSupabaseData.prices_daily.push({
        ticker: 'QQQ',
        date: formatDate(new Date(), 0),
        close: 400,
        adj_close: 400,
      });

      const response = await request(app)
        .post('/api/tiingo/compare')
        .send({
          tickers: ['SPY', 'QQQ'],
          period: '1M',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tickers');
      expect(response.body).toHaveProperty('data');
    });

    it('should return 400 for missing tickers', async () => {
      const response = await request(app)
        .post('/api/tiingo/compare')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for empty tickers array', async () => {
      const response = await request(app)
        .post('/api/tiingo/compare')
        .send({ tickers: [] });

      expect(response.status).toBe(400);
    });

    it('should limit to 5 tickers', async () => {
      const tickers = ['SPY', 'QQQ', 'VTI', 'IWM', 'DIA', 'VOO', 'VGT'];

      const response = await request(app)
        .post('/api/tiingo/compare')
        .send({ tickers, period: '1M' });

      expect(response.status).toBe(200);
      // Should only process first 5
    });
  });

  describe('POST /api/tiingo/rankings', () => {
    it('should return rankings with default weights', async () => {
      const response = await request(app)
        .post('/api/tiingo/rankings')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('weights');
      expect(response.body).toHaveProperty('rankings');
      expect(response.body).toHaveProperty('calculatedAt');
    });

    it('should accept custom weights', async () => {
      const response = await request(app)
        .post('/api/tiingo/rankings')
        .send({
          weights: {
            yield: 50,
            totalReturn: 30,
            volatility: 20,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.weights.yield).toBe(50);
      expect(response.body.weights.totalReturn).toBe(30);
      expect(response.body.weights.volatility).toBe(20);
    });
  });

  describe('GET /api/tiingo/sync-status', () => {
    it('should return sync status', async () => {
      const response = await request(app)
        .get('/api/tiingo/sync-status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lastSync');
      expect(response.body).toHaveProperty('tickersTracked');
      expect(response.body).toHaveProperty('pricesSynced');
      expect(response.body).toHaveProperty('dividendsSynced');
    });
  });
});

// Helper function
function formatDate(date: Date, daysOffset: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}
