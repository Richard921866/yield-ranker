import { ETF } from "@/types/etf";

const dataCache = new Map<string, { data: ETF; timestamp: number }>();
const CACHE_DURATION = 30000;

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const fetchETFData = async (): Promise<ETF[]> => {
  const cached = dataCache.get("__ALL__");
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data as unknown as ETF[];
  }
  const response = await fetch(`${API_BASE_URL}/api/yahoo-finance/etf`);
  if (!response.ok) {
    throw new Error("Failed to fetch ETF data");
  }
  const json = await response.json();
  const etfs: ETF[] = json.data;
  dataCache.set("__ALL__", { data: etfs as unknown as ETF, timestamp: now });
  return etfs;
};

export const fetchSingleETF = async (symbol: string): Promise<ETF | null> => {
  const all = await fetchETFData();
  const found = all.find((e) => e.symbol === symbol);
  return found || null;
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
  const response = await fetch(`${API_BASE_URL}/api/yahoo-finance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "fetchComparisonData", symbols, timeframe }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch comparison data");
  }
  const json = await response.json();
  return json.data as ComparisonResponse;
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

export const fetchQuickUpdates = async (
  symbols: string[],
): Promise<Record<string, { price: number | null; priceChange: number | null }>> => {
  const response = await fetch(`${API_BASE_URL}/api/yahoo-finance/quick-update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ symbols }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch quick updates");
  }
  const json = await response.json();
  const data = json.data as Record<
    string,
    { symbol: string; price: number | null; priceChange: number | null }
  >;
  const result: Record<string, { price: number | null; priceChange: number | null }> = {};
  Object.keys(data).forEach((key) => {
    const q = data[key];
    result[key] = { price: q.price ?? null, priceChange: q.priceChange ?? null };
  });
  return result;
};

export type DividendHistoryPoint = {
  date: string;
  dividend: number;
};

export const fetchDividendHistory = async (
  symbol: string,
): Promise<DividendHistoryPoint[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/yahoo-finance/dividends?symbol=${encodeURIComponent(symbol)}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch dividend history");
  }
  const json = await response.json();
  const data = json.data as { symbol: string; dividends: DividendHistoryPoint[] };
  return data.dividends || [];
};
