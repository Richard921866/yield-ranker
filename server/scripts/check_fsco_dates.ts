/**
 * Check date ranges for FSCO and XFSCX to understand why Z-Score is N/A
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

async function checkFSCODates() {
  console.log("\n=== Checking FSCO and XFSCX Date Ranges ===\n");

  // Get 4 years of data (same as Z-Score calculation)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 4);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Check FSCO price data
  const fscoPrices = await getPriceHistory("FSCO", startDateStr, endDateStr);

  // Check XFSCX NAV data
  const xfscxPrices = await getPriceHistory("XFSCX", startDateStr, endDateStr);

  console.log(`FSCO Price Records: ${fscoPrices?.length || 0}`);
  if (fscoPrices && fscoPrices.length > 0) {
    console.log(`  First date: ${fscoPrices[0].date}`);
    console.log(`  Last date: ${fscoPrices[fscoPrices.length - 1].date}`);
  }

  console.log(`\nXFSCX NAV Records: ${xfscxPrices?.length || 0}`);
  if (xfscxPrices && xfscxPrices.length > 0) {
    console.log(`  First date: ${xfscxPrices[0].date}`);
    console.log(`  Last date: ${xfscxPrices[xfscxPrices.length - 1].date}`);
  }

  // Find overlapping dates
  if (fscoPrices && xfscxPrices && fscoPrices.length > 0 && xfscxPrices.length > 0) {
    const fscoDates = new Set(fscoPrices.map(p => p.date));
    const xfscxDates = new Set(xfscxPrices.map(p => p.date));
    
    const overlappingDates: string[] = [];
    for (const date of fscoDates) {
      if (xfscxDates.has(date)) {
        const fscoPrice = fscoPrices.find(p => p.date === date)?.close;
        const xfscxNav = xfscxPrices.find(p => p.date === date)?.close;
        if (fscoPrice && fscoPrice > 0 && xfscxNav && xfscxNav > 0) {
          overlappingDates.push(date);
        }
      }
    }

    console.log(`\n=== Overlapping Dates (both have valid price/NAV) ===`);
    console.log(`Total overlapping dates: ${overlappingDates.length}`);
    if (overlappingDates.length > 0) {
      console.log(`  First overlapping date: ${overlappingDates[0]}`);
      console.log(`  Last overlapping date: ${overlappingDates[overlappingDates.length - 1]}`);
      
      // Calculate date range
      const firstDate = new Date(overlappingDates[0]);
      const lastDate = new Date(overlappingDates[overlappingDates.length - 1]);
      const daysDiff = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`  Date range: ${daysDiff} calendar days`);
      console.log(`  Trading days (approx): ~${Math.round(daysDiff * 5/7)} (assuming 5 trading days per week)`);
    }

    // Check what's missing
    console.log(`\n=== Analysis ===`);
    if (fscoPrices.length > 0 && xfscxPrices.length > 0) {
      const fscoFirst = new Date(fscoPrices[0].date);
      const fscoLast = new Date(fscoPrices[fscoPrices.length - 1].date);
      const xfscxFirst = new Date(xfscxPrices[0].date);
      const xfscxLast = new Date(xfscxPrices[xfscxPrices.length - 1].date);
      
      console.log(`FSCO trading period: ${fscoFirst.toISOString().split('T')[0]} to ${fscoLast.toISOString().split('T')[0]}`);
      console.log(`XFSCX trading period: ${xfscxFirst.toISOString().split('T')[0]} to ${xfscxLast.toISOString().split('T')[0]}`);
      
      if (fscoFirst > xfscxFirst) {
        console.log(`\n⚠️  FSCO started trading ${Math.round((fscoFirst.getTime() - xfscxFirst.getTime()) / (1000 * 60 * 60 * 24))} days AFTER XFSCX NAV data began`);
      } else if (xfscxFirst > fscoFirst) {
        console.log(`\n⚠️  XFSCX NAV data started ${Math.round((xfscxFirst.getTime() - fscoFirst.getTime()) / (1000 * 60 * 60 * 24))} days AFTER FSCO started trading`);
      }
      
      if (overlappingDates.length < 252) {
        const missing = 252 - overlappingDates.length;
        console.log(`\n❌ Need ${missing} more overlapping trading days to calculate Z-Score (have ${overlappingDates.length}, need 252)`);
      }
    }
  }

  console.log(`\n=== Z-Score Calculation Window (4 years) ===`);
  console.log(`Start date: ${startDateStr}`);
  console.log(`End date: ${endDateStr}`);
  console.log(`FSCO records in 4-year window: ${fscoPrices.length}`);
  console.log(`XFSCX records in 4-year window: ${xfscxPrices.length}`);

  process.exit(0);
}

checkFSCODates().catch(console.error);

