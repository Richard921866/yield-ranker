/**
 * Test script to verify CEF metrics calculations (Z-Score, NAV Trends)
 * Run with: npx tsx server/scripts/test_cef_metrics.ts
 */

import { getSupabase } from '../src/services/database.js';
import { calculateCEFZScore, calculateNAVTrend6M, calculateNAVReturn12M } from '../src/routes/cefs.js';
import { logger } from '../src/utils/index.js';

async function testCEFMetrics() {
  const supabase = getSupabase();
  const tickersToTest = ['DNP', 'IGR', 'CSQ', 'FOF', 'PCN']; // Same CEFs as returns test

  console.log('\n=== Testing CEF Metrics (Z-Score, NAV Trends) ===\n');

  for (const ticker of tickersToTest) {
    console.log(`\n--- ${ticker} ---`);

    const { data: cef, error } = await supabase
      .from('etf_static')
      .select('*')
      .eq('ticker', ticker)
      .maybeSingle();

    if (error || !cef) {
      console.error(`Error fetching CEF ${ticker}: ${error?.message}`);
      continue;
    }

    const navSymbol = cef.nav_symbol || ticker; // Use ticker as fallback for NAV symbol
    console.log(`NAV Symbol: ${navSymbol}`);

    // 1. Get database values
    const dbValues = {
      fiveYearZScore: cef.five_year_z_score,
      navTrend6M: cef.nav_trend_6m,
      navTrend12M: cef.nav_trend_12m,
    };
    console.log('\nDatabase Values:');
    console.log(`  5Y Z-Score: ${dbValues.fiveYearZScore ?? 'NULL'}`);
    console.log(`  6M NAV Trend: ${dbValues.navTrend6M ?? 'NULL'}`);
    console.log(`  12M NAV Trend: ${dbValues.navTrend12M ?? 'NULL'}`);

    // 2. Calculate metrics
    console.log('\nCalculating metrics...');
    
    let calculatedZScore: number | null = null;
    let calculatedNavTrend6M: number | null = null;
    let calculatedNavTrend12M: number | null = null;

    try {
      calculatedZScore = await calculateCEFZScore(ticker, navSymbol);
      console.log(`  ✅ 5Y Z-Score: ${calculatedZScore !== null ? calculatedZScore.toFixed(4) : 'NULL'}`);
    } catch (e) {
      console.error(`  ❌ Failed to calculate Z-Score: ${e}`);
    }

    try {
      calculatedNavTrend6M = await calculateNAVTrend6M(navSymbol);
      console.log(`  ✅ 6M NAV Trend: ${calculatedNavTrend6M !== null ? `${calculatedNavTrend6M.toFixed(2)}%` : 'NULL'}`);
    } catch (e) {
      console.error(`  ❌ Failed to calculate 6M NAV Trend: ${e}`);
    }

    try {
      calculatedNavTrend12M = await calculateNAVReturn12M(navSymbol);
      console.log(`  ✅ 12M NAV Trend: ${calculatedNavTrend12M !== null ? `${calculatedNavTrend12M.toFixed(2)}%` : 'NULL'}`);
    } catch (e) {
      console.error(`  ❌ Failed to calculate 12M NAV Trend: ${e}`);
    }

    // 3. Show what API would return (DB first, then calculated)
    console.log('\n✅ API Would Return (DB -> Calculated):');
    const finalZScore = dbValues.fiveYearZScore ?? calculatedZScore;
    const finalNavTrend6M = dbValues.navTrend6M ?? calculatedNavTrend6M;
    const finalNavTrend12M = dbValues.navTrend12M ?? calculatedNavTrend12M;
    
    console.log(`  5Y Z-Score: ${finalZScore !== null ? finalZScore.toFixed(4) : 'NULL'} ${calculatedZScore ? '✅' : '❌'}`);
    console.log(`  6M NAV Trend: ${finalNavTrend6M !== null ? `${finalNavTrend6M.toFixed(2)}%` : 'NULL'} ${calculatedNavTrend6M ? '✅' : '❌'}`);
    console.log(`  12M NAV Trend: ${finalNavTrend12M !== null ? `${finalNavTrend12M.toFixed(2)}%` : 'NULL'} ${calculatedNavTrend12M ? '✅' : '❌'}`);
  }

  console.log('\n=== Test Complete ===\n');
}

testCEFMetrics().catch(console.error);
