/**
 * Integration Tests
 * 
 * Tests the full application stack
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { mockSupabaseData } from './setup.js';
import tiingoRoutes from '../src/routes/tiingo.js';
import etfRoutes from '../src/routes/etfs.js';
import userRoutes from '../src/routes/user.js';

// Create a full test app mimicking the real server
const createTestApp = () => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'test',
    });
  });
  
  // Routes
  app.use('/api/tiingo', tiingoRoutes);
  app.use('/api/etfs', etfRoutes);
  app.use('/api/admin', etfRoutes);
  app.use('/api/user', userRoutes);
  
  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });
  
  return app;
};

const app = createTestApp();

describe('Integration Tests', () => {
  beforeEach(() => {
    // Reset all mock data
    mockSupabaseData.etfs = [];
    mockSupabaseData.etf_static = [];
    mockSupabaseData.prices_daily = [];
    mockSupabaseData.dividends_detail = [];
    mockSupabaseData.profiles = [];
    mockSupabaseData.data_sync_log = [];
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment', 'test');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Full ETF Workflow', () => {
    beforeEach(() => {
      const today = new Date();
      
      // Setup complete test data
      mockSupabaseData.etfs = [
        { symbol: 'SPY', issuer: 'State Street', price: 475 },
        { symbol: 'QQQ', issuer: 'Invesco', price: 400 },
      ];
      
      mockSupabaseData.etf_static = [
        { ticker: 'SPY', payments_per_year: 4, description: 'S&P 500 ETF' },
        { ticker: 'QQQ', payments_per_year: 4, description: 'Nasdaq 100 ETF' },
      ];
      
      mockSupabaseData.prices_daily = [
        { ticker: 'SPY', date: formatDate(today, -1), close: 472, adj_close: 472 },
        { ticker: 'SPY', date: formatDate(today, 0), close: 475, adj_close: 475 },
        { ticker: 'QQQ', date: formatDate(today, -1), close: 398, adj_close: 398 },
        { ticker: 'QQQ', date: formatDate(today, 0), close: 400, adj_close: 400 },
      ];
      
      mockSupabaseData.dividends_detail = [
        { ticker: 'SPY', ex_date: formatDate(today, -30), div_cash: 1.75 },
        { ticker: 'QQQ', ex_date: formatDate(today, -30), div_cash: 0.55 },
      ];
    });

    it('should list all ETFs', async () => {
      const response = await request(app)
        .get('/api/etfs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get ETF metrics', async () => {
      const response = await request(app)
        .get('/api/tiingo/metrics/SPY');

      expect(response.status).toBe(200);
      expect(response.body.ticker).toBe('SPY');
    });

    it('should get price history', async () => {
      const response = await request(app)
        .get('/api/tiingo/prices/SPY')
        .query({ period: '1M' });

      expect(response.status).toBe(200);
      expect(response.body.ticker).toBe('SPY');
    });

    it('should get dividend history', async () => {
      const response = await request(app)
        .get('/api/tiingo/dividends/SPY');

      expect(response.status).toBe(200);
      expect(response.body.ticker).toBe('SPY');
    });

    it('should compare multiple ETFs', async () => {
      const response = await request(app)
        .post('/api/tiingo/compare')
        .send({ tickers: ['SPY', 'QQQ'], period: '1M' });

      expect(response.status).toBe(200);
      expect(response.body.tickers).toContain('SPY');
    });

    it('should calculate rankings', async () => {
      const response = await request(app)
        .post('/api/tiingo/rankings')
        .send({
          weights: { yield: 40, totalReturn: 40, volatility: 20 },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rankings');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/tiingo/rankings')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });
});

// Helper
function formatDate(date: Date, daysOffset: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}
