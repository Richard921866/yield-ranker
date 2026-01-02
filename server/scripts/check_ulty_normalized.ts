/**
 * Check ULTY normalized dividend calculation for 3/5/2025
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
import { calculateNormalizedDividends } from "../src/services/dividendNormalization.js";

async function checkULTYNormalized() {
  console.log("\n=== Checking ULTY Normalized Dividend for 3/5/2025 ===\n");

  const db = getSupabase();

  // Get ULTY dividends around 3/5/2025
  const { data: dividends, error } = await db
    .from("dividends_detail")
    .select("*")
    .eq("ticker", "ULTY")
    .gte("ex_date", "2025-02-01")
    .lte("ex_date", "2025-04-30")
    .order("ex_date", { ascending: true });

  if (error) {
    console.error("Error fetching dividends:", error);
    return;
  }

  console.log(`Found ${dividends?.length || 0} dividends around 3/5/2025\n`);

  if (dividends && dividends.length > 0) {
    // Find the 3/5/2025 dividend
    const targetDiv = dividends.find(d => d.ex_date === "2025-03-05" || d.ex_date === "2025-03-06");
    
    if (targetDiv) {
      console.log("=== Target Dividend (3/5 or 3/6/2025) ===");
      console.log(`  Ex Date: ${targetDiv.ex_date}`);
      console.log(`  Adj Amount: $${targetDiv.adj_amount}`);
      console.log(`  Frequency Num: ${targetDiv.frequency_num}`);
      console.log(`  Payment Type: ${targetDiv.pmt_type}`);
      console.log(`  Annualized: ${targetDiv.annualized}`);
      console.log(`  Normalized Div: ${targetDiv.normalized_div}`);
      console.log(`  Days Since Prev: ${targetDiv.days_since_prev}`);
      
      // Calculate what it should be
      if (targetDiv.adj_amount && targetDiv.frequency_num) {
        const expectedAnnualized = targetDiv.adj_amount * targetDiv.frequency_num;
        const expectedNormalized = expectedAnnualized / 52;
        console.log("\n=== Expected Values ===");
        console.log("  Expected Annualized: $" + expectedAnnualized.toFixed(2));
        console.log("  Expected Normalized: $" + expectedNormalized.toFixed(9));
        
        if (targetDiv.frequency_num === 12) {
          console.log("  ✓ Frequency is 12 (Monthly) - Correct");
        } else {
          console.log("  ❌ Frequency is " + targetDiv.frequency_num + " - Should be 12 (Monthly)");
        }
        
        if (Math.abs((targetDiv.normalized_div || 0) - expectedNormalized) < 0.0001) {
          console.log("  ✓ Normalized value matches expected");
        } else {
          console.log("  ❌ Normalized value mismatch!");
          console.log("     Database: $" + targetDiv.normalized_div);
          console.log("     Expected: $" + expectedNormalized.toFixed(9));
        }
      }
    } else {
      console.log("❌ Could not find 3/5 or 3/6/2025 dividend");
    }

    // Show all dividends for context
    console.log("\n=== All Dividends in Range ===");
    for (const div of dividends) {
      console.log("  " + div.ex_date + ": $" + div.adj_amount + " | Freq: " + div.frequency_num + " | Type: " + div.pmt_type + " | Normalized: $" + div.normalized_div);
    }

    // Recalculate using the service
    console.log("\n=== Recalculating Using Service ===");
    const inputDividends = dividends.map(d => ({
      id: d.id,
      ticker: d.ticker,
      ex_date: d.ex_date,
      div_cash: d.div_cash,
      adj_amount: d.adj_amount,
    }));

    const recalculated = calculateNormalizedDividends(inputDividends);
    const recalcTarget = recalculated.find(r => {
      const matchingDiv = dividends.find(d => d.id === r.id);
      return matchingDiv && (matchingDiv.ex_date === "2025-03-05" || matchingDiv.ex_date === "2025-03-06");
    });

    if (recalcTarget) {
      console.log("  Recalculated Frequency: " + recalcTarget.frequency_num);
      console.log("  Recalculated Normalized: $" + recalcTarget.normalized_div);
      
      if (recalcTarget.frequency_num !== targetDiv?.frequency_num) {
        console.log("  ⚠️  Frequency mismatch! Database: " + targetDiv?.frequency_num + ", Recalculated: " + recalcTarget.frequency_num);
      }
      if (Math.abs((recalcTarget.normalized_div || 0) - (targetDiv?.normalized_div || 0)) > 0.0001) {
        console.log("  ⚠️  Normalized mismatch! Database: $" + targetDiv?.normalized_div + ", Recalculated: $" + recalcTarget.normalized_div);
      }
    }
  }

  process.exit(0);
}

checkULTYNormalized().catch(console.error);

