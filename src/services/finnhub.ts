const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || '';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Validate API key is set
if (!FINNHUB_API_KEY) {
  console.warn('[Finnhub] ⚠️ API key not configured. Set VITE_FINNHUB_API_KEY environment variable for live data.');
}

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
}

interface FinnhubProfile {
  name: string;
  ticker: string;
  exchange: string;
  industry: string;
  logo: string;
  weburl: string;
  ipo: string;
  marketCapitalization: number;
}

interface FinnhubCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  t: number[]; // Timestamps
  v: number[]; // Volume
  s: string; // Status
}

export const fetchQuote = async (symbol: string): Promise<FinnhubQuote | null> => {
  // Skip API call if no API key is configured
  if (!FINNHUB_API_KEY) {
    return null;
  }

  try {
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    console.log(`[Finnhub] Fetching quote for ${symbol}...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error(`[Finnhub] ⚠️ Authentication failed for ${symbol}. Check your API key.`);
      } else {
        console.error(`[Finnhub] HTTP ${response.status} for ${symbol}`);
      }
      return null;
    }
    
    const data = await response.json();
    console.log(`[Finnhub] ${symbol} response:`, data);
    
    return data;
  } catch (error) {
    console.error(`[Finnhub] Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

export const fetchProfile = async (symbol: string): Promise<FinnhubProfile | null> => {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching profile for ${symbol}:`, error);
    return null;
  }
};

export const fetchCandles = async (
  symbol: string,
  from: number,
  to: number,
  resolution: string = 'D'
): Promise<FinnhubCandle | null> => {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching candles for ${symbol}:`, error);
    return null;
  }
};

export const fetchDividends = async (
  symbol: string,
  from: string,
  to: string
): Promise<any | null> => {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/dividend?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching dividends for ${symbol}:`, error);
    return null;
  }
};
