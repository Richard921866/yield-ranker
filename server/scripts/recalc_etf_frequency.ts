/**
 * Recalculate ETF/CCETF normalized dividend fields from existing DB data (NO Tiingo calls).
 *
 * Updates (on dividends_detail):
 * - days_since_prev
 * - pmt_type
 * - frequency (string)
 * - frequency_num
 * - annualized
 * - normalized_div
 *
 * Usage:
 *   npx tsx scripts/recalc_etf_frequency.ts --ticker ABNY --ticker CVNY
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { calculateNormalizedDividends } from "../src/services/dividendNormalization.js";

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
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--ticker" && args[i + 1]) {
      tickers.push(String(args[i + 1]).toUpperCase());
      i++;
    }
  }
  return { tickers };
}

function freqNumToStr(freqNum: number | null | undefined): string | null {
  if (!freqNum) return null;
  if (freqNum === 52) return "Weekly";
  if (freqNum === 12) return "Monthly";
  if (freqNum === 4) return "Quarterly";
  if (freqNum === 2) return "Semi-Annual";
  if (freqNum === 1) return "Annual";
  return null;
}

async function main() {
  const { tickers } = parseArgs();
  if (!tickers.length) {
    console.error("Usage: npx tsx scripts/recalc_etf_frequency.ts --ticker SYMBOL [--ticker SYMBOL...]");
    process.exit(1);
  }

  for (const t of tickers) {
    const { data: divs, error } = await supabase
      .from("dividends_detail")
      .select("id,ticker,ex_date,adj_amount,div_cash")
      .eq("ticker", t)
      .order("ex_date", { ascending: true });

    if (error) throw new Error(`[${t}] dividends_detail fetch failed: ${error.message}`);
    if (!divs || divs.length === 0) {
      console.log(`- ${t}: no dividends found`);
      continue;
    }

    const normalized = calculateNormalizedDividends(
      divs.map((d) => ({
        id: d.id,
        ticker: d.ticker,
        ex_date: d.ex_date,
        div_cash: Number(d.div_cash),
        adj_amount: d.adj_amount !== null && d.adj_amount !== undefined ? Number(d.adj_amount) : null,
      }))
    );

    // Batch update
    const BATCH_SIZE = 200;
    for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
      const batch = normalized.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (n) => {
          const frequencyStr = n.pmt_type === "Special" ? "Special" : freqNumToStr(n.frequency_num);
          const { error: updErr } = await supabase
            .from("dividends_detail")
            .update({
              days_since_prev: n.days_since_prev,
              pmt_type: n.pmt_type,
              frequency: frequencyStr,
              frequency_num: n.frequency_num,
              annualized: n.annualized,
              normalized_div: n.normalized_div,
            })
            .eq("id", n.id);
          if (updErr) throw new Error(`[${t}] update failed for id=${n.id}: ${updErr.message}`);
        })
      );
    }

    console.log(`✓ ${t}: updated ${normalized.length} dividend rows`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


