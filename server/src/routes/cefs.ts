/**
 * CEF (Closed-End Fund) Data Routes
 * 
 * Provides endpoints for CEF data operations
 */

import { Router, Request, Response } from 'express';
import { getSupabase } from '../services/database.js';
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from '../services/redis.js';
import { logger } from '../utils/index.js';
import { getDividendHistory, getPriceHistory } from '../services/database.js';
import type { DividendRecord } from '../types/index.js';

const router: Router = Router();

// ============================================================================
// Helper: Calculate Dividend History (X+ Y- format)
// ============================================================================

function calculateDividendHistory(dividends: DividendRecord[]): string {
  if (!dividends || dividends.length < 2) {
    return dividends.length === 1 ? "1 DIV+" : "0+ 0-";
  }

  // Sort by date descending (newest first), then filter to regular dividends only
  const regularDivs = dividends
    .filter(d => {
      if (!d.div_type) return true;
      const dtype = d.div_type.toLowerCase();
      return dtype.includes('regular') || dtype === 'cash' || dtype === '' || !dtype.includes('special');
    })
    .sort((a, b) => {
      // Manual dividends first, then by date descending
      const aManual = a.is_manual === true ? 1 : 0;
      const bManual = b.is_manual === true ? 1 : 0;
      if (aManual !== bManual) {
        return bManual - aManual;
      }
      return new Date(b.ex_date).getTime() - new Date(a.ex_date).getTime();
    });

  if (regularDivs.length < 2) {
    return regularDivs.length === 1 ? "1 DIV+" : "0+ 0-";
  }

  // Reverse to process chronologically (oldest to newest)
  const chronological = [...regularDivs].reverse();
  
  let increases = 0;
  let decreases = 0;

  for (let i = 1; i < chronological.length; i++) {
    const current = chronological[i];
    const previous = chronological[i - 1];
    
    const currentAmount = current.adj_amount ?? current.div_cash;
    const previousAmount = previous.adj_amount ?? previous.div_cash;
    
    if (currentAmount > previousAmount) {
      increases++;
    } else if (currentAmount < previousAmount) {
      decreases++;
    }
    // If equal, no change counted
  }

  return `${increases}+ ${decreases}-`;
}

// ============================================================================
// GET / - List all CEFs
// ============================================================================

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Try Redis cache first
    const cacheKey = 'cef_list';
    const cached = await getCached<any>(cacheKey);
    if (cached) {
      logger.info('Routes', `Returning ${cached.cefs?.length || 0} CEFs from Redis cache`);
      res.json(cached);
      return;
    }

    const supabase = getSupabase();

    // For now, use etf_static table (CEFs will be stored here with a category flag)
    // In the future, you may want a separate cef_static table
    const staticResult = await supabase
      .from('etf_static')
      .select('*')
      .order('ticker', { ascending: true })
      .limit(10000);

    if (staticResult.error) {
      logger.error('Routes', `Error fetching CEF data: ${staticResult.error.message}`);
      res.status(500).json({ error: 'Failed to fetch CEF data' });
      return;
    }

    const staticData = staticResult.data || [];
    logger.info('Routes', `Fetched ${staticData.length} CEFs from database`);

    // Fetch dividend history for each CEF to calculate X+ Y- format
    const cefsWithDividendHistory = await Promise.all(
      staticData.map(async (cef: any) => {
        let dividendHistory = "0+ 0-";
        try {
          const dividends = await getDividendHistory(cef.ticker);
          dividendHistory = calculateDividendHistory(dividends);
        } catch (error) {
          logger.warn('Routes', `Failed to calculate dividend history for ${cef.ticker}: ${error}`);
        }

        // Calculate premium/discount if NAV and market price exist
        let premiumDiscount: number | null = null;
        if (cef.nav && cef.price) {
          premiumDiscount = ((cef.price - cef.nav) / cef.nav) * 100;
        }

        return {
          symbol: cef.ticker,
          name: cef.description || cef.ticker,
          issuer: cef.issuer || null,
          description: cef.description || null,
          navSymbol: cef.nav_symbol || null,
          openDate: cef.open_date || null,
          ipoPrice: cef.ipo_price || null,
          marketPrice: cef.price || null,
          nav: cef.nav || null,
          premiumDiscount: premiumDiscount,
          fiveYearZScore: cef.five_year_z_score || null,
          navTrend6M: cef.nav_trend_6m || null,
          navTrend12M: cef.nav_trend_12m || null,
          valueHealthScore: cef.value_health_score || null,
          lastDividend: cef.last_dividend || null,
          numPayments: cef.payments_per_year || 12,
          yearlyDividend: cef.annual_dividend || null,
          forwardYield: cef.forward_yield || null,
          dividendHistory: dividendHistory,
          dividendSD: cef.dividend_sd || null,
          dividendCV: cef.dividend_cv || null,
          dividendCVPercent: cef.dividend_cv_percent || null,
          dividendVolatilityIndex: cef.dividend_volatility_index || null,
          return10Yr: cef.tr_drip_3y || null, // Using 3yr as placeholder - adjust as needed
          return5Yr: cef.tr_drip_3y || null,
          return3Yr: cef.tr_drip_3y || null,
          return12Mo: cef.tr_drip_12m || null,
          return6Mo: cef.tr_drip_6m || null,
          return3Mo: cef.tr_drip_3m || null,
          return1Mo: cef.tr_drip_1m || null,
          return1Wk: cef.tr_drip_1w || null,
          weightedRank: cef.weighted_rank || null,
          week52Low: cef.week_52_low || null,
          week52High: cef.week_52_high || null,
          lastUpdated: cef.last_updated || cef.updated_at,
          dataSource: 'Tiingo',
        };
      })
    );

    // Get the most recent update time
    let lastUpdatedTimestamp: string | null = null;
    if (staticData.length > 0) {
      const mostRecent = staticData.reduce((latest: any, current: any) => {
        if (!latest || !latest.last_updated) return current;
        if (!current || !current.last_updated) return latest;
        return new Date(current.last_updated) > new Date(latest.last_updated) ? current : latest;
      }, null);
      lastUpdatedTimestamp = mostRecent?.last_updated || mostRecent?.updated_at || null;
    }

    const response = {
      cefs: cefsWithDividendHistory,
      lastUpdated: lastUpdatedTimestamp,
      lastUpdatedTimestamp: lastUpdatedTimestamp,
    };

    // Cache the response in Redis
    await setCached(cacheKey, response, CACHE_TTL.ETF_LIST); // Using same TTL as ETFs
    logger.info('Routes', `Returning ${cefsWithDividendHistory.length} CEFs (cached)`);

    res.json(response);
  } catch (error) {
    logger.error('Routes', `Error fetching CEFs: ${(error as Error).message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// GET /:symbol - Get single CEF
// ============================================================================

router.get('/:symbol', async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    const ticker = symbol.toUpperCase();
    const supabase = getSupabase();

    const staticResult = await supabase
      .from('etf_static')
      .select('*')
      .eq('ticker', ticker)
      .maybeSingle();

    if (!staticResult.data) {
      res.status(404).json({ error: 'CEF not found' });
      return;
    }

    const cef = staticResult.data;

    // Calculate dividend history
    let dividendHistory = "0+ 0-";
    try {
      const dividends = await getDividendHistory(ticker);
      dividendHistory = calculateDividendHistory(dividends);
    } catch (error) {
      logger.warn('Routes', `Failed to calculate dividend history for ${ticker}: ${error}`);
    }

    // Calculate premium/discount
    let premiumDiscount: number | null = null;
    if (cef.nav && cef.price) {
      premiumDiscount = ((cef.price - cef.nav) / cef.nav) * 100;
    }

    const response = {
      symbol: cef.ticker,
      name: cef.description || cef.ticker,
      issuer: cef.issuer || null,
      description: cef.description || null,
      navSymbol: cef.nav_symbol || null,
      openDate: cef.open_date || null,
      ipoPrice: cef.ipo_price || null,
      marketPrice: cef.price || null,
      nav: cef.nav || null,
      premiumDiscount: premiumDiscount,
      fiveYearZScore: cef.five_year_z_score || null,
      navTrend6M: cef.nav_trend_6m || null,
      navTrend12M: cef.nav_trend_12m || null,
      valueHealthScore: cef.value_health_score || null,
      lastDividend: cef.last_dividend || null,
      numPayments: cef.payments_per_year || 12,
      yearlyDividend: cef.annual_dividend || null,
      forwardYield: cef.forward_yield || null,
      dividendHistory: dividendHistory,
      dividendSD: cef.dividend_sd || null,
      dividendCV: cef.dividend_cv || null,
      dividendCVPercent: cef.dividend_cv_percent || null,
      dividendVolatilityIndex: cef.dividend_volatility_index || null,
      return10Yr: cef.tr_drip_3y || null,
      return5Yr: cef.tr_drip_3y || null,
      return3Yr: cef.tr_drip_3y || null,
      return12Mo: cef.tr_drip_12m || null,
      return6Mo: cef.tr_drip_6m || null,
      return3Mo: cef.tr_drip_3m || null,
      return1Mo: cef.tr_drip_1m || null,
      return1Wk: cef.tr_drip_1w || null,
      weightedRank: cef.weighted_rank || null,
      week52Low: cef.week_52_low || null,
      week52High: cef.week_52_high || null,
      lastUpdated: cef.last_updated || cef.updated_at,
      dataSource: 'Tiingo',
    };

    res.json(response);
  } catch (error) {
    logger.error('Routes', `Error fetching CEF: ${(error as Error).message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// GET /:symbol/price-nav - Get price and NAV data for charting
// ============================================================================

router.get('/:symbol/price-nav', async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    const ticker = symbol.toUpperCase();
    const { period = '1Y' } = req.query;
    
    const supabase = getSupabase();

    // Get CEF info to find NAV symbol
    const staticResult = await supabase
      .from('etf_static')
      .select('nav_symbol')
      .eq('ticker', ticker)
      .maybeSingle();

    if (!staticResult.data) {
      res.status(404).json({ error: 'CEF not found' });
      return;
    }

    const navSymbol = staticResult.data.nav_symbol;

    // Calculate start date based on period
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case '3Y':
        startDate.setFullYear(endDate.getFullYear() - 3);
        break;
      case '5Y':
        startDate.setFullYear(endDate.getFullYear() - 5);
        break;
      case '10Y':
        startDate.setFullYear(endDate.getFullYear() - 10);
        break;
      case '20Y':
        startDate.setFullYear(endDate.getFullYear() - 20);
        break;
      default:
        startDate.setFullYear(endDate.getFullYear() - 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch price data for the CEF (market price)
    const priceData = await getPriceHistory(ticker, startDateStr, endDateStr);

    // Fetch NAV data if navSymbol exists
    let navData: any[] = [];
    if (navSymbol) {
      try {
        navData = await getPriceHistory(navSymbol.toUpperCase(), startDateStr, endDateStr);
      } catch (error) {
        logger.warn('Routes', `Failed to fetch NAV data for ${navSymbol}: ${error}`);
      }
    }

    // Combine data by date
    const priceMap = new Map<string, { close: number | null; date: string }>();
    priceData.forEach((p: any) => {
      const date = p.date.split('T')[0];
      priceMap.set(date, { close: p.close, date });
    });

    const navMap = new Map<string, { close: number | null; date: string }>();
    navData.forEach((p: any) => {
      const date = p.date.split('T')[0];
      navMap.set(date, { close: p.close, date });
    });

    // Get all unique dates and combine
    const allDates = new Set([...priceMap.keys(), ...navMap.keys()]);
    const combinedData = Array.from(allDates)
      .sort()
      .map(date => ({
        date,
        price: priceMap.get(date)?.close || null,
        nav: navMap.get(date)?.close || null,
      }))
      .filter(d => d.price !== null || d.nav !== null); // Only include dates with at least one value

    res.json({
      symbol: ticker,
      navSymbol: navSymbol || null,
      period,
      data: combinedData,
    });
  } catch (error) {
    logger.error('Routes', `Error fetching price/NAV data for ${req.params.symbol}: ${(error as Error).message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
