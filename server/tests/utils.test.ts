/**
 * Utility Functions Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  getDateDaysAgo,
  getDateMonthsAgo,
  getDateYearsAgo,
  getTodayDate,
  isWeekend,
  periodToStartDate,
  parseNumeric,
  calculateReturn,
  normalize,
  calculateMean,
  calculateStdDev,
  calculateCV,
  sleep,
  retry,
  logger,
} from '../src/utils/index.js';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should handle different timezones correctly', () => {
      const date = new Date('2024-12-31T23:59:59Z');
      const result = formatDate(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getDateDaysAgo', () => {
    it('should return date from specified days ago', () => {
      const result = getDateDaysAgo(7);
      const expected = new Date();
      expected.setDate(expected.getDate() - 7);
      expect(result).toBe(formatDate(expected));
    });

    it('should handle 0 days', () => {
      const result = getDateDaysAgo(0);
      expect(result).toBe(getTodayDate());
    });
  });

  describe('getDateMonthsAgo', () => {
    it('should return date from specified months ago', () => {
      const result = getDateMonthsAgo(3);
      const expected = new Date();
      expected.setMonth(expected.getMonth() - 3);
      expect(result).toBe(formatDate(expected));
    });
  });

  describe('getDateYearsAgo', () => {
    it('should return date from specified years ago', () => {
      const result = getDateYearsAgo(1);
      const expected = new Date();
      expected.setFullYear(expected.getFullYear() - 1);
      expect(result).toBe(formatDate(expected));
    });
  });

  describe('getTodayDate', () => {
    it('should return today date formatted', () => {
      const result = getTodayDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('isWeekend', () => {
    it('should return boolean', () => {
      const result = isWeekend();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('periodToStartDate', () => {
    it('should return correct date for 1W period', () => {
      const result = periodToStartDate('1W');
      expect(result).toBe(getDateDaysAgo(7));
    });

    it('should return correct date for 1M period', () => {
      const result = periodToStartDate('1M');
      expect(result).toBe(getDateMonthsAgo(1));
    });

    it('should return correct date for 1Y period', () => {
      const result = periodToStartDate('1Y');
      expect(result).toBe(getDateYearsAgo(1));
    });

    it('should return MAX date for MAX period', () => {
      const result = periodToStartDate('MAX');
      expect(result).toBe('2000-01-01');
    });

    it('should default to 1Y for unknown period', () => {
      const result = periodToStartDate('UNKNOWN');
      expect(result).toBe(getDateYearsAgo(1));
    });
  });
});

describe('Number Utilities', () => {
  describe('parseNumeric', () => {
    it('should parse number values', () => {
      expect(parseNumeric(42)).toBe(42);
      expect(parseNumeric(3.14)).toBe(3.14);
    });

    it('should parse string numbers', () => {
      expect(parseNumeric('42')).toBe(42);
      expect(parseNumeric('3.14')).toBe(3.14);
    });

    it('should parse string with currency symbols', () => {
      expect(parseNumeric('$100.50')).toBe(100.50);
      expect(parseNumeric('€50')).toBe(50);
    });

    it('should parse percentage strings', () => {
      expect(parseNumeric('15%')).toBe(15);
    });

    it('should return null for invalid values', () => {
      expect(parseNumeric(null)).toBeNull();
      expect(parseNumeric(undefined)).toBeNull();
      expect(parseNumeric('')).toBeNull();
      expect(parseNumeric('n/a')).toBeNull();
      expect(parseNumeric('N/A')).toBeNull();
      expect(parseNumeric('-')).toBeNull();
    });

    it('should handle negative numbers', () => {
      expect(parseNumeric('-42')).toBe(-42);
      expect(parseNumeric('-3.14')).toBe(-3.14);
    });
  });

  describe('calculateReturn', () => {
    it('should calculate positive return', () => {
      const result = calculateReturn(110, 100);
      expect(result).toBe(10);
    });

    it('should calculate negative return', () => {
      const result = calculateReturn(90, 100);
      expect(result).toBe(-10);
    });

    it('should return null for invalid inputs', () => {
      expect(calculateReturn(100, 0)).toBeNull();
      expect(calculateReturn(0, 100)).toBeNull();
      expect(calculateReturn(100, -10)).toBeNull();
    });
  });

  describe('normalize', () => {
    it('should normalize value between 0 and 1', () => {
      expect(normalize(50, 0, 100)).toBe(0.5);
      expect(normalize(0, 0, 100)).toBe(0);
      expect(normalize(100, 0, 100)).toBe(1);
    });

    it('should handle inverted normalization', () => {
      expect(normalize(0, 0, 100, true)).toBe(1);
      expect(normalize(100, 0, 100, true)).toBe(0);
    });

    it('should clamp values outside range', () => {
      expect(normalize(150, 0, 100)).toBe(1);
      expect(normalize(-50, 0, 100)).toBe(0);
    });

    it('should return 0.5 when min equals max', () => {
      expect(normalize(50, 50, 50)).toBe(0.5);
    });
  });
});

describe('Statistics Utilities', () => {
  describe('calculateMean', () => {
    it('should calculate mean of array', () => {
      expect(calculateMean([1, 2, 3, 4, 5])).toBe(3);
      expect(calculateMean([10, 20, 30])).toBe(20);
    });

    it('should return 0 for empty array', () => {
      expect(calculateMean([])).toBe(0);
    });
  });

  describe('calculateStdDev', () => {
    it('should calculate standard deviation', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      const result = calculateStdDev(values);
      expect(result).toBeCloseTo(2, 0);
    });

    it('should return 0 for single value', () => {
      expect(calculateStdDev([5])).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(calculateStdDev([])).toBe(0);
    });
  });

  describe('calculateCV', () => {
    it('should calculate coefficient of variation', () => {
      const values = [10, 12, 14, 16, 18];
      const result = calculateCV(values);
      expect(result).toBeGreaterThan(0);
    });

    it('should return null for insufficient data', () => {
      expect(calculateCV([5])).toBeNull();
      expect(calculateCV([])).toBeNull();
    });
  });
});

describe('Async Utilities', () => {
  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('retry', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retry(fn, 3, 100);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));
      
      await expect(retry(fn, 3, 10)).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      const onRetry = vi.fn();
      
      await retry(fn, 3, 10, onRetry);
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });
  });
});

describe('Logger', () => {
  it('should have all log methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should not throw when logging', () => {
    expect(() => logger.info('Test', 'message')).not.toThrow();
    expect(() => logger.error('Test', 'error message')).not.toThrow();
  });
});
