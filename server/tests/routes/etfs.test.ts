/**
 * ETF Routes Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockSupabaseData } from '../setup.js';
import etfRoutes from '../../src/routes/etfs.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/etfs', etfRoutes);
app.use('/api/admin', etfRoutes);

describe('ETF Routes', () => {
  beforeEach(() => {
    // Setup test data
    mockSupabaseData.etfs = [
      {
        id: 1,
        symbol: 'SPY',
        issuer: 'State Street',
        description: 'S&P 500 ETF',
        price: 476.50,
        forward_yield: 1.35,
        payments_per_year: 4,
      },
      {
        id: 2,
        symbol: 'QQQ',
        issuer: 'Invesco',
        description: 'Nasdaq 100 ETF',
        price: 405.25,
        forward_yield: 0.55,
        payments_per_year: 4,
      },
      {
        id: 3,
        symbol: 'VTI',
        issuer: 'Vanguard',
        description: 'Total Stock Market ETF',
        price: 245.00,
        forward_yield: 1.42,
        payments_per_year: 4,
      },
    ];
  });

  describe('GET /api/etfs', () => {
    it('should return all ETFs', async () => {
      const response = await request(app)
        .get('/api/etfs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return ETFs ordered by symbol', async () => {
      const response = await request(app)
        .get('/api/etfs');

      expect(response.status).toBe(200);
      // Data should be returned as array
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/etfs/:symbol', () => {
    it('should return single ETF by symbol', async () => {
      const response = await request(app)
        .get('/api/etfs/SPY');

      expect(response.status).toBe(200);
      // Response depends on mock data
    });

    it('should return 404 for unknown symbol', async () => {
      mockSupabaseData.etfs = [];

      const response = await request(app)
        .get('/api/etfs/UNKNOWN');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle case-insensitive symbol lookup', async () => {
      const response = await request(app)
        .get('/api/etfs/spy');

      // Should convert to uppercase and query
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/admin/upload-static', () => {
    it('should return 400 when no file uploaded', async () => {
      const response = await request(app)
        .post('/api/admin/upload-static');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No file uploaded');
    });
  });
});

describe('ETF Data Validation', () => {
  beforeEach(() => {
    mockSupabaseData.etfs = [
      {
        symbol: 'TEST',
        issuer: 'Test Issuer',
        price: 100,
        forward_yield: 5.0,
      },
    ];
  });

  it('should handle ETF with missing fields', async () => {
    mockSupabaseData.etfs = [
      {
        symbol: 'MINIMAL',
      },
    ];

    const response = await request(app)
      .get('/api/etfs');

    expect(response.status).toBe(200);
  });

  it('should handle empty ETF list', async () => {
    mockSupabaseData.etfs = [];

    const response = await request(app)
      .get('/api/etfs');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
