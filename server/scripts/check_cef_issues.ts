/**
 * Check NXG and total returns issues for multiple CEFs
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

import { getPriceHistory } from "../src/services/database.js";
import { calculateAllNAVReturns } from "../src/routes/cefs.js";
import { getSupabase } from "../src/services/database.js";

async function checkNXG() {
  console.log("\n=== Checking NXG (3Y Z-Score Issue) ===\n");

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 4);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Get NXG and XNXGX data
  const nxgPrices = await getPriceHistory("NXG", startDateStr, endDateStr);
  const xnxgxPrices = await getPriceHistory("XNXGX", startDateStr, endDateStr);

  console.log(`NXG Price Records: ${nxgPrices.length}`);
  if (nxgPrices.length > 0) {
    console.log(`  First date: ${nxgPrices[0].date}`);
    console.log(`  Last date: ${nxgPrices[nxgPrices.length - 1].date}`);
  }

  console.log(`\nXNXGX NAV Records: ${xnxgxPrices.length}`);
  if (xnxgxPrices.length > 0) {
    console.log(`  First date: ${xnxgxPrices[0].date}`);
    console.log(`  Last date: ${xnxgxPrices[xnxgxPrices.length - 1].date}`);
  }

  // Find overlapping dates
  if (nxgPrices.length > 0 && xnxgxPrices.length > 0) {
    const nxgDates = new Set(nxgPrices.map(p => p.date));
    const xnxgxDates = new Set(xnxgxPrices.map(p => p.date));
    
    const overlappingDates: string[] = [];
    for (const date of nxgDates) {
      if (xnxgxDates.has(date)) {
        const nxgPrice = nxgPrices.find(p => p.date === date)?.close;
        const xnxgxNav = xnxgxPrices.find(p => p.date === date)?.close;
        if (nxgPrice && nxgPrice > 0 && xnxgxNav && xnxgxNav > 0) {
          overlappingDates.push(date);
        }
      }
    }

    console.log(`\n=== Overlapping Dates ===`);
    console.log(`Total overlapping dates: ${overlappingDates.length}`);
    if (overlappingDates.length > 0) {
      console.log(`  First overlapping date: ${overlappingDates[0]}`);
      console.log(`  Last overlapping date: ${overlappingDates[overlappingDates.length - 1]}`);
    }

    if (overlappingDates.length < 252) {
      const missing = 252 - overlappingDates.length;
      console.log(`\n❌ Need ${missing} more overlapping trading days to calculate Z-Score (have ${overlappingDates.length}, need 252)`);
    } else {
      console.log(`\n✓ Sufficient overlapping days for Z-Score calculation`);
    }
  }
}

async function checkTotalReturns() {
  console.log("\n\n=== Checking Total Returns for Multiple CEFs ===\n");

  const cefsToCheck = [
    { ticker: "FFA", navSymbol: "XFFAX" },
    { ticker: "CSQ", navSymbol: "XCSQX" },
    { ticker: "FOF", navSymbol: "XFOFX" },
    { ticker: "UTF", navSymbol: "XUTFX" },
    { ticker: "BTO", navSymbol: "XBTOX" },
    { ticker: "GAB", navSymbol: "XGABX" },
    { ticker: "BME", navSymbol: "XBMEX" },
    { ticker: "UTG", navSymbol: "XUTGX" },
    { ticker: "GOF", navSymbol: "XGOFX" },
    { ticker: "PCN", navSymbol: "XPCNX" },
    { ticker: "IGR", navSymbol: "XIGRX" },
    { ticker: "DNP", navSymbol: "XDNPX" },
  ];

  const db = getSupabase();

  for (const { ticker, navSymbol } of cefsToCheck) {
    console.log(`\n--- ${ticker} (${navSymbol}) ---`);
    
    // Check what's in the database
    const { data: cefData } = await db
      .from("etf_static")
      .select("ticker, nav_symbol, tr_drip_3y, tr_drip_5y, tr_drip_10y, tr_drip_15y")
      .eq("ticker", ticker)
      .maybeSingle();

    if (cefData) {
      console.log(`  Database values:`);
      console.log(`    3Y: ${cefData.tr_drip_3y ?? 'N/A'}`);
      console.log(`    5Y: ${cefData.tr_drip_5y ?? 'N/A'}`);
      console.log(`    10Y: ${cefData.tr_drip_10y ?? 'N/A'}`);
      console.log(`    15Y: ${cefData.tr_drip_15y ?? 'N/A'}`);
    }

    // Check NAV data availability
    const endDate = new Date();
    const startDate15Y = new Date();
    startDate15Y.setFullYear(endDate.getFullYear() - 15);
    const startDateStr = startDate15Y.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const navData = await getPriceHistory(navSymbol, startDateStr, endDateStr);
    console.log(`  NAV data: ${navData.length} records`);
    if (navData.length > 0) {
      console.log(`    First date: ${navData[0].date}`);
      console.log(`    Last date: ${navData[navData.length - 1].date}`);
      
      // Check specific date ranges
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const threeYearsAgoStr = threeYearsAgo.toISOString().split('T')[0];
      
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      const fiveYearsAgoStr = fiveYearsAgo.toISOString().split('T')[0];
      
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      const tenYearsAgoStr = tenYearsAgo.toISOString().split('T')[0];

      const has3Y = navData.some(p => p.date <= threeYearsAgoStr);
      const has5Y = navData.some(p => p.date <= fiveYearsAgoStr);
      const has10Y = navData.some(p => p.date <= tenYearsAgoStr);

      console.log(`    Has data for 3Y calculation: ${has3Y ? '✓' : '✗'} (need data on/before ${threeYearsAgoStr})`);
      console.log(`    Has data for 5Y calculation: ${has5Y ? '✓' : '✗'} (need data on/before ${fiveYearsAgoStr})`);
      console.log(`    Has data for 10Y calculation: ${has10Y ? '✓' : '✗'} (need data on/before ${tenYearsAgoStr})`);

      // Try to calculate returns
      try {
        const returns = await calculateAllNAVReturns(navSymbol);
        console.log(`  Calculated returns:`);
        console.log(`    3Y: ${returns.return3Yr !== null ? `${returns.return3Yr.toFixed(2)}%` : 'N/A'}`);
        console.log(`    5Y: ${returns.return5Yr !== null ? `${returns.return5Yr.toFixed(2)}%` : 'N/A'}`);
        console.log(`    10Y: ${returns.return10Yr !== null ? `${returns.return10Yr.toFixed(2)}%` : 'N/A'}`);
        console.log(`    15Y: ${returns.return15Yr !== null ? `${returns.return15Yr.toFixed(2)}%` : 'N/A'}`);
      } catch (error) {
        console.log(`  Error calculating returns: ${(error as Error).message}`);
      }
      
      // Check if there's more recent data in the database
      const recentStartDate = new Date();
      recentStartDate.setFullYear(recentStartDate.getFullYear() - 1);
      const recentNavData = await getPriceHistory(navSymbol, recentStartDate.toISOString().split('T')[0], endDateStr);
      console.log(`  Recent NAV data (last year): ${recentNavData.length} records`);
      if (recentNavData.length > 0) {
        console.log(`    First: ${recentNavData[0].date}, Last: ${recentNavData[recentNavData.length - 1].date}`);
      } else {
        console.log(`    ⚠️  NO RECENT DATA - This is why returns are N/A!`);
      }
    } else {
      console.log(`  ❌ No NAV data found for ${navSymbol}`);
    }
  }
}

async function main() {
  await checkNXG();
  await checkTotalReturns();
  process.exit(0);
}

main().catch(console.error);

