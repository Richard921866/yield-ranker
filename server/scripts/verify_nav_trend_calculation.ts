/**
 * Verify NAV Trend Calculation for CEO
 * Shows exactly what dates and prices are being used
 * Compares with CEO's expected calculation
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { getPriceHistory } from '../src/services/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../yield-ranker/server/.env'),
  path.resolve(__dirname, '../../yield-ranker/server/.env'),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials');
  process.exit(1);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function verifyNAVTrendCalculation(navSymbol: string) {
  console.log("=".repeat(120));
  console.log(`NAV TREND CALCULATION VERIFICATION: ${navSymbol}`);
  console.log("=".repeat(120));
  console.log();

  // CEO's data from Tiingo (adjusted prices)
  const CEO_DATA = {
    current: { date: '2025-12-29', price: 20.85 },
    sixMonthsAgo: { date: '2025-06-29', price: 18.65 },
    twelveMonthsAgo: { date: '2024-12-30', price: 17.46 },
  };

  console.log("CEO's Data (from Tiingo - Adjusted Prices):");
  console.log("-".repeat(120));
  console.log(`Current (12/29/25):     $${CEO_DATA.current.price.toFixed(2)}`);
  console.log(`6 Months Ago (6/29/25): $${CEO_DATA.sixMonthsAgo.price.toFixed(2)}`);
  console.log(`12 Months Ago (12/30/24): $${CEO_DATA.twelveMonthsAgo.price.toFixed(2)}`);
  console.log();

  // CEO's calculations
  const ceo6M = ((CEO_DATA.current.price - CEO_DATA.sixMonthsAgo.price) / CEO_DATA.sixMonthsAgo.price) * 100;
  const ceo12M = ((CEO_DATA.current.price - CEO_DATA.twelveMonthsAgo.price) / CEO_DATA.twelveMonthsAgo.price) * 100;

  console.log("CEO's Calculations:");
  console.log("-".repeat(120));
  console.log(`6M NAV Trend: (${CEO_DATA.current.price} - ${CEO_DATA.sixMonthsAgo.price}) / ${CEO_DATA.sixMonthsAgo.price} × 100 = ${ceo6M.toFixed(2)}%`);
  console.log(`12M NAV Trend: (${CEO_DATA.current.price} - ${CEO_DATA.twelveMonthsAgo.price}) / ${CEO_DATA.twelveMonthsAgo.price} × 100 = ${ceo12M.toFixed(2)}%`);
  console.log();

  // Get our data
  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - 15); // Get 15 months to ensure we have data
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(today);

  console.log("Fetching data from database/API...");
  console.log(`Date range: ${startDateStr} to ${endDateStr}`);
  console.log();

  const navData = await getPriceHistory(
    navSymbol.toUpperCase(),
    startDateStr,
    endDateStr
  );

  if (navData.length === 0) {
    console.error(`❌ No data found for ${navSymbol}`);
    return;
  }

  // Sort by date ascending
  navData.sort((a, b) => a.date.localeCompare(b.date));

  // Get current NAV (last record)
  const currentRecord = navData[navData.length - 1];
  if (!currentRecord) {
    console.error(`❌ No current record found`);
    return;
  }

  console.log("=".repeat(120));
  console.log("OUR CALCULATION:");
  console.log("=".repeat(120));
  console.log();

  // Show current record
  console.log("Current Record (Most Recent Available):");
  console.log("-".repeat(120));
  console.log(`Date: ${currentRecord.date}`);
  console.log(`Close (Unadjusted): $${currentRecord.close?.toFixed(2) ?? 'N/A'}`);
  console.log(`Adj Close (Adjusted): $${currentRecord.adj_close?.toFixed(2) ?? 'N/A'}`);
  console.log(`Using: ${currentRecord.adj_close ? 'Adj Close (Adjusted)' : 'Close (Unadjusted)'}`);
  console.log();

  // Calculate 6 months ago
  const currentDate = new Date(currentRecord.date + "T00:00:00");
  const sixMonthsAgo = new Date(currentDate);
  sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
  const sixMonthsAgoStr = formatDate(sixMonthsAgo);

  console.log(`Target Date for 6M: ${sixMonthsAgoStr} (6 calendar months from ${currentRecord.date})`);
  console.log();

  // Find 6M record
  let past6MRecord = navData.find((r) => r.date >= sixMonthsAgoStr);
  if (!past6MRecord) {
    const sixMonthsRecords = navData.filter((r) => r.date <= sixMonthsAgoStr);
    past6MRecord = sixMonthsRecords.length > 0 ? sixMonthsRecords[sixMonthsRecords.length - 1] : undefined;
  }

  if (past6MRecord) {
    console.log("6 Months Ago Record:");
    console.log("-".repeat(120));
    console.log(`Date: ${past6MRecord.date} (target was ${sixMonthsAgoStr})`);
    console.log(`Close (Unadjusted): $${past6MRecord.close?.toFixed(2) ?? 'N/A'}`);
    console.log(`Adj Close (Adjusted): $${past6MRecord.adj_close?.toFixed(2) ?? 'N/A'}`);
    console.log(`Using: ${past6MRecord.adj_close ? 'Adj Close (Adjusted)' : 'Close (Unadjusted)'}`);
    console.log();

    const currentNav = currentRecord.adj_close ?? currentRecord.close;
    const past6MNav = past6MRecord.adj_close ?? past6MRecord.close;

    if (currentNav && past6MNav && past6MNav > 0) {
      const our6M = ((currentNav - past6MNav) / past6MNav) * 100;
      console.log("6M NAV Trend Calculation:");
      console.log("-".repeat(120));
      console.log(`Formula: (Current - 6M Ago) / 6M Ago × 100`);
      console.log(`Our Calculation: (${currentNav.toFixed(2)} - ${past6MNav.toFixed(2)}) / ${past6MNav.toFixed(2)} × 100 = ${our6M.toFixed(2)}%`);
      console.log(`CEO's Calculation: ${ceo6M.toFixed(2)}%`);
      console.log(`Difference: ${(our6M - ceo6M).toFixed(2)}%`);
      console.log();
    }
  }

  // Calculate 12 months ago
  const twelveMonthsAgo = new Date(currentDate);
  twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);
  const twelveMonthsAgoStr = formatDate(twelveMonthsAgo);

  console.log(`Target Date for 12M: ${twelveMonthsAgoStr} (12 calendar months from ${currentRecord.date})`);
  console.log();

  // Find 12M record
  let past12MRecord = navData.find((r) => r.date >= twelveMonthsAgoStr);
  if (!past12MRecord) {
    const twelveMonthsRecords = navData.filter((r) => r.date <= twelveMonthsAgoStr);
    past12MRecord = twelveMonthsRecords.length > 0 ? twelveMonthsRecords[twelveMonthsRecords.length - 1] : undefined;
  }

  if (past12MRecord) {
    console.log("12 Months Ago Record:");
    console.log("-".repeat(120));
    console.log(`Date: ${past12MRecord.date} (target was ${twelveMonthsAgoStr})`);
    console.log(`Close (Unadjusted): $${past12MRecord.close?.toFixed(2) ?? 'N/A'}`);
    console.log(`Adj Close (Adjusted): $${past12MRecord.adj_close?.toFixed(2) ?? 'N/A'}`);
    console.log(`Using: ${past12MRecord.adj_close ? 'Adj Close (Adjusted)' : 'Close (Unadjusted)'}`);
    console.log();

    const currentNav = currentRecord.adj_close ?? currentRecord.close;
    const past12MNav = past12MRecord.adj_close ?? past12MRecord.close;

    if (currentNav && past12MNav && past12MNav > 0) {
      const our12M = ((currentNav - past12MNav) / past12MNav) * 100;
      console.log("12M NAV Trend Calculation:");
      console.log("-".repeat(120));
      console.log(`Formula: (Current - 12M Ago) / 12M Ago × 100`);
      console.log(`Our Calculation: (${currentNav.toFixed(2)} - ${past12MNav.toFixed(2)}) / ${past12MNav.toFixed(2)} × 100 = ${our12M.toFixed(2)}%`);
      console.log(`CEO's Calculation: ${ceo12M.toFixed(2)}%`);
      console.log(`Difference: ${(our12M - ceo12M).toFixed(2)}%`);
      console.log();
    }
  }

  console.log("=".repeat(120));
  console.log("ANALYSIS:");
  console.log("=".repeat(120));
  console.log();

  // Check if we're using adjusted or unadjusted
  const usingAdjusted = currentRecord.adj_close !== null && currentRecord.adj_close !== undefined;
  console.log(`Price Type: ${usingAdjusted ? 'ADJUSTED (adj_close)' : 'UNADJUSTED (close)'}`);
  console.log(`Data Source: Database (prices_daily table) with Tiingo API fallback`);
  console.log();

  // Show nearby dates for comparison
  console.log("Nearby Dates (for reference):");
  console.log("-".repeat(120));
  const nearbyDates = navData.filter(r => {
    const date = new Date(r.date);
    return (
      r.date === '2025-12-29' ||
      r.date === '2025-06-29' ||
      r.date === '2024-12-30' ||
      (date >= new Date('2025-12-27') && date <= new Date('2025-12-31')) ||
      (date >= new Date('2025-06-27') && date <= new Date('2025-07-01')) ||
      (date >= new Date('2024-12-28') && date <= new Date('2025-01-01'))
    );
  });

  nearbyDates.forEach(r => {
    console.log(`${r.date}: Close=$${r.close?.toFixed(2) ?? 'N/A'}, Adj Close=$${r.adj_close?.toFixed(2) ?? 'N/A'}`);
  });

  console.log();
  console.log("=".repeat(120));
}

async function main() {
  const args = process.argv.slice(2);
  const navSymbol = args[0] || 'XCSQX'; // Default to CSQ's NAV symbol

  try {
    await verifyNAVTrendCalculation(navSymbol);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();

