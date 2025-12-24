/**
 * Test Z-Score calculation for GAB
 * Expected: ~1.16 (from Gemini)
 * Current: -0.93 (incorrect)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error && result.parsed && Object.keys(result.parsed).length > 0) {
      console.log(`✓ Loaded .env from: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (e) {
    // Continue
  }
}

if (!envLoaded) {
  dotenv.config();
}

import { createClient } from "@supabase/supabase-js";
import { getPriceHistory } from "../src/services/database.js";
import { formatDate } from "../src/utils/index.js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testZScoreGAB() {
  const ticker = "GAB";
  
  console.log("=".repeat(80));
  console.log(`Testing Z-Score Calculation for ${ticker}`);
  console.log("=".repeat(80));

  try {
    // Get CEF info
    const { data: cef, error } = await supabase
      .from("etf_static")
      .select("ticker, nav_symbol")
      .eq("ticker", ticker.toUpperCase())
      .maybeSingle();

    if (error || !cef) {
      console.error(`❌ Error fetching CEF ${ticker}: ${error?.message || "Not found"}`);
      return;
    }

    const navSymbol = cef.nav_symbol;
    if (!navSymbol) {
      console.error(`❌ No NAV symbol for ${ticker}`);
      return;
    }

    console.log(`\nCEF: ${ticker}`);
    console.log(`NAV Symbol: ${navSymbol}`);

    // Fetch 6 years of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 6);
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    console.log(`\nFetching price data: ${startDateStr} to ${endDateStr}`);

    const [priceData, navData] = await Promise.all([
      getPriceHistory(ticker, startDateStr, endDateStr),
      getPriceHistory(navSymbol.toUpperCase(), startDateStr, endDateStr),
    ]);

    console.log(`\nPrice records: ${priceData.length}`);
    console.log(`NAV records: ${navData.length}`);
    
    // Show date range
    if (priceData.length > 0) {
      priceData.sort((a, b) => a.date.localeCompare(b.date));
      console.log(`Price date range: ${priceData[0].date} to ${priceData[priceData.length - 1].date}`);
    }
    if (navData.length > 0) {
      navData.sort((a, b) => a.date.localeCompare(b.date));
      console.log(`NAV date range: ${navData[0].date} to ${navData[navData.length - 1].date}`);
    }
    
    // Show latest values
    if (priceData.length > 0 && navData.length > 0) {
      const latestPrice = priceData[priceData.length - 1];
      const latestNav = navData[navData.length - 1];
      console.log(`\nLatest Price (${latestPrice.date}):`);
      console.log(`  Close: ${latestPrice.close}`);
      console.log(`  Adj Close: ${latestPrice.adj_close}`);
      console.log(`\nLatest NAV (${latestNav.date}):`);
      console.log(`  Close: ${latestNav.close}`);
      console.log(`  Adj Close: ${latestNav.adj_close}`);
      
      if (latestPrice.close != null && latestNav.close != null) {
        const currentDiscountClose = (latestPrice.close / latestNav.close - 1) * 100;
        console.log(`\nCurrent Discount (using close): ${currentDiscountClose.toFixed(4)}%`);
      } else {
        console.log(`\nCurrent Discount (using close): N/A (missing data)`);
      }
      
      if (latestPrice.adj_close != null && latestNav.adj_close != null) {
        const currentDiscountAdj = (latestPrice.adj_close / latestNav.adj_close - 1) * 100;
        console.log(`Current Discount (using adj_close): ${currentDiscountAdj.toFixed(4)}%`);
      } else {
        console.log(`Current Discount (using adj_close): N/A (missing data)`);
      }
    }

    if (priceData.length === 0 || navData.length === 0) {
      console.error("❌ Insufficient data");
      return;
    }

    // Test with ADJUSTED prices
    console.log("\n" + "=".repeat(80));
    console.log("CALCULATION USING ADJUSTED PRICES (adj_close)");
    console.log("=".repeat(80));

    const priceMapAdj = new Map<string, number>();
    priceData.forEach((p: any) => {
      const price = p.adj_close ?? p.close ?? null;
      if (price !== null && price > 0) {
        priceMapAdj.set(p.date, price);
      }
    });

    const navMapAdj = new Map<string, number>();
    navData.forEach((p: any) => {
      const nav = p.adj_close ?? p.close ?? null;
      if (nav !== null && nav > 0) {
        navMapAdj.set(p.date, nav);
      }
    });

    const discountsAdj: number[] = [];
    const allDates = new Set([...priceMapAdj.keys(), ...navMapAdj.keys()]);
    const sortedDates = Array.from(allDates).sort();

    for (const date of sortedDates) {
      const price = priceMapAdj.get(date);
      const nav = navMapAdj.get(date);
      if (price && nav && nav > 0) {
        discountsAdj.push(price / nav - 1.0);
      }
    }

    console.log(`\nTotal discount records: ${discountsAdj.length}`);

    const DAYS_5Y = 5 * 252; // 1260 trading days
    const DAYS_2Y = 2 * 252; // 504 trading days

    if (discountsAdj.length < DAYS_2Y) {
      console.error(`❌ Insufficient data: ${discountsAdj.length} < ${DAYS_2Y} (2 years)`);
      return;
    }

    const lookbackPeriod = Math.min(discountsAdj.length, DAYS_5Y);
    const history = discountsAdj.slice(-lookbackPeriod);

    console.log(`Using ${history.length} records (last ${lookbackPeriod} days)`);

    // Calculate stats
    const currentDiscount = history[history.length - 1];
    const avgDiscount = history.reduce((sum, d) => sum + d, 0) / history.length;
    const variance =
      history.reduce((sum, d) => sum + Math.pow(d - avgDiscount, 2), 0) /
      history.length;
    const stdDev = Math.sqrt(variance);

    console.log(`\nStatistics:`);
    console.log(`  Current Discount: ${(currentDiscount * 100).toFixed(4)}%`);
    console.log(`  Average Discount: ${(avgDiscount * 100).toFixed(4)}%`);
    console.log(`  Standard Deviation: ${(stdDev * 100).toFixed(4)}%`);
    console.log(`  Variance: ${(variance * 10000).toFixed(6)}`);

    if (stdDev === 0) {
      console.log(`\n❌ Standard deviation is 0, cannot calculate Z-Score`);
      return;
    }

    const zScore = (currentDiscount - avgDiscount) / stdDev;

    console.log(`\n${"=".repeat(80)}`);
    console.log(`Z-SCORE RESULT (using adjusted prices): ${zScore.toFixed(4)}`);
    console.log(`Expected (from Gemini): ~1.16`);
    console.log(`Current (our calculation): ${zScore.toFixed(2)}`);
    console.log(`${"=".repeat(80)}`);

    // Show sample data
    console.log(`\nSample discount values (last 10):`);
    history.slice(-10).forEach((d, i) => {
      console.log(`  ${i + 1}. ${(d * 100).toFixed(4)}%`);
    });

    // Test with UNADJUSTED prices for comparison
    console.log("\n" + "=".repeat(80));
    console.log("COMPARISON: CALCULATION USING UNADJUSTED PRICES (close)");
    console.log("=".repeat(80));

    const priceMapUnadj = new Map<string, number>();
    priceData.forEach((p: any) => {
      const price = p.close ?? null;
      if (price !== null && price > 0) {
        priceMapUnadj.set(p.date, price);
      }
    });

    const navMapUnadj = new Map<string, number>();
    navData.forEach((p: any) => {
      const nav = p.close ?? null;
      if (nav !== null && nav > 0) {
        navMapUnadj.set(p.date, nav);
      }
    });

    const discountsUnadj: number[] = [];
    for (const date of sortedDates) {
      const price = priceMapUnadj.get(date);
      const nav = navMapUnadj.get(date);
      if (price && nav && nav > 0) {
        discountsUnadj.push(price / nav - 1.0);
      }
    }

    const historyUnadj = discountsUnadj.slice(-lookbackPeriod);
    const currentDiscountUnadj = historyUnadj[historyUnadj.length - 1];
    const avgDiscountUnadj = historyUnadj.reduce((sum, d) => sum + d, 0) / historyUnadj.length;
    const varianceUnadj =
      historyUnadj.reduce((sum, d) => sum + Math.pow(d - avgDiscountUnadj, 2), 0) /
      historyUnadj.length;
    const stdDevUnadj = Math.sqrt(varianceUnadj);

    if (stdDevUnadj !== 0) {
      const zScoreUnadj = (currentDiscountUnadj - avgDiscountUnadj) / stdDevUnadj;
      console.log(`\nZ-SCORE (unadjusted): ${zScoreUnadj.toFixed(4)}`);
      console.log(`Z-SCORE (adjusted): ${zScore.toFixed(4)}`);
      console.log(`Difference: ${(zScore - zScoreUnadj).toFixed(4)}`);
    }

  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    console.error(error);
  }
}

testZScoreGAB().catch(console.error);

