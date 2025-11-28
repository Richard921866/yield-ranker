/**
 * Shared Type Definitions
 */

// ============================================================================
// Tiingo API Types
// ============================================================================

export interface TiingoPriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjOpen: number;
  adjHigh: number;
  adjLow: number;
  adjClose: number;
  adjVolume: number;
  divCash: number;
  splitFactor: number;
}

export interface TiingoDividendData {
  exDate: string;
  payDate: string | null;
  recordDate: string | null;
  declareDate: string | null;
  divCash: number;
  splitFactor: number;
}

export interface TiingoMetaData {
  ticker: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  exchangeCode: string;
}

// ============================================================================
// Database Record Types
// ============================================================================

export interface PriceRecord {
  id?: number;
  ticker: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  adj_close: number | null;
  volume: number | null;
  adj_open: number | null;
  adj_high: number | null;
  adj_low: number | null;
  adj_volume: number | null;
  div_cash: number | null;
  split_factor: number | null;
  created_at?: string;
}

export interface DividendRecord {
  id?: number;
  ticker: string;
  ex_date: string;
  pay_date: string | null;
  record_date: string | null;
  declare_date: string | null;
  div_cash: number;
  split_factor: number | null;
  div_type: string | null;
  currency: string | null;
  created_at?: string;
}

export interface ETFStaticRecord {
  ticker: string;
  issuer: string | null;
  description: string | null;
  pay_day_text: string | null;
  payments_per_year: number | null;
  ipo_price: number | null;
  default_rank_weights: Record<string, number> | null;
  created_at?: string;
  updated_at?: string;
}

export interface SyncLogRecord {
  id?: number;
  ticker: string;
  data_type: 'prices' | 'dividends';
  last_sync_date: string;
  last_data_date: string | null;
  records_synced: number;
  status: 'success' | 'error' | 'pending';
  error_message: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ETFMetrics {
  ticker: string;
  name: string | null;
  issuer: string | null;
  currentPrice: number | null;
  previousClose: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
  week52High: number | null;
  week52Low: number | null;
  lastDividend: number | null;
  annualizedDividend: number | null;
  yield: number | null;
  paymentsPerYear: number;
  dividendVolatility: number | null;
  returns: {
    '1W': ReturnData;
    '1M': ReturnData;
    '3M': ReturnData;
    '6M': ReturnData;
    '1Y': ReturnData;
    '3Y': ReturnData;
  };
  calculatedAt: string;
}

export interface ReturnData {
  price: number | null;
  total: number | null;
}

export interface ChartDataPoint {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
  divCash: number;
  priceReturn: number;
  totalReturn: number;
}

export interface RankedETF {
  ticker: string;
  yield: number | null;
  totalReturn: number | null;
  volatility: number | null;
  normalizedScores: {
    yield: number;
    totalReturn: number;
    volatility: number;
  };
  compositeScore: number;
  rank: number;
}

export interface RankingWeights {
  yield: number;
  totalReturn: number;
  volatility: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type ChartPeriod = '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  page: number;
  limit: number;
  total: number;
}
