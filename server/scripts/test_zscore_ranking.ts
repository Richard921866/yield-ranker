/**
 * Test Z-Score Ranking
 * Shows exactly how Z-scores are sorted and ranked
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CEFData {
  ticker: string;
  zScore: number | null;
}

async function fetchCEFData(): Promise<CEFData[]> {
  const { data: cefs, error } = await supabase
    .from("etf_static")
    .select("ticker, five_year_z_score")
    .eq("category", "CEF")
    .order("ticker", { ascending: true });

  if (error) {
    console.error("❌ Error fetching CEFs:", error);
    process.exit(1);
  }

  const cefData: CEFData[] = (cefs || []).map((cef: any) => ({
    ticker: cef.ticker,
    zScore: cef.five_year_z_score ?? null,
  }));

  return cefData.filter(
    (c) => c.zScore !== null && !isNaN(c.zScore)
  );
}

function testZScoreRanking(cefData: CEFData[]) {
  console.log("=".repeat(100));
  console.log("Z-SCORE RANKING TEST - SORTED FROM LOW TO HIGH");
  console.log("=".repeat(100));
  console.log();

  // Sort Z-scores from lowest (most negative) to highest
  const zScoreSorted = [...cefData]
    .filter((c) => c.zScore !== null && !isNaN(c.zScore))
    .sort((a, b) => (a.zScore ?? 0) - (b.zScore ?? 0));

  console.log("SORTED Z-SCORES (Low to High):");
  console.log("-".repeat(100));
  console.log("TICKER".padEnd(10) + "Z-SCORE".padEnd(15) + "RANK");
  console.log("-".repeat(100));

  // Assign ranks with tie-breaking
  let currentRank = 1;
  zScoreSorted.forEach((cef, index) => {
    // If this Z-score is different from previous, update rank
    if (index > 0) {
      const prevZScore = zScoreSorted[index - 1].zScore ?? 0;
      const currentZScore = cef.zScore ?? 0;
      // Only increment rank if Z-scores are different (accounting for floating point precision)
      if (Math.abs(prevZScore - currentZScore) > 0.0001) {
        currentRank = index + 1;
      }
    }
    
    const zScoreStr = cef.zScore! >= 0 
      ? cef.zScore!.toFixed(2) 
      : `(${Math.abs(cef.zScore!).toFixed(2)})`;
    
    console.log(
      cef.ticker.padEnd(10) + 
      zScoreStr.padEnd(15) + 
      currentRank.toString()
    );
  });

  console.log();
  console.log("=".repeat(100));
  console.log("EXPLANATION:");
  console.log("1. Z-scores are sorted from LOWEST (most negative) to HIGHEST");
  console.log("2. Lower Z-score = Better rank (rank 1 = best)");
  console.log("3. CEFs with SAME Z-score get SAME rank");
  console.log("4. Next rank SKIPS numbers when there are ties");
  console.log("=".repeat(100));
}

async function main() {
  try {
    const cefData = await fetchCEFData();
    testZScoreRanking(cefData);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();

