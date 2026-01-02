/**
 * Check NXG Signal calculation to understand why it's N/A
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from multiple possible locations
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
    if (
      !result.error &&
      result.parsed &&
      Object.keys(result.parsed).length > 0
    ) {
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

import { getSupabase } from "../src/services/database.js";
import { 
  calculateCEFZScore, 
  calculateNAVTrend6M, 
  calculateNAVReturn12M,
  calculateSignal 
} from "../src/routes/cefs.js";

async function checkNXGSignal() {
  console.log("\n=== Checking NXG Signal Calculation ===\n");

  const ticker = "NXG";
  const navSymbol = "XNXGX";

  // Check database values first
  const db = getSupabase();
  const { data: cefData } = await db
    .from("etf_static")
    .select("ticker, nav_symbol, five_year_z_score, nav_trend_6m, nav_trend_12m, signal")
    .eq("ticker", ticker)
    .maybeSingle();

  console.log("=== Database Values ===");
  if (cefData) {
    console.log(`  Z-Score (five_year_z_score): ${cefData.five_year_z_score ?? 'N/A'}`);
    console.log(`  NAV Trend 6M: ${cefData.nav_trend_6m ?? 'N/A'}`);
    console.log(`  NAV Trend 12M: ${cefData.nav_trend_12m ?? 'N/A'}`);
    console.log(`  Signal: ${cefData.signal ?? 'N/A'}`);
  } else {
    console.log("  No CEF data found in database");
  }

  console.log("\n=== Calculating Values Fresh ===");
  
  // Calculate Z-Score
  console.log("\n1. Calculating Z-Score...");
  const zScore = await calculateCEFZScore(ticker, navSymbol);
  console.log(`   Z-Score: ${zScore !== null ? zScore.toFixed(4) : 'N/A'}`);
  if (zScore === null) {
    console.log("   ❌ Z-Score is null - this will cause Signal to be N/A");
  }

  // Calculate NAV Trend 6M
  console.log("\n2. Calculating NAV Trend 6M...");
  const navTrend6M = await calculateNAVTrend6M(navSymbol);
  console.log(`   NAV Trend 6M: ${navTrend6M !== null ? `${navTrend6M.toFixed(4)}%` : 'N/A'}`);
  if (navTrend6M === null) {
    console.log("   ❌ NAV Trend 6M is null - this will cause Signal to be N/A");
  }

  // Calculate NAV Return 12M
  console.log("\n3. Calculating NAV Return 12M...");
  const navTrend12M = await calculateNAVReturn12M(navSymbol);
  console.log(`   NAV Return 12M: ${navTrend12M !== null ? `${navTrend12M.toFixed(4)}%` : 'N/A'}`);
  if (navTrend12M === null) {
    console.log("   ❌ NAV Return 12M is null - this will cause Signal to be N/A");
  }

  // Calculate Signal
  console.log("\n4. Calculating Signal...");
  const signal = await calculateSignal(ticker, navSymbol, zScore, navTrend6M, navTrend12M);
  console.log(`   Signal: ${signal !== null ? signal : 'N/A'}`);
  
  if (signal === null) {
    console.log("\n=== Why Signal is N/A ===");
    if (zScore === null) {
      console.log("  ❌ Z-Score is null");
    }
    if (navTrend6M === null) {
      console.log("  ❌ NAV Trend 6M is null");
    }
    if (navTrend12M === null) {
      console.log("  ❌ NAV Return 12M is null");
    }
    
    // Check NAV history requirement (504 trading days)
    const { getPriceHistory } = await import("../src/services/database.js");
    const { formatDate } = await import("../src/utils/index.js");
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 3);
    const navData = await getPriceHistory(navSymbol, formatDate(startDate), formatDate(endDate));
    console.log(`\n  NAV history check (for Signal requirement):`);
    console.log(`    Records: ${navData.length}`);
    console.log(`    Required: 504 trading days`);
    if (navData.length < 504) {
      console.log(`    ❌ Insufficient history (${navData.length} < 504) - Signal requires at least 2 years of NAV history`);
    } else {
      console.log(`    ✓ Sufficient history`);
    }
  } else {
    console.log(`\n✓ Signal calculated successfully: ${signal}`);
  }

  process.exit(0);
}

checkNXGSignal().catch(console.error);

