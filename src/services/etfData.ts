// ...existing code...
import { ETF } from "@/types/etf";
// ...existing code...

const dataCache = new Map<string, { data: ETF; timestamp: number }>();
const CACHE_DURATION = 30000;

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '';

type DatabaseETF = {
  symbol: string;
  issuer: string | null;
  description: string | null;
  pay_day: string | null;
  ipo_price: number | null;
  price: number | null;
  price_change: number | null;
  dividend: number | null;
  payments_per_year: number | null;
  annual_div: number | null;
  forward_yield: number | null;
  dividend_volatility_index: number | null;
  weighted_rank: number | null;
  three_year_annualized: number | null;
  total_return_12m: number | null;
  total_return_6m: number | null;
  total_return_3m: number | null;
  total_return_1m: number | null;
  total_return_1w: number | null;
  price_return_3y: number | null;
  price_return_12m: number | null;
  price_return_6m: number | null;
  price_return_3m: number | null;
  price_return_1m: number | null;
  price_return_1w: number | null;
};

function mapDatabaseETFToETF(dbEtf: DatabaseETF): ETF {
  const price = dbEtf.price ?? 0;
  const annualDiv = dbEtf.annual_div ?? 0;
  let forwardYield = dbEtf.forward_yield ?? 0;
  
  if (price > 0 && annualDiv > 0) {
    forwardYield = (annualDiv / price) * 100;
  }

  return {
    symbol: dbEtf.symbol,
    name: dbEtf.description || dbEtf.symbol,
    issuer: dbEtf.issuer || '',
    description: dbEtf.description || '',
    payDay: dbEtf.pay_day || undefined,
    ipoPrice: dbEtf.ipo_price ?? 0,
    price: price,
    priceChange: dbEtf.price_change ?? 0,
    dividend: dbEtf.dividend ?? 0,
    numPayments: dbEtf.payments_per_year ?? 12,
    annualDividend: annualDiv,
    forwardYield: forwardYield,
    standardDeviation: dbEtf.dividend_volatility_index ?? 0,
    weightedRank: dbEtf.weighted_rank ?? null,
    week52Low: 0,
    week52High: 0,
    totalReturn3Yr: dbEtf.three_year_annualized ?? undefined,
    totalReturn12Mo: dbEtf.total_return_12m ?? undefined,
    totalReturn6Mo: dbEtf.total_return_6m ?? undefined,
    totalReturn3Mo: dbEtf.total_return_3m ?? undefined,
    totalReturn1Mo: dbEtf.total_return_1m ?? undefined,
    totalReturn1Wk: dbEtf.total_return_1w ?? undefined,
    priceReturn3Yr: dbEtf.price_return_3y ?? undefined,
    priceReturn12Mo: dbEtf.price_return_12m ?? undefined,
    priceReturn6Mo: dbEtf.price_return_6m ?? undefined,
    priceReturn3Mo: dbEtf.price_return_3m ?? undefined,
    priceReturn1Mo: dbEtf.price_return_1m ?? undefined,
    priceReturn1Wk: dbEtf.price_return_1w ?? undefined,
  };
}

export type ETFDataResponse = {
  etfs: ETF[];
  lastUpdated: string | null;
  lastUpdatedTimestamp: string | null;
};

export const fetchETFData = async (): Promise<ETF[]> => {
  const result = await fetchETFDataWithMetadata();
  return result.etfs;
};

export const fetchETFDataWithMetadata = async (): Promise<ETFDataResponse> => {
  const cached = dataCache.get("__ALL__");
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return {
      etfs: cached.data as unknown as ETF[],
      lastUpdated: (cached as any).lastUpdated || null,
      lastUpdatedTimestamp: (cached as any).lastUpdatedTimestamp || null,
    };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/etfs`, {
      signal: AbortSignal.timeout(30000)  // 30 seconds timeout
    });
    if (!response.ok) {
      throw new Error("Failed to fetch ETF data");
    }
    const json = await response.json();
    // Handle both array response and wrapped response
    const dbEtfs: DatabaseETF[] = Array.isArray(json) ? json : (json.data || []);
    const etfs: ETF[] = dbEtfs.map(mapDatabaseETFToETF);
    const lastUpdated = Array.isArray(json) ? null : (json.last_updated || null);
    const lastUpdatedTimestamp = Array.isArray(json) ? null : (json.last_updated_timestamp || null);
    
    dataCache.set("__ALL__", { 
      data: etfs as unknown as ETF, 
      timestamp: now,
      lastUpdated,
      lastUpdatedTimestamp,
    } as any);
    
    return {
      etfs,
      lastUpdated,
      lastUpdatedTimestamp,
    };
  } catch (error) {
    console.error('[ETF Data] Failed to fetch ETF data from backend:', error);
    throw new Error('Unable to load ETF data. Please ensure the backend server is running.');
  }
};

export const fetchSingleETF = async (symbol: string): Promise<ETF | null> => {
  const response = await fetch(`${API_BASE_URL}/api/etfs/${symbol.toUpperCase()}`, {
    signal: AbortSignal.timeout(30000)  // 30 seconds timeout
  });
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch ETF");
  }
  const json = await response.json();
  // Handle both direct object and wrapped response
  const dbEtf: DatabaseETF = json.data || json;
  return mapDatabaseETFToETF(dbEtf);
};

export const clearETFCache = () => {
  dataCache.clear();
};

export type ComparisonTimeframe =
  | "1D"
  | "1W"
  | "1M"
  | "3M"
  | "6M"
  | "YTD"
  | "1Y"
  | "3Y"
  | "5Y"
  | "10Y"
  | "20Y"
  | "MAX";

export type ChartType = "price" | "totalReturn";

type ComparisonResponse = {
  symbols: string[];
  timeframe: ComparisonTimeframe;
  data: {
    [symbol: string]: {
      timestamps: number[];
      closes: number[];
    };
  };
};

export const fetchComparisonData = async (
  symbols: string[],
  timeframe: ComparisonTimeframe,
): Promise<ComparisonResponse> => {
  // Use Tiingo live comparison API
  const response = await fetch(`${API_BASE_URL}/api/tiingo/live/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tickers: symbols, period: timeframe }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch comparison data from Tiingo");
  }
  const json = await response.json();
  
  // Transform Tiingo response to match expected format
  const transformedData: ComparisonResponse = {
    symbols: json.tickers || [],
    timeframe,
    data: {},
  };
  
  for (const ticker of transformedData.symbols) {
    const tickerData = json.data[ticker];
    if (tickerData) {
      transformedData.data[ticker] = {
        timestamps: tickerData.timestamps,
        closes: tickerData.adjCloses, // Use adjusted close for total return
      };
    }
  }
  
  return transformedData;
};

export const generateChartData = (
  comparison: ComparisonResponse,
  chartType: ChartType,
): any[] => {
  const primarySymbol = comparison.symbols[0];
  const primary = comparison.data[primarySymbol];
  if (!primary || !primary.timestamps.length || !primary.closes.length) {
    return [];
  }
  
  const firstValidPrice: Record<string, number> = {};
  for (const symbol of comparison.symbols) {
    const series = comparison.data[symbol];
    if (series && series.closes.length > 0) {
      for (let i = 0; i < series.closes.length; i++) {
        const close = series.closes[i];
        if (close != null && !isNaN(close) && close > 0) {
          firstValidPrice[symbol] = close;
          break;
        }
      }
    }
  }

  const length = Math.min(primary.timestamps.length, primary.closes.length);
  const result: any[] = [];
  
  for (let i = 0; i < length; i++) {
    const ts = primary.timestamps[i];
    const point: Record<string, number | string> = {
      time:
        comparison.timeframe === "1D"
          ? new Date(ts * 1000).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date(ts * 1000).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
    };
    
    let hasValidData = false;
    
    for (const symbol of comparison.symbols) {
      const series = comparison.data[symbol];
      if (!series || series.closes[i] == null) continue;
      
      const price = series.closes[i];
      if (isNaN(price) || price <= 0) continue;
      
      if (chartType === "price") {
        if (symbol === primarySymbol && comparison.symbols.length === 1) {
          point.price = Number(price.toFixed(2));
        } else {
          point[`price_${symbol}`] = Number(price.toFixed(2));
        }
        hasValidData = true;
      } else {
        const base = firstValidPrice[symbol];
        if (!base || base <= 0) continue;
        const totalReturn = ((price - base) / base) * 100;
        if (symbol === primarySymbol && comparison.symbols.length === 1) {
          point.price = Number(totalReturn.toFixed(2));
        } else {
          point[`return_${symbol}`] = Number(totalReturn.toFixed(2));
        }
        hasValidData = true;
      }
    }
    
    if (hasValidData) {
      result.push(point);
    }
  }
  
  return result;
};

// Note: Quick updates and dividend history are now fetched via Tiingo API
// Use tiingoApi.ts for these functions
