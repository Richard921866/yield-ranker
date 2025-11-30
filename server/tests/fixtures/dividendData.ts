/**
 * Test fixtures for dividend volatility calculations
 * Covers various scenarios: regular quarterly, monthly, frequency changes, edge cases
 */

// Note: Fixture data uses partial types - mock Supabase handles partial records

// ============================================================================
// Regular Quarterly Dividends (Stable)
// ============================================================================

export const regularQuarterlyDividends = [
  {
    ticker: 'SPY',
    ex_date: '2024-09-30',
    pay_date: '2024-10-15',
    div_cash: 1.80,
    adj_amount: 1.80,
    div_type: 'regular',
  },
  {
    ticker: 'SPY',
    ex_date: '2024-06-30',
    pay_date: '2024-07-15',
    div_cash: 1.75,
    adj_amount: 1.75,
    div_type: 'regular',
  },
  {
    ticker: 'SPY',
    ex_date: '2024-03-30',
    pay_date: '2024-04-15',
    div_cash: 1.70,
    adj_amount: 1.70,
    div_type: 'regular',
  },
  {
    ticker: 'SPY',
    ex_date: '2023-12-30',
    pay_date: '2024-01-15',
    div_cash: 1.65,
    adj_amount: 1.65,
    div_type: 'regular',
  },
  {
    ticker: 'SPY',
    ex_date: '2023-09-30',
    pay_date: '2023-10-15',
    div_cash: 1.60,
    adj_amount: 1.60,
    div_type: 'regular',
  },
  {
    ticker: 'SPY',
    ex_date: '2023-06-30',
    pay_date: '2023-07-15',
    div_cash: 1.55,
    adj_amount: 1.55,
    div_type: 'regular',
  },
  {
    ticker: 'SPY',
    ex_date: '2023-03-30',
    pay_date: '2023-04-15',
    div_cash: 1.50,
    adj_amount: 1.50,
    div_type: 'regular',
  },
  {
    ticker: 'SPY',
    ex_date: '2022-12-30',
    pay_date: '2023-01-15',
    div_cash: 1.45,
    adj_amount: 1.45,
    div_type: 'regular',
  },
];

// ============================================================================
// Monthly Dividends (Higher Frequency)
// ============================================================================

export const monthlyDividends = [
  {
    ticker: 'AGG',
    ex_date: '2024-09-30',
    pay_date: '2024-10-02',
    div_cash: 0.20,
    adj_amount: 0.20,
    div_type: 'regular',
  },
  {
    ticker: 'AGG',
    ex_date: '2024-08-30',
    pay_date: '2024-09-02',
    div_cash: 0.20,
    adj_amount: 0.20,
    div_type: 'regular',
  },
  {
    ticker: 'AGG',
    ex_date: '2024-07-30',
    pay_date: '2024-08-02',
    div_cash: 0.20,
    adj_amount: 0.20,
    div_type: 'regular',
  },
  {
    ticker: 'AGG',
    ex_date: '2024-06-30',
    pay_date: '2024-07-02',
    div_cash: 0.20,
    adj_amount: 0.20,
    div_type: 'regular',
  },
  {
    ticker: 'AGG',
    ex_date: '2024-05-30',
    pay_date: '2024-06-02',
    div_cash: 0.20,
    adj_amount: 0.20,
    div_type: 'regular',
  },
  {
    ticker: 'AGG',
    ex_date: '2024-04-30',
    pay_date: '2024-05-02',
    div_cash: 0.20,
    adj_amount: 0.20,
    div_type: 'regular',
  },
  {
    ticker: 'AGG',
    ex_date: '2024-03-30',
    pay_date: '2024-04-02',
    div_cash: 0.20,
    adj_amount: 0.20,
    div_type: 'regular',
  },
  {
    ticker: 'AGG',
    ex_date: '2024-02-29',
    pay_date: '2024-03-02',
    div_cash: 0.20,
    adj_amount: 0.20,
    div_type: 'regular',
  },
];

// ============================================================================
// Frequency Change Scenario (Monthly → Quarterly)
// ============================================================================

export const frequencyChangeDividends = [
  // Recent quarterly payments
  {
    ticker: 'HYG',
    ex_date: '2024-09-30',
    pay_date: '2024-10-15',
    div_cash: 0.50,
    adj_amount: 0.50,
    div_type: 'regular',
  },
  {
    ticker: 'HYG',
    ex_date: '2024-06-30',
    pay_date: '2024-07-15',
    div_cash: 0.48,
    adj_amount: 0.48,
    div_type: 'regular',
  },
  {
    ticker: 'HYG',
    ex_date: '2024-03-30',
    pay_date: '2024-04-15',
    div_cash: 0.46,
    adj_amount: 0.46,
    div_type: 'regular',
  },
  // Older monthly payments
  {
    ticker: 'HYG',
    ex_date: '2023-12-30',
    pay_date: '2024-01-02',
    div_cash: 0.15,
    adj_amount: 0.15,
    div_type: 'regular',
  },
  {
    ticker: 'HYG',
    ex_date: '2023-11-30',
    pay_date: '2023-12-02',
    div_cash: 0.15,
    adj_amount: 0.15,
    div_type: 'regular',
  },
  {
    ticker: 'HYG',
    ex_date: '2023-10-30',
    pay_date: '2023-11-02',
    div_cash: 0.15,
    adj_amount: 0.15,
    div_type: 'regular',
  },
  {
    ticker: 'HYG',
    ex_date: '2023-09-30',
    pay_date: '2023-10-02',
    div_cash: 0.15,
    adj_amount: 0.15,
    div_type: 'regular',
  },
  {
    ticker: 'HYG',
    ex_date: '2023-08-30',
    pay_date: '2023-09-02',
    div_cash: 0.15,
    adj_amount: 0.15,
    div_type: 'regular',
  },
  {
    ticker: 'HYG',
    ex_date: '2023-07-30',
    pay_date: '2023-08-02',
    div_cash: 0.15,
    adj_amount: 0.15,
    div_type: 'regular',
  },
  {
    ticker: 'HYG',
    ex_date: '2023-06-30',
    pay_date: '2023-07-02',
    div_cash: 0.15,
    adj_amount: 0.15,
    div_type: 'regular',
  },
];

// ============================================================================
// High Volatility Dividends
// ============================================================================

export const highVolatilityDividends = [
  {
    ticker: 'VZ',
    ex_date: '2024-09-30',
    pay_date: '2024-10-15',
    div_cash: 0.70,
    adj_amount: 0.70,
    div_type: 'regular',
  },
  {
    ticker: 'VZ',
    ex_date: '2024-06-30',
    pay_date: '2024-07-15',
    div_cash: 0.65,
    adj_amount: 0.65,
    div_type: 'regular',
  },
  {
    ticker: 'VZ',
    ex_date: '2024-03-30',
    pay_date: '2024-04-15',
    div_cash: 0.55,
    adj_amount: 0.55,
    div_type: 'regular',
  },
  {
    ticker: 'VZ',
    ex_date: '2023-12-30',
    pay_date: '2024-01-15',
    div_cash: 0.50,
    adj_amount: 0.50,
    div_type: 'regular',
  },
  {
    ticker: 'VZ',
    ex_date: '2023-09-30',
    pay_date: '2023-10-15',
    div_cash: 0.45,
    adj_amount: 0.45,
    div_type: 'regular',
  },
  {
    ticker: 'VZ',
    ex_date: '2023-06-30',
    pay_date: '2023-07-15',
    div_cash: 0.40,
    adj_amount: 0.40,
    div_type: 'regular',
  },
  {
    ticker: 'VZ',
    ex_date: '2023-03-30',
    pay_date: '2023-04-15',
    div_cash: 0.35,
    adj_amount: 0.35,
    div_type: 'regular',
  },
  {
    ticker: 'VZ',
    ex_date: '2022-12-30',
    pay_date: '2023-01-15',
    div_cash: 0.30,
    adj_amount: 0.30,
    div_type: 'regular',
  },
];

// ============================================================================
// Mixed Dividend Types (Regular + Special)
// ============================================================================

export const mixedDividendTypes = [
  {
    ticker: 'MSFT',
    ex_date: '2024-09-30',
    pay_date: '2024-10-15',
    div_cash: 0.75,
    adj_amount: 0.75,
    div_type: 'regular',
  },
  {
    ticker: 'MSFT',
    ex_date: '2024-08-30',
    pay_date: '2024-09-15',
    div_cash: 3.00,
    adj_amount: 3.00,
    div_type: 'special',
  },
  {
    ticker: 'MSFT',
    ex_date: '2024-06-30',
    pay_date: '2024-07-15',
    div_cash: 0.70,
    adj_amount: 0.70,
    div_type: 'regular',
  },
  {
    ticker: 'MSFT',
    ex_date: '2024-03-30',
    pay_date: '2024-04-15',
    div_cash: 0.68,
    adj_amount: 0.68,
    div_type: 'regular',
  },
  {
    ticker: 'MSFT',
    ex_date: '2023-12-30',
    pay_date: '2024-01-15',
    div_cash: 0.65,
    adj_amount: 0.65,
    div_type: 'regular',
  },
];

// ============================================================================
// Edge Cases
// ============================================================================

export const insufficientDividends = [
  {
    ticker: 'NEW',
    ex_date: '2024-09-30',
    pay_date: '2024-10-15',
    div_cash: 1.00,
    adj_amount: 1.00,
    div_type: 'regular',
  },
  {
    ticker: 'NEW',
    ex_date: '2024-06-30',
    pay_date: '2024-07-15',
    div_cash: 0.95,
    adj_amount: 0.95,
    div_type: 'regular',
  },
];

export const splitAdjustedDividends = [
  {
    ticker: 'AAPL',
    ex_date: '2024-09-30',
    pay_date: '2024-10-15',
    div_cash: 0.96,
    adj_amount: 0.24, // 4:1 split adjustment
    div_type: 'regular',
  },
  {
    ticker: 'AAPL',
    ex_date: '2024-06-30',
    pay_date: '2024-07-15',
    div_cash: 0.96,
    adj_amount: 0.24, // 4:1 split adjustment
    div_type: 'regular',
  },
  {
    ticker: 'AAPL',
    ex_date: '2024-03-30',
    pay_date: '2024-04-15',
    div_cash: 0.96,
    adj_amount: 0.24, // 4:1 split adjustment
    div_type: 'regular',
  },
  {
    ticker: 'AAPL',
    ex_date: '2023-12-30',
    pay_date: '2024-01-15',
    div_cash: 0.96,
    adj_amount: 0.24, // 4:1 split adjustment
    div_type: 'regular',
  },
];

export const nullDividendTypes = [
  {
    ticker: 'NULLTYPE',
    ex_date: '2024-09-30',
    pay_date: '2024-10-15',
    div_cash: 1.00,
    adj_amount: 1.00,
    div_type: null,
  },
  {
    ticker: 'NULLTYPE',
    ex_date: '2024-06-30',
    pay_date: '2024-07-15',
    div_cash: 0.95,
    adj_amount: 0.95,
    div_type: null,
  },
  {
    ticker: 'NULLTYPE',
    ex_date: '2024-03-30',
    pay_date: '2024-04-15',
    div_cash: 0.90,
    adj_amount: 0.90,
    div_type: null,
  },
  {
    ticker: 'NULLTYPE',
    ex_date: '2023-12-30',
    pay_date: '2024-01-15',
    div_cash: 0.85,
    adj_amount: 0.85,
    div_type: null,
  },
];

// ============================================================================
// Expected Results for Validation
// ============================================================================

export const expectedResults = {
  regularQuarterly: {
    annualDividend: 7.2, // 1.80 * 4
    volatilityIndex: 'Very Low', // Stable payments
    dataPoints: 12, // Should have enough data points
  },
  monthly: {
    annualDividend: 2.4, // 0.20 * 12
    volatilityIndex: 'Very Low', // Very stable payments
    dataPoints: 8,
  },
  frequencyChange: {
    annualDividend: 2.0, // 0.50 * 4 (recent quarterly rate)
    volatilityIndex: 'Moderate', // Frequency change creates volatility
    dataPoints: 10,
  },
  highVolatility: {
    annualDividend: 2.8, // 0.70 * 4
    volatilityIndex: 'High', // Large variations
    dataPoints: 8,
  },
  mixedTypes: {
    annualDividend: 2.8, // 0.75 * 4 (special dividends excluded)
    volatilityIndex: 'Low', // Should ignore special dividends
    dataPoints: 4,
  },
  insufficient: {
    annualDividend: null,
    volatilityIndex: null,
    dataPoints: 0,
  },
  splitAdjusted: {
    annualDividend: 0.96, // 0.24 * 4 (using adjusted amounts)
    volatilityIndex: 'Very Low',
    dataPoints: 4,
  },
  nullTypes: {
    annualDividend: 4.0, // 1.00 * 4 (null types treated as regular)
    volatilityIndex: 'Low',
    dataPoints: 4,
  },
};
