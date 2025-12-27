/**
 * find_funds_with_splits.ts
 * 
 * Identifies all funds (CEFs and ETFs) that have stock splits in their history.
 * This helps verify that adjusted dividend calculations are working correctly.
 * 
 * Usage: npm run find-splits [--ticker SYMBOL]
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
import { fetchPriceHistory } from "../src/services/tiingo.js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SplitInfo {
  ticker: string;
  splitCount: number;
  splits: Array<{ date: string; splitFactor: number; type: string }>;
  hasReverseSplit: boolean;
  hasForwardSplit: boolean;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options: { ticker?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ticker" && i + 1 < args.length) {
      options.ticker = args[i + 1].toUpperCase();
      i++;
    } else if (i === 0 && !args[i].startsWith("--")) {
      options.ticker = args[i].toUpperCase();
    }
  }

  return options;
}

async function findSplitsForTicker(ticker: string): Promise<SplitInfo | null> {
  try {
    // Fetch 15 years of price data to catch all splits
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 15);
    
    const prices = await fetchPriceHistory(
      ticker,
      startDate.toISOString().split("T")[0]
    );

    // Find all splits (splitFactor !== 1.0)
    const splits = prices
      .filter((p) => p.splitFactor && p.splitFactor !== 1.0)
      .map((p) => ({
        date: p.date.split("T")[0],
        splitFactor: p.splitFactor,
        type:
          p.splitFactor < 1
            ? "Reverse Split"
            : p.splitFactor > 1
            ? "Forward Split"
            : "Unknown",
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (splits.length === 0) {
      return null;
    }

    return {
      ticker,
      splitCount: splits.length,
      splits,
      hasReverseSplit: splits.some((s) => s.splitFactor < 1),
      hasForwardSplit: splits.some((s) => s.splitFactor > 1),
    };
  } catch (error) {
    console.error(`  ❌ Error checking ${ticker}: ${(error as Error).message}`);
    return null;
  }
}

async function main() {
  const options = parseArgs();

  console.log("=".repeat(80));
  console.log("FINDING FUNDS WITH STOCK SPLITS");
  console.log("=".repeat(80));
  console.log("This script identifies funds that have splits in their history.");
  console.log("Use this to verify adjusted dividend calculations are correct.\n");

  let tickers: string[] = [];

  if (options.ticker) {
    tickers = [options.ticker];
  } else {
    // Get all tickers from database
    console.log("Fetching all tickers from database...");
    const { data, error } = await supabase
      .from("etf_static")
      .select("ticker")
      .order("ticker");

    if (error || !data) {
      console.error("Failed to fetch tickers:", error);
      process.exit(1);
    }

    tickers = data.map((item) => item.ticker);
    console.log(`Found ${tickers.length} ticker(s) to check\n`);
  }

  const fundsWithSplits: SplitInfo[] = [];
  const errors: Array<{ ticker: string; error: string }> = [];

  console.log("Checking for splits...\n");

  // Process in batches to avoid overwhelming the API
  const BATCH_SIZE = 10;
  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((ticker) => findSplitsForTicker(ticker))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const ticker = batch[j];

      if (result.status === "fulfilled" && result.value) {
        fundsWithSplits.push(result.value);
        console.log(`  ✓ ${ticker}: ${result.value.splitCount} split(s) found`);
      } else if (result.status === "rejected") {
        errors.push({ ticker, error: result.reason?.message || "Unknown error" });
        console.log(`  ⚠ ${ticker}: Error - ${result.reason?.message || "Unknown"}`);
      }
    }

    // Small delay between batches
    if (i + BATCH_SIZE < tickers.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("RESULTS");
  console.log("=".repeat(80));

  if (fundsWithSplits.length === 0) {
    console.log("✅ No funds with splits found.");
  } else {
    console.log(`\n📊 Found ${fundsWithSplits.length} fund(s) with splits:\n`);

    // Sort by split count (most splits first)
    fundsWithSplits.sort((a, b) => b.splitCount - a.splitCount);

    for (const fund of fundsWithSplits) {
      console.log(`${"=".repeat(80)}`);
      console.log(`TICKER: ${fund.ticker}`);
      console.log(`Total Splits: ${fund.splitCount}`);
      console.log(`Has Reverse Split: ${fund.hasReverseSplit ? "YES" : "NO"}`);
      console.log(`Has Forward Split: ${fund.hasForwardSplit ? "YES" : "NO"}`);
      console.log(`\nSplit Details:`);
      fund.splits.forEach((split, idx) => {
        console.log(
          `  ${idx + 1}. ${split.date}: ${split.type} (${split.splitFactor}x)`
        );
      });
      console.log();
    }

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total funds checked: ${tickers.length}`);
    console.log(`Funds with splits: ${fundsWithSplits.length}`);
    console.log(
      `Funds with reverse splits: ${fundsWithSplits.filter((f) => f.hasReverseSplit).length}`
    );
    console.log(
      `Funds with forward splits: ${fundsWithSplits.filter((f) => f.hasForwardSplit).length}`
    );

    // List tickers with splits (for easy copy-paste)
    console.log("\n📋 Tickers with splits (for verification):");
    console.log(fundsWithSplits.map((f) => f.ticker).join(", "));
  }

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} error(s) occurred:`);
    errors.forEach((e) => console.log(`  - ${e.ticker}: ${e.error}`));
  }

  console.log("\n" + "=".repeat(80));
}

main().catch(console.error);

