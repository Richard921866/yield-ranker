import { describe, expect, test } from 'vitest';
import { calculateNormalizedDividendsForCEFs } from '../src/services/dividendNormalization.js';

describe('dividendNormalization (CEF) - NIE 12/29 special detection', () => {
  test('NIE 12/29 year-end special dividend should be detected as Special (date-based: 2 days after regular)', () => {
    // Simulate NIE's pattern: regular monthly payments, then a year-end special on 12/29
    // The 12/29 payment comes 2 days after 12/27, so it should be detected as Special via date-based rule
    const divs = [
      { id: 1, ticker: 'NIE', ex_date: '2024-10-28', div_cash: 0.15, adj_amount: 0.15 },
      { id: 2, ticker: 'NIE', ex_date: '2024-11-27', div_cash: 0.15, adj_amount: 0.15 },
      { id: 3, ticker: 'NIE', ex_date: '2024-12-27', div_cash: 0.15, adj_amount: 0.15 }, // regular monthly
      { id: 4, ticker: 'NIE', ex_date: '2024-12-29', div_cash: 0.15, adj_amount: 0.15 }, // year-end special (2 days later - should be detected as Special even if amount is same)
      { id: 5, ticker: 'NIE', ex_date: '2025-01-28', div_cash: 0.15, adj_amount: 0.15 },
    ];

    const res = calculateNormalizedDividendsForCEFs(divs);
    const byDate = new Map(res.map((r) => [divs.find((d) => d.id === r.id)!.ex_date, r]));

    const dec29 = byDate.get('2024-12-29');
    expect(dec29).toBeDefined();
    
    // The 12/29 dividend should be detected as Special because it comes 2 days after the previous payment (1-4 day rule)
    // This catches year-end cap gains and other specials that come close to regular payments
    expect(dec29!.pmt_type).toBe('Special');
    expect(dec29!.days_since_prev).toBe(2);
    
    // The 12/27 dividend should remain Regular (not affected by the special that comes after)
    const dec27 = byDate.get('2024-12-27');
    expect(dec27!.pmt_type).toBe('Regular');
  });
});

