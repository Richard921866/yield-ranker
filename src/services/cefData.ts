import { CEF } from "@/types/cef";

const API_URL = import.meta.env.VITE_API_URL || "";

export interface CEFDataResponse {
  cefs: CEF[];
  lastUpdated?: string;
  lastUpdatedTimestamp?: string;
}

// Session-level caching for immediate display (not localStorage)
// Data is cached in sessionStorage for the current session only
// This allows immediate display like CC ETFs while still fetching fresh data
const CEF_SESSION_CACHE_KEY = "cef-data-session-cache";
const CEF_SESSION_CACHE_TIMESTAMP_KEY = "cef-data-session-cache-timestamp";

export function isCEFDataCached(): boolean {
  try {
    // Check sessionStorage (not localStorage) - only for current session
    const cached = sessionStorage.getItem(CEF_SESSION_CACHE_KEY);
    const timestamp = sessionStorage.getItem(CEF_SESSION_CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) return false;
    
    // Cache is valid for 5 minutes (allows immediate display while fresh data loads)
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    
    return cacheAge < CACHE_DURATION_MS;
  } catch {
    return false;
  }
}

export function clearCEFCache(): void {
  try {
    // Clear sessionStorage cache
    sessionStorage.removeItem(CEF_SESSION_CACHE_KEY);
    sessionStorage.removeItem(CEF_SESSION_CACHE_TIMESTAMP_KEY);
    // Also clear any old localStorage cache from previous versions
    localStorage.removeItem("cef-data-cache");
    localStorage.removeItem("cef-data-cache-timestamp");
    localStorage.removeItem("cef-data-cache-version");
  } catch (error) {
    // Ignore errors
  }
}

export async function fetchCEFData(): Promise<CEF[]> {
  try {
    // NO CACHING - Always fetch fresh data from database
    // Use timestamp query param for cache-busting (doesn't require CORS header)
    const response = await fetch(`${API_URL}/api/cefs?t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch CEF data: ${response.statusText}`);
    }
    const data = await response.json();
    return data.cefs || data || [];
  } catch (error) {
    console.error("Error fetching CEF data:", error);
    throw error;
  }
}

export async function fetchCEFDataWithMetadata(): Promise<CEFDataResponse> {
  // Always fetch fresh data from database (no cache blocking)
  // Cache is only used for instant display while fresh data loads
  try {
    // Add timeout to fetch request - increased to 90 seconds to allow for database queries
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

    try {
      // Use timestamp query param for cache-busting (doesn't require CORS header)
      const response = await fetch(`${API_URL}/api/cefs?t=${Date.now()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch CEF data: ${response.statusText}`);
      }
      const json = await response.json();

      // Handle both array response and wrapped response (same as ETF data)
      const cefs: CEF[] = Array.isArray(json) ? json : (json.cefs || []);
      const lastUpdated = Array.isArray(json) ? null : (json.last_updated || json.lastUpdated || null);
      const lastUpdatedTimestamp = Array.isArray(json) ? null : (json.last_updated_timestamp || json.lastUpdatedTimestamp || json.last_updated || null);

      const data: CEFDataResponse = {
        cefs,
        lastUpdated,
        lastUpdatedTimestamp,
      };

      // Cache in sessionStorage for immediate display on next visit (5 minute cache)
      try {
        sessionStorage.setItem(CEF_SESSION_CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(CEF_SESSION_CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch (cacheError) {
        console.warn("Failed to cache CEF data in sessionStorage:", cacheError);
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error("Request timeout: CEF data fetch took too long");
      } else {
        throw err instanceof Error ? err : new Error(String(err));
      }
    }
  } catch (error) {
    console.error("[CEF Data] Failed to fetch CEF data from backend:", error);
    
    // If fetch failed, try to use stale sessionStorage cache as fallback
    const staleCache = sessionStorage.getItem(CEF_SESSION_CACHE_KEY);
    if (staleCache) {
      try {
        const data = JSON.parse(staleCache);
        console.log("[CEF Data] Using stale cached data as fallback");
        return {
          ...data,
          lastUpdatedTimestamp: data.lastUpdatedTimestamp || data.last_updated_timestamp || undefined,
          lastUpdated: data.lastUpdated || data.last_updated || undefined,
        };
      } catch (parseError) {
        console.error("[CEF Data] Failed to parse stale cache:", parseError);
      }
    }
    
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function fetchSingleCEF(symbol: string): Promise<CEF | null> {
  try {
    // NO CACHING - Always fetch fresh data from database
    // Use timestamp query param for cache-busting (doesn't require CORS header)
    const response = await fetch(`${API_URL}/api/cefs/${symbol}?t=${Date.now()}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch CEF data: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching single CEF:", error);
    return null;
  }
}

export interface PriceNAVData {
  date: string;
  price: number | null;
  nav: number | null;
}

export interface PriceNAVResponse {
  symbol: string;
  navSymbol: string | null;
  period: string;
  data: PriceNAVData[];
}

export async function fetchCEFPriceNAV(symbol: string, period: string = '1Y'): Promise<PriceNAVResponse> {
  try {
    // NO CACHING - Always fetch fresh chart data from database
    // Use timestamp query param for cache-busting (doesn't require CORS header)
    const response = await fetch(`${API_URL}/api/cefs/${symbol}/price-nav?period=${period}&t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch price/NAV data: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching CEF price/NAV data:", error);
    throw error;
  }
}
