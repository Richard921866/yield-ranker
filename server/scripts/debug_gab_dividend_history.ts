/**
 * Debug GAB Dividend History Calculation
 * Shows step-by-step calculation to match expected 3+ 2-
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
];

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
    break;
  } catch (e) {
    // Continue
  }
}

import { getDividendHistory } from "../src/services/database.js";
import type { DividendRecord } from "../src/types/index.js";

function debugDividendHistory(dividends: DividendRecord[]): void {
  if (!dividends || dividends.length < 2) {
    console.log("Not enough dividends");
    return;
  }

  // Step 1: Filter to regular dividends only
  const regularDivs = dividends
    .filter((d) => {
      if (!d.div_type) return true;
      const dtype = d.div_type.toLowerCase();
      return (
        dtype.includes("regular") ||
        dtype === "cash" ||
        dtype === "" ||
        !dtype.includes("special")
      );
    })
    .sort((a, b) => {
      const aManual = a.is_manual === true ? 1 : 0;
      const bManual = b.is_manual === true ? 1 : 0;
      if (aManual !== bManual) {
        return bManual - aManual;
      }
      return new Date(b.ex_date).getTime() - new Date(a.ex_date).getTime();
    });

  // Step 2: Sort to chronological order (oldest first)
  const chronological = [...regularDivs].reverse();

  // Step 3: Filter to only dividends from 2009-01-01 onwards
  const cutoffDate = new Date("2009-01-01");
  const filteredChronological = chronological.filter((d) => {
    const exDate = new Date(d.ex_date);
    return exDate >= cutoffDate;
  });

  console.log(`\n${"=".repeat(80)}`);
  console.log(`GAB DIVIDEND HISTORY DEBUG`);
  console.log(`${"=".repeat(80)}`);
  console.log(`Total dividends from 2009-01-01: ${filteredChronological.length}\n`);

  // Step 4: Two-Payment Confirmation rule with base tracking
  let base = 0.20; // Initial base
  const threshold = 0.011;
  let increases = 0;
  let decreases = 0;

  console.log(`Initial base: $${base.toFixed(3)}`);
  console.log(`Threshold: $${threshold.toFixed(3)}\n`);
  console.log(`Processing pairs:\n`);

  // Show first 20 pairs
  for (let i = 0; i < Math.min(filteredChronological.length - 1, 20); i++) {
    const p1Record = filteredChronological[i];
    const p2Record = filteredChronological[i + 1];

    const p1 = Math.round((p1Record.div_cash ?? 0) * 1000) / 1000;
    const p2 = Math.round((p2Record.div_cash ?? 0) * 1000) / 1000;

    if (!p1 || !p2 || p1 <= 0 || p2 <= 0) {
      continue;
    }

    const p1Date = new Date(p1Record.ex_date).toISOString().split('T')[0];
    const p2Date = new Date(p2Record.ex_date).toISOString().split('T')[0];

    const wasBase = base;
    let action = "";

    // INCREASE LOGIC
    if (p1 > (base + threshold) && p2 > base) {
      increases++;
      base = p1;
      action = `✓ INCREASE #${increases}: base $${wasBase.toFixed(3)} → $${base.toFixed(3)}`;
    }
    // DECREASE LOGIC
    else if (p1 < base && p2 < base) {
      decreases++;
      base = p1;
      action = `✓ DECREASE #${decreases}: base $${wasBase.toFixed(3)} → $${base.toFixed(3)}`;
    } else {
      action = `  IGNORE (p1=${p1.toFixed(3)}, p2=${p2.toFixed(3)}, base=${base.toFixed(3)})`;
    }

    console.log(`${i + 1}. ${p1Date} ($${p1.toFixed(3)}) / ${p2Date} ($${p2.toFixed(3)}) | Base: $${wasBase.toFixed(3)} → $${base.toFixed(3)} | ${action}`);
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`RESULT: ${increases}+ ${decreases}-`);
  console.log(`Expected: 3+ 2-`);
  console.log(`Match: ${increases === 3 && decreases === 2 ? "✅ YES" : "❌ NO"}`);
  console.log(`${"=".repeat(80)}\n`);
}

async function main() {
  const ticker = "GAB";

  try {
    const dividends = await getDividendHistory(ticker, "2009-01-01");
    
    if (!dividends || dividends.length === 0) {
      console.log(`❌ No dividends found for ${ticker}`);
      return;
    }

    debugDividendHistory(dividends);
    
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    console.error(error);
  }
}

main().catch(console.error);

