/**
 * Test fixtures for price and return calculations
 * Covers various scenarios: price movements, dividends, splits, edge cases
 */

// Note: Fixture data uses partial types - mock Supabase handles partial records

// ============================================================================
// Stable Growth Price Data
// ============================================================================

export const stableGrowthPrices = [
  {
    ticker: 'SPY',
    date: '2024-01-01',
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
    date: '2024-01-02',
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
    date: '2024-01-03',
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
    date: '2024-01-04',
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
    date: '2024-01-05',
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

// ============================================================================
// Price Data with Dividends
// ============================================================================

export const priceWithDividends = [
  {
    ticker: 'VTI',
    date: '2024-01-01',
    open: 200,
    high: 205,
    low: 198,
    close: 202,
    adj_close: 202,
    volume: 40000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'VTI',
    date: '2024-01-02',
    open: 202,
    high: 208,
    low: 200,
    close: 206,
    adj_close: 206,
    volume: 38000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'VTI',
    date: '2024-01-03',
    open: 206,
    high: 212,
    low: 204,
    close: 210,
    adj_close: 207.5, // Adjusted for dividend
    volume: 42000000,
    div_cash: 2.5, // Dividend paid
    split_factor: 1,
  },
  {
    ticker: 'VTI',
    date: '2024-01-04',
    open: 207.5,
    high: 214,
    low: 206,
    close: 212,
    adj_close: 209.5,
    volume: 39000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'VTI',
    date: '2024-01-05',
    open: 209.5,
    high: 216,
    low: 208,
    close: 214,
    adj_close: 211.5,
    volume: 41000000,
    div_cash: 0,
    split_factor: 1,
  },
];

// ============================================================================
// Price Data with Stock Split
// ============================================================================

export const priceWithSplit = [
  {
    ticker: 'AAPL',
    date: '2024-01-01',
    open: 400,
    high: 410,
    low: 395,
    close: 405,
    adj_close: 101.25, // 4:1 split adjusted
    volume: 60000000,
    div_cash: 0,
    split_factor: 4,
  },
  {
    ticker: 'AAPL',
    date: '2024-01-02',
    open: 102,
    high: 108,
    low: 100,
    close: 106,
    adj_close: 106,
    volume: 58000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'AAPL',
    date: '2024-01-03',
    open: 106,
    high: 112,
    low: 104,
    close: 110,
    adj_close: 110,
    volume: 62000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'AAPL',
    date: '2024-01-04',
    open: 110,
    high: 116,
    low: 108,
    close: 114,
    adj_close: 114,
    volume: 59000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'AAPL',
    date: '2024-01-05',
    open: 114,
    high: 120,
    low: 112,
    close: 118,
    adj_close: 118,
    volume: 61000000,
    div_cash: 0,
    split_factor: 1,
  },
];

// ============================================================================
// Volatile Price Data
// ============================================================================

export const volatilePrices = [
  {
    ticker: 'TSLA',
    date: '2024-01-01',
    open: 200,
    high: 220,
    low: 180,
    close: 190,
    adj_close: 190,
    volume: 80000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'TSLA',
    date: '2024-01-02',
    open: 190,
    high: 210,
    low: 170,
    close: 205,
    adj_close: 205,
    volume: 85000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'TSLA',
    date: '2024-01-03',
    open: 205,
    high: 225,
    low: 185,
    close: 195,
    adj_close: 195,
    volume: 90000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'TSLA',
    date: '2024-01-04',
    open: 195,
    high: 215,
    low: 175,
    close: 210,
    adj_close: 210,
    volume: 88000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'TSLA',
    date: '2024-01-05',
    open: 210,
    high: 230,
    low: 190,
    close: 220,
    adj_close: 220,
    volume: 92000000,
    div_cash: 0,
    split_factor: 1,
  },
];

// ============================================================================
// Declining Price Data
// ============================================================================

export const decliningPrices = [
  {
    ticker: 'META',
    date: '2024-01-01',
    open: 350,
    high: 355,
    low: 345,
    close: 348,
    adj_close: 348,
    volume: 30000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'META',
    date: '2024-01-02',
    open: 348,
    high: 352,
    low: 340,
    close: 342,
    adj_close: 342,
    volume: 32000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'META',
    date: '2024-01-03',
    open: 342,
    high: 346,
    low: 335,
    close: 338,
    adj_close: 338,
    volume: 31000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'META',
    date: '2024-01-04',
    open: 338,
    high: 342,
    low: 330,
    close: 332,
    adj_close: 332,
    volume: 33000000,
    div_cash: 0,
    split_factor: 1,
  },
  {
    ticker: 'META',
    date: '2024-01-05',
    open: 332,
    high: 336,
    low: 325,
    close: 328,
    adj_close: 328,
    volume: 34000000,
    div_cash: 0,
    split_factor: 1,
  },
];

// ============================================================================
// Corresponding Dividend Data
// ============================================================================

export const correspondingDividends = [
  {
    ticker: 'VTI',
    ex_date: '2024-01-03',
    pay_date: '2024-01-05',
    div_cash: 2.5,
    adj_amount: 2.5,
    div_type: 'regular',
  },
  {
    ticker: 'SPY',
    ex_date: '2024-01-15',
    pay_date: '2024-01-20',
    div_cash: 1.8,
    adj_amount: 1.8,
    div_type: 'regular',
  },
];

// ============================================================================
// Expected Results for Validation
// ============================================================================

export const expectedReturnResults = {
  stableGrowth: {
    // Price Return: (468/452) - 1 = 3.54%
    priceReturn: ((468 / 452) - 1) * 100,
    // DRIP Return: (468/452) - 1 = 3.54% (same as price return, no dividends)
    dripReturn: ((468 / 452) - 1) * 100,
    // No DRIP Return: ((468-452) + 0) / 452 = 3.54% (same as price return, no dividends)
    noDripReturn: (((468 - 452) + 0) / 452) * 100,
  },
  withDividends: {
    // Price Return: (214/202) - 1 = 5.94%
    priceReturn: ((214 / 202) - 1) * 100,
    // DRIP Return: (211.5/202) - 1 = 4.70% (adjusted prices account for dividends)
    dripReturn: ((211.5 / 202) - 1) * 100,
    // No DRIP Return: ((214-202) + 2.5) / 202 = 7.18%
    noDripReturn: (((214 - 202) + 2.5) / 202) * 100,
  },
  withSplit: {
    // Price Return: (118/405) - 1 = -70.86% (unadjusted prices show split effect)
    priceReturn: ((118 / 405) - 1) * 100,
    // DRIP Return: (118/101.25) - 1 = 16.54% (adjusted prices handle split correctly)
    dripReturn: ((118 / 101.25) - 1) * 100,
    // No DRIP Return: ((118-405) + 0) / 405 = -70.86% (same as price return, no dividends)
    noDripReturn: (((118 - 405) + 0) / 405) * 100,
  },
  volatile: {
    // Price Return: (220/190) - 1 = 15.79%
    priceReturn: ((220 / 190) - 1) * 100,
    // DRIP Return: (220/190) - 1 = 15.79% (same as price return, no dividends)
    dripReturn: ((220 / 190) - 1) * 100,
    // No DRIP Return: ((220-190) + 0) / 190 = 15.79% (same as price return, no dividends)
    noDripReturn: (((220 - 190) + 0) / 190) * 100,
  },
  declining: {
    // Price Return: (328/348) - 1 = -5.75%
    priceReturn: ((328 / 348) - 1) * 100,
    // DRIP Return: (328/348) - 1 = -5.75% (same as price return, no dividends)
    dripReturn: ((328 / 348) - 1) * 100,
    // No DRIP Return: ((328-348) + 0) / 348 = -5.75% (same as price return, no dividends)
    noDripReturn: (((328 - 348) + 0) / 348) * 100,
  },
};

// ============================================================================
// Edge Case Data
// ============================================================================

export const edgeCasePrices = {
  insufficient: [
    {
      ticker: 'INSUFF',
      date: '2024-01-01',
      open: 100,
      high: 105,
      low: 95,
      close: 102,
      adj_close: 102,
      volume: 1000000,
      div_cash: 0,
      split_factor: 1,
    },
  ],
  zeroPrices: [
    {
      ticker: 'ZERO',
      date: '2024-01-01',
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
      ticker: 'ZERO',
      date: '2024-01-02',
      open: 100,
      high: 105,
      low: 95,
      close: 102,
      adj_close: 102,
      volume: 1000000,
      div_cash: 0,
      split_factor: 1,
    },
  ],
  negativePrices: [
    {
      ticker: 'NEG',
      date: '2024-01-01',
      open: -100,
      high: -95,
      low: -105,
      close: -98,
      adj_close: -98,
      volume: 1000000,
      div_cash: 0,
      split_factor: 1,
    },
    {
      ticker: 'NEG',
      date: '2024-01-02',
      open: 100,
      high: 105,
      low: 95,
      close: 102,
      adj_close: 102,
      volume: 1000000,
      div_cash: 0,
      split_factor: 1,
    },
  ],
  nullPrices: [
    {
      ticker: 'NULL',
      date: '2024-01-01',
      open: null,
      high: null,
      low: null,
      close: null,
      adj_close: null,
      volume: 0,
      div_cash: 0,
      split_factor: 1,
    },
    {
      ticker: 'NULL',
      date: '2024-01-02',
      open: 100,
      high: 105,
      low: 95,
      close: 102,
      adj_close: 102,
      volume: 1000000,
      div_cash: 0,
      split_factor: 1,
    },
  ],
};
