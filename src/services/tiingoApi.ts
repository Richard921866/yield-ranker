/**
 * Tiingo API Frontend Service
 * 
 * Provides typed interfaces for consuming the Tiingo backend API
 */

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '';

// ============================================================================
// Types
// ============================================================================

export interface PriceDataPoint {
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

export interface LatestPrice {
  ticker: string;
  date: string;
  currentPrice: number;
  previousClose: number;
  priceChange: number;
  priceChangePercent: number;
  adjClose: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

export interface DividendRecord {
  exDate: string;
  payDate: string | null;
  recordDate: string | null;
  declareDate: string | null;
  amount: number;
  type: string;
  currency: string;
}

export interface DividendData {
  ticker: string;
  paymentsPerYear: number;
  lastDividend: number | null;
  annualizedDividend: number | null;
  dividendGrowth: number | null;
  dividends: DividendRecord[];
}

export interface ETFMetrics {
  ticker: string;
  name: string;
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
    '1W': { price: number | null; total: number | null };
    '1M': { price: number | null; total: number | null };
    '3M': { price: number | null; total: number | null };
    '6M': { price: number | null; total: number | null };
    '1Y': { price: number | null; total: number | null };
    '3Y': { price: number | null; total: number | null };
  };
  calculatedAt: string;
}

export interface ComparisonData {
  tickers: string[];
  period: string;
  type: string;
  startDate: string;
  data: {
    [ticker: string]: {
      timestamps: number[];
      closes: number[];
      adjCloses: number[];
      priceReturns: number[];
      totalReturns: number[];
    };
  };
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

export interface RankingsResponse {
  weights: {
    yield: number;
    totalReturn: number;
    volatility: number;
  };
  rankings: RankedETF[];
  calculatedAt: string;
}

export interface SyncStatus {
  lastSync: string | null;
  tickersTracked: number;
  pricesSynced: number;
  dividendsSynced: number;
  successCount: number;
  errorCount: number;
}

export type ChartPeriod = '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch price history for a ticker
 */
export async function fetchTiingoPrices(
  ticker: string,
  period: ChartPeriod = '1Y'
): Promise<PriceDataPoint[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/tiingo/prices/${ticker}?period=${period}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch prices for ${ticker}`);
  }
  
  const json = await response.json();
  return json.data || [];
}

/**
 * Fetch latest price for a ticker
 */
export async function fetchLatestPrice(ticker: string): Promise<LatestPrice> {
  const response = await fetch(`${API_BASE_URL}/api/tiingo/latest/${ticker}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch latest price for ${ticker}`);
  }
  
  return response.json();
}

/**
 * Fetch dividend history for a ticker
 */
export async function fetchDividends(
  ticker: string,
  years: number = 5
): Promise<DividendData> {
  const response = await fetch(
    `${API_BASE_URL}/api/tiingo/dividends/${ticker}?years=${years}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dividends for ${ticker}`);
  }
  
  return response.json();
}

/**
 * Fetch calculated metrics for a ticker
 */
export async function fetchMetrics(ticker: string): Promise<ETFMetrics> {
  const response = await fetch(`${API_BASE_URL}/api/tiingo/metrics/${ticker}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics for ${ticker}`);
  }
  
  return response.json();
}

/**
 * Fetch comparison chart data for multiple tickers
 */
export async function fetchComparison(
  tickers: string[],
  period: ChartPeriod = '1Y',
  type: 'totalReturn' | 'priceReturn' = 'totalReturn'
): Promise<ComparisonData> {
  const response = await fetch(`${API_BASE_URL}/api/tiingo/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tickers, period, type }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch comparison data');
  }
  
  return response.json();
}

/**
 * Fetch ranked ETFs with custom weights
 */
export async function fetchRankings(weights?: {
  yield: number;
  totalReturn: number;
  volatility: number;
}): Promise<RankingsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/tiingo/rankings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weights }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch rankings');
  }
  
  return response.json();
}

/**
 * Fetch data sync status
 */
export async function fetchSyncStatus(): Promise<SyncStatus> {
  const response = await fetch(`${API_BASE_URL}/api/tiingo/sync-status`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch sync status');
  }
  
  return response.json();
}

/**
 * Generate chart-ready data from comparison response
 */
export function generateComparisonChartData(
  comparison: ComparisonData,
  useReturns: boolean = true
): Array<{ time: string; [key: string]: number | string }> {
  const tickers = comparison.tickers;
  if (tickers.length === 0) return [];
  
  const primaryTicker = tickers[0];
  const primaryData = comparison.data[primaryTicker];
  if (!primaryData || primaryData.timestamps.length === 0) return [];
  
  const result: Array<{ time: string; [key: string]: number | string }> = [];
  
  for (let i = 0; i < primaryData.timestamps.length; i++) {
    const timestamp = primaryData.timestamps[i];
    const date = new Date(timestamp * 1000);
    
    const point: { time: string; [key: string]: number | string } = {
      time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    
    for (const ticker of tickers) {
      const tickerData = comparison.data[ticker];
      if (tickerData && tickerData.timestamps[i] !== undefined) {
        if (useReturns) {
          point[`return_${ticker}`] = tickerData.totalReturns[i];
          point[`price_return_${ticker}`] = tickerData.priceReturns[i];
        } else {
          point[`price_${ticker}`] = tickerData.closes[i];
          point[`adj_price_${ticker}`] = tickerData.adjCloses[i];
        }
      }
    }
    
    result.push(point);
  }
  
  return result;
}

export default {
  fetchTiingoPrices,
  fetchLatestPrice,
  fetchDividends,
  fetchMetrics,
  fetchComparison,
  fetchRankings,
  fetchSyncStatus,
  generateComparisonChartData,
};
