/**
 * Alpha Vantage API Service
 * 
 * Fetches dividend record and payment dates from Alpha Vantage API
 */

import config from '../config/index.js';
import { logger, sleep } from '../utils/index.js';

// ============================================================================
// Types
// ============================================================================

export interface AlphaVantageDividend {
  ex_dividend_date: string;
  declaration_date: string;
  record_date: string;
  payment_date: string;
  amount: string;
}

export interface DividendDates {
  exDate: string;
  recordDate: string | null;
  paymentDate: string | null;
  declarationDate: string | null;
  amount: number;
}

interface AlphaVantageResponse {
  symbol?: string;
  data?: AlphaVantageDividend[];
  Note?: string;
  Information?: string;
}

// ============================================================================
// Rate Limiting State
// ============================================================================

let lastRequestTime = 0;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const minDelay = config.alphaVantage.rateLimit.minDelayMs;
  
  if (timeSinceLastRequest < minDelay) {
    const waitTime = minDelay - timeSinceLastRequest;
    logger.debug('AlphaVantage', `Rate limiting: waiting ${waitTime}ms`);
    await sleep(waitTime);
  }
  
  lastRequestTime = Date.now();
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Fetch dividend history with record and payment dates from Alpha Vantage
 */
export async function fetchDividendDates(ticker: string): Promise<DividendDates[]> {
  if (!config.alphaVantage.apiKey) {
    logger.warn('AlphaVantage', 'API key not configured');
    return [];
  }

  await waitForRateLimit();

  const url = `${config.alphaVantage.baseUrl}/query?function=DIVIDENDS&symbol=${ticker.toUpperCase()}&apikey=${config.alphaVantage.apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as AlphaVantageResponse;

    // Check for rate limit or error messages
    if (data.Note) {
      logger.warn('AlphaVantage', `Rate limit note: ${data.Note}`);
      return [];
    }

    if (data.Information) {
      logger.warn('AlphaVantage', `API message: ${data.Information}`);
      return [];
    }

    if (!data.data || !Array.isArray(data.data)) {
      logger.debug('AlphaVantage', `No dividend data for ${ticker}`);
      return [];
    }

    const dividends: DividendDates[] = data.data.map((div) => ({
      exDate: div.ex_dividend_date,
      recordDate: div.record_date || null,
      paymentDate: div.payment_date || null,
      declarationDate: div.declaration_date || null,
      amount: parseFloat(div.amount) || 0,
    }));

    logger.debug('AlphaVantage', `Fetched ${dividends.length} dividend records for ${ticker}`);
    return dividends;

  } catch (error) {
    logger.error('AlphaVantage', `Error fetching dividends for ${ticker}: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Get the most recent dividend with dates
 */
export async function getLatestDividendDates(ticker: string): Promise<DividendDates | null> {
  const dividends = await fetchDividendDates(ticker);
  return dividends.length > 0 ? dividends[0] : null;
}

/**
 * Get upcoming dividend (if payment date is in the future)
 */
export async function getUpcomingDividend(ticker: string): Promise<DividendDates | null> {
  const dividends = await fetchDividendDates(ticker);
  const today = new Date().toISOString().split('T')[0];
  
  // Find the first dividend where payment date is in the future
  const upcoming = dividends.find(div => 
    div.paymentDate && div.paymentDate >= today
  );
  
  return upcoming || null;
}

/**
 * Health check for Alpha Vantage API
 */
export async function alphaVantageHealthCheck(): Promise<boolean> {
  if (!config.alphaVantage.apiKey) {
    return false;
  }

  try {
    const dividends = await fetchDividendDates('AAPL');
    return dividends.length > 0;
  } catch {
    return false;
  }
}
