/**
 * Metrics Calculation Service
 * 
 * Implements financial calculations for ETF metrics
 */

import {
  getLatestPrice,
  getPriceHistory,
  getDividendHistory,
  getETFStatic,
  getAllTickers,
} from './database.js';
import {
  getDateDaysAgo,
  getDateYearsAgo,
  calculateReturn,
  calculateCV,
  normalize,
} from '../utils/index.js';
import type {
  ETFMetrics,
  ReturnData,
  ChartDataPoint,
  RankedETF,
  RankingWeights,
  ChartPeriod,
  PriceRecord,
} from '../types/index.js';

// ============================================================================
// Period Return Calculations
// ============================================================================

function calculatePeriodReturn(
  prices: PriceRecord[],
  useAdjusted: boolean
): number | null {
  if (prices.length < 2) return null;
  
  const startPrice = useAdjusted
    ? prices[0].adj_close
    : prices[0].close;
  const endPrice = useAdjusted
    ? prices[prices.length - 1].adj_close
    : prices[prices.length - 1].close;
  
  if (!startPrice || !endPrice) return null;
  return calculateReturn(endPrice, startPrice);
}

async function calculateReturnsForPeriod(
  ticker: string,
  days: number
): Promise<ReturnData> {
  const startDate = getDateDaysAgo(days);
  const prices = await getPriceHistory(ticker, startDate);
  
  return {
    price: calculatePeriodReturn(prices, false),
    total: calculatePeriodReturn(prices, true),
  };
}

// ============================================================================
// Main Metrics Calculation
// ============================================================================

export async function calculateMetrics(ticker: string): Promise<ETFMetrics> {
  const upperTicker = ticker.toUpperCase();
  
  // Get static data
  const staticData = await getETFStatic(upperTicker);
  const paymentsPerYear = staticData?.payments_per_year ?? 12;
  
  // Get recent prices
  const recentPrices = await getLatestPrice(upperTicker, 2);
  
  let currentPrice: number | null = null;
  let previousClose: number | null = null;
  let priceChange: number | null = null;
  let priceChangePercent: number | null = null;
  
  if (recentPrices.length >= 1) {
    currentPrice = recentPrices[recentPrices.length - 1].close;
    
    if (recentPrices.length >= 2 && currentPrice) {
      previousClose = recentPrices[recentPrices.length - 2].close;
      if (previousClose) {
        priceChange = currentPrice - previousClose;
        priceChangePercent = calculateReturn(currentPrice, previousClose);
      }
    }
  }
  
  // Get 52-week range
  const yearPrices = await getPriceHistory(upperTicker, getDateYearsAgo(1));
  const closes = yearPrices
    .map(p => p.close)
    .filter((c): c is number => c !== null && c > 0);
  
  const week52High = closes.length > 0 ? Math.max(...closes) : null;
  const week52Low = closes.length > 0 ? Math.min(...closes) : null;
  
  // Get dividend data
  const dividends = await getDividendHistory(upperTicker);
  
  let lastDividend: number | null = null;
  let annualizedDividend: number | null = null;
  let yieldPercent: number | null = null;
  
  if (dividends.length > 0) {
    lastDividend = dividends[0].div_cash;
    annualizedDividend = lastDividend * paymentsPerYear;
    
    if (currentPrice && currentPrice > 0 && annualizedDividend) {
      yieldPercent = (annualizedDividend / currentPrice) * 100;
    }
  }
  
  // Calculate dividend volatility
  let dividendVolatility: number | null = null;
  if (dividends.length >= 4) {
    const recentDivs = dividends.slice(0, 12);
    const growthRates: number[] = [];
    
    for (let i = 1; i < recentDivs.length; i++) {
      const prev = recentDivs[i - 1].div_cash;
      const curr = recentDivs[i].div_cash;
      if (prev > 0 && curr > 0) {
        growthRates.push((curr - prev) / prev);
      }
    }
    
    dividendVolatility = calculateCV(growthRates);
  }
  
  // Calculate returns for all periods
  const [ret1W, ret1M, ret3M, ret6M, ret1Y, ret3Y] = await Promise.all([
    calculateReturnsForPeriod(upperTicker, 7),
    calculateReturnsForPeriod(upperTicker, 30),
    calculateReturnsForPeriod(upperTicker, 90),
    calculateReturnsForPeriod(upperTicker, 180),
    calculateReturnsForPeriod(upperTicker, 365),
    calculateReturnsForPeriod(upperTicker, 1095),
  ]);
  
  return {
    ticker: upperTicker,
    name: staticData?.description ?? null,
    issuer: staticData?.issuer ?? null,
    currentPrice,
    previousClose,
    priceChange,
    priceChangePercent,
    week52High,
    week52Low,
    lastDividend,
    annualizedDividend,
    yield: yieldPercent,
    paymentsPerYear,
    dividendVolatility,
    returns: {
      '1W': ret1W,
      '1M': ret1M,
      '3M': ret3M,
      '6M': ret6M,
      '1Y': ret1Y,
      '3Y': ret3Y,
    },
    calculatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Chart Data Generation
// ============================================================================

export async function getChartData(
  ticker: string,
  period: ChartPeriod
): Promise<ChartDataPoint[]> {
  const startDate = periodToStartDate(period);
  const prices = await getPriceHistory(ticker, startDate);
  
  if (prices.length === 0) return [];
  
  const firstClose = prices[0].close ?? 0;
  const firstAdjClose = prices[0].adj_close ?? 0;
  
  return prices.map(p => ({
    date: p.date,
    timestamp: new Date(p.date).getTime() / 1000,
    open: p.open ?? 0,
    high: p.high ?? 0,
    low: p.low ?? 0,
    close: p.close ?? 0,
    adjClose: p.adj_close ?? 0,
    volume: p.volume ?? 0,
    divCash: p.div_cash ?? 0,
    priceReturn: firstClose > 0 ? (((p.close ?? 0) - firstClose) / firstClose) * 100 : 0,
    totalReturn: firstAdjClose > 0 ? (((p.adj_close ?? 0) - firstAdjClose) / firstAdjClose) * 100 : 0,
  }));
}

function periodToStartDate(period: ChartPeriod): string {
  switch (period) {
    case '1W': return getDateDaysAgo(7);
    case '1M': return getDateDaysAgo(30);
    case '3M': return getDateDaysAgo(90);
    case '6M': return getDateDaysAgo(180);
    case '1Y': return getDateYearsAgo(1);
    case '3Y': return getDateYearsAgo(3);
    case '5Y': return getDateYearsAgo(5);
    case 'MAX': return '2000-01-01';
    default: return getDateYearsAgo(1);
  }
}

// ============================================================================
// Ranking Algorithm
// ============================================================================

export async function calculateRankings(
  weights: RankingWeights = { yield: 34, totalReturn: 33, volatility: 33 }
): Promise<RankedETF[]> {
  const tickers = await getAllTickers();
  
  // Calculate metrics for all tickers
  const metricsPromises = tickers.map(async (ticker) => {
    try {
      const metrics = await calculateMetrics(ticker);
      return {
        ticker,
        yield: metrics.yield,
        totalReturn: metrics.returns['1Y'].total,
        volatility: metrics.dividendVolatility,
      };
    } catch {
      return { ticker, yield: null, totalReturn: null, volatility: null };
    }
  });
  
  const allMetrics = await Promise.all(metricsPromises);
  
  // Filter out tickers with no data
  const validMetrics = allMetrics.filter(
    m => m.yield !== null || m.totalReturn !== null
  );
  
  // Calculate min/max for normalization
  const yields = validMetrics.map(m => m.yield).filter((v): v is number => v !== null);
  const returns = validMetrics.map(m => m.totalReturn).filter((v): v is number => v !== null);
  const vols = validMetrics.map(m => m.volatility).filter((v): v is number => v !== null);
  
  const minYield = yields.length ? Math.min(...yields) : 0;
  const maxYield = yields.length ? Math.max(...yields) : 1;
  const minReturn = returns.length ? Math.min(...returns) : 0;
  const maxReturn = returns.length ? Math.max(...returns) : 1;
  const minVol = vols.length ? Math.min(...vols) : 0;
  const maxVol = vols.length ? Math.max(...vols) : 1;
  
  // Calculate composite scores
  const totalWeight = weights.yield + weights.totalReturn + weights.volatility;
  
  const ranked = validMetrics.map(m => {
    const normYield = m.yield !== null
      ? normalize(m.yield, minYield, maxYield)
      : 0.5;
    
    const normReturn = m.totalReturn !== null
      ? normalize(m.totalReturn, minReturn, maxReturn)
      : 0.5;
    
    // Invert volatility (lower is better)
    const normVol = m.volatility !== null
      ? normalize(m.volatility, minVol, maxVol, true)
      : 0.5;
    
    const score = (
      normYield * weights.yield +
      normReturn * weights.totalReturn +
      normVol * weights.volatility
    ) / totalWeight;
    
    return {
      ticker: m.ticker,
      yield: m.yield,
      totalReturn: m.totalReturn,
      volatility: m.volatility,
      normalizedScores: {
        yield: normYield,
        totalReturn: normReturn,
        volatility: normVol,
      },
      compositeScore: score,
      rank: 0,
    };
  });
  
  // Sort by score and assign ranks
  ranked.sort((a, b) => b.compositeScore - a.compositeScore);
  ranked.forEach((r, i) => { r.rank = i + 1; });
  
  return ranked;
}
