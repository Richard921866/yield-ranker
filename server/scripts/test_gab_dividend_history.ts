/**
 * Test GAB Dividend History Calculation
 * Expected result: 3+ 2- (since 2009-01-01)
 * 
 * This test verifies the Two-Payment Confirmation rule implementation
 * matches the Python script logic exactly.
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
import { calculateDividendHistory } from "../src/routes/cefs.js";

async function testGABDividendHistory() {
  const ticker = "GAB";
  const expectedResult = "3+ 2-";

  console.log("=".repeat(80));
  console.log(`Testing GAB Dividend History Calculation`);
  console.log("=".repeat(80));
  console.log(`Expected result: ${expectedResult}`);
  console.log(`Date range: 2009-01-01 to today`);
  console.log(`Using: UNADJUSTED dividends (div_cash) only\n`);

  try {
    // Get dividends from 2009-01-01 onwards
    const dividends = await getDividendHistory(ticker, "2009-01-01");
    
    if (!dividends || dividends.length === 0) {
      console.log(`❌ No dividends found for ${ticker} from 2009-01-01 onwards`);
      return;
    }

    console.log(`Total dividends fetched: ${dividends.length}`);
    
    // Show first few dividends
    console.log(`\nFirst 5 dividends (chronological):`);
    dividends
      .sort((a, b) => new Date(a.ex_date).getTime() - new Date(b.ex_date).getTime())
      .slice(0, 5)
      .forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.ex_date}: $${d.div_cash ?? "N/A"} (unadjusted)`);
      });

    // Calculate dividend history
    const result = calculateDividendHistory(dividends);

    console.log(`\n${"=".repeat(80)}`);
    console.log(`RESULT:`);
    console.log(`  Calculated: ${result}`);
    console.log(`  Expected:   ${expectedResult}`);
    console.log(`  Match:      ${result === expectedResult ? "✅ YES" : "❌ NO"}`);
    console.log(`${"=".repeat(80)}\n`);

    if (result !== expectedResult) {
      console.log(`⚠️  Result does not match expected value. Please verify the calculation logic.`);
    } else {
      console.log(`✅ Test passed! GAB shows ${result} as expected.`);
    }

  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    console.error(error);
  }
}

testGABDividendHistory().catch(console.error);

