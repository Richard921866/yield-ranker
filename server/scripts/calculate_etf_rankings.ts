/**
 * Script to calculate and update CC ETF rankings
 * Uses the new calculateETFRankings function
 * 
 * Usage: npx tsx scripts/calculate_etf_rankings.ts
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../.env"),
];

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
    break;
  } catch (e) {
    // Continue
  }
}

import { createClient } from "@supabase/supabase-js";
import { calculateETFRankings } from "../src/routes/etfs.js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log("=".repeat(60));
  console.log("Calculating CC ETF Weighted Rankings");
  console.log("=".repeat(60));
  console.log("");

  try {
    const rankings = await calculateETFRankings();

    if (rankings.size === 0) {
      console.log("  ⚠ No rankings calculated");
      return;
    }

    console.log(`  ✓ Calculated rankings for ${rankings.size} CC ETFs`);
    console.log("");

    // Update database with rankings
    const updates: Array<{ ticker: string; rank: number }> = [];
    rankings.forEach((rank, ticker) => {
      updates.push({ ticker, rank });
    });

    // Batch update rankings
    let updated = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from("etf_static")
        .update({ weighted_rank: update.rank })
        .eq("ticker", update.ticker);

      if (error) {
        console.warn(`  ⚠ Failed to update rank for ${update.ticker}: ${error.message}`);
      } else {
        updated++;
      }
    }

    console.log(`  ✓ Updated ${updated}/${updates.length} ETF rankings in database`);
    console.log("");

    // Show top 10 and bottom 10
    const sorted = Array.from(rankings.entries()).sort((a, b) => a[1] - b[1]);
    console.log("  Top 10 CC ETFs (by rank):");
    sorted.slice(0, 10).forEach(([ticker, rank]) => {
      console.log(`    ${rank}. ${ticker}`);
    });
    if (sorted.length > 10) {
      console.log("");
      console.log("  Bottom 10 CC ETFs (by rank):");
      sorted.slice(-10).reverse().forEach(([ticker, rank]) => {
        console.log(`    ${rank}. ${ticker}`);
      });
    }
  } catch (error) {
    console.error(`  ❌ Error calculating ETF rankings: ${(error as Error).message}`);
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

