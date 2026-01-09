/**
 * Recalculate CEF homepage fields from the existing database (NO Tiingo calls).
 *
 * Updates (on etf_static):
 * - last_dividend (regular-only; uses regular_component for combined special rows)
 * - annual_dividend (run-rate = last_dividend × payments_per_year)
 * - forward_yield (annual_dividend / price)
 * - payments_per_year (detected from most recent regular-like dividend frequency_num)
 * - dividend volatility fields (SD/CV/DVI) from calculateMetrics()
 * - week_52_high / week_52_low (from existing prices)
 * - last_updated / updated_at timestamps
 *
 * Usage:
 *   npm run recalc:cef:home -- --ticker THW --ticker USA
 *   npm run recalc:cef:home -- --all
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { calculateMetrics } from "../src/services/metrics.js";
import { batchUpdateETFMetricsPreservingCEFFields } from "../src/services/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env similar to other scripts
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
];
for (const p of envPaths) {
  const r = dotenv.config({ path: p });
  if (!r.error && r.parsed && Object.keys(r.parsed).length > 0) {
    console.log(`✓ Loaded .env from: ${p}`);
    break;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseArgs() {
  const args = process.argv.slice(2);
  const tickers: string[] = [];
  let all = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ticker" && i + 1 < args.length) {
      tickers.push(String(args[i + 1]).toUpperCase());
      i++;
    } else if (args[i] === "--all") {
      all = true;
    }
  }
  return { tickers, all };
}

async function getAllCEFTickers(): Promise<string[]> {
  const { data, error } = await supabase
    .from("etf_static")
    .select("ticker, nav_symbol")
    .not("nav_symbol", "is", null)
    .neq("nav_symbol", "")
    .order("ticker");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((r: any) => r.ticker && r.nav_symbol && r.ticker !== r.nav_symbol)
    .map((r: any) => String(r.ticker).toUpperCase());
}

async function main() {
  const { tickers, all } = parseArgs();
  const targets = all ? await getAllCEFTickers() : tickers;
  if (!targets.length) {
    console.error("Usage: npm run recalc:cef:home -- --ticker SYMBOL [--ticker SYMBOL...] | --all");
    process.exit(1);
  }

  console.log(`Recalculating CEF homepage fields for ${targets.length} ticker(s)...`);
  const updates: Array<{ ticker: string; metrics: any }> = [];
  const now = new Date().toISOString();

  for (const t of targets) {
    try {
      const m = await calculateMetrics(t);
      updates.push({
        ticker: t,
        metrics: {
          last_dividend: m.lastDividend,
          annual_dividend: m.annualizedDividend,
          forward_yield: m.forwardYield,
          payments_per_year: m.paymentsPerYear,
          dividend_sd: m.dividendSD,
          dividend_cv: m.dividendCV,
          dividend_cv_percent: m.dividendCVPercent,
          dividend_volatility_index: m.dividendVolatilityIndex,
          week_52_high: m.week52High,
          week_52_low: m.week52Low,
          last_updated: now,
          updated_at: now,
        },
      });
      console.log(`✓ ${t}: last=${m.lastDividend ?? "N/A"} #=${m.paymentsPerYear} yearly=${m.annualizedDividend ?? "N/A"} yld=${m.forwardYield?.toFixed(2) ?? "N/A"}%`);
    } catch (e) {
      console.error(`✗ ${t}: ${(e as Error).message}`);
    }
  }

  console.log(`\nWriting ${updates.length} update(s) to etf_static...`);
  const updated = await batchUpdateETFMetricsPreservingCEFFields(updates);
  console.log(`✓ Updated ${updated} row(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


