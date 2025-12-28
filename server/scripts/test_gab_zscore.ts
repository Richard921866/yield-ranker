/**
 * Test GAB Z-Score calculation with 3-year lookback
 * 
 * CEO's expected Z-Score for GAB: 0.92
 * 
 * Calculation uses:
 * - 3-year maximum lookback (756 trading days)
 * - 1-year minimum threshold (252 trading days)
 * - Uses most recent 3 years of data for historical stats
 * 
 * Data source: Tiingo
 * - GAB market price
 * - XGABX NAV
 * - Use UNADJUSTED prices (close, not adj_close)
 */

import { getPriceHistory } from '../src/services/database.js';
import { formatDate } from '../src/utils/index.js';
import { calculateCEFZScore } from '../src/routes/cefs.js';

async function testGABZScore() {
  console.log('='.repeat(80));
  console.log('Testing GAB Z-Score Calculation');
  console.log('='.repeat(80));
  console.log('');
  
  const ticker = 'GAB';
  const navSymbol = 'XGABX';
  const endDate = formatDate(new Date());
  const DAYS_3Y = 3 * 252; // 756 trading days
  const DAYS_1Y = 1 * 252; // 252 trading days (minimum)
  const EXPECTED_ZSCORE = 0.92; // CEO's expected value
  
  console.log(`Ticker: ${ticker}`);
  console.log(`NAV Symbol: ${navSymbol}`);
  console.log(`Max Lookback: ${DAYS_3Y} trading days (3 years)`);
  console.log(`Min Threshold: ${DAYS_1Y} trading days (1 year)`);
  console.log(`Expected Z-Score: ${EXPECTED_ZSCORE}`);
  console.log('');
  
  try {
    // Fetch price data from database first (4 years to ensure 3-year coverage)
    console.log('Fetching price data from database...');
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 4);
    const startDateStr = formatDate(startDate);
    
    let [priceData, navData] = await Promise.all([
      getPriceHistory(ticker, startDateStr, endDate),
      getPriceHistory(navSymbol, startDateStr, endDate),
    ]);
    
    // Check if data is stale (older than 7 days) and fetch from API if needed
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const minDateStr = formatDate(sevenDaysAgo);
    
    const priceDataIsCurrent = priceData.length > 0 && priceData[priceData.length - 1].date >= minDateStr;
    const navDataIsCurrent = navData.length > 0 && navData[navData.length - 1].date >= minDateStr;
    
    if (!priceDataIsCurrent || priceData.length === 0) {
      console.log('Database data is stale for GAB, fetching from API...');
      try {
        const { getPriceHistoryFromAPI } = await import('../src/services/tiingo.js');
        const apiData = await getPriceHistoryFromAPI(ticker, startDateStr, endDate);
        if (apiData.length > 0) {
          priceData = apiData;
          console.log(`✓ Fetched ${priceData.length} fresh records from API for ${ticker}`);
        }
      } catch (apiError) {
        console.warn(`⚠ API fetch failed for ${ticker}: ${(apiError as Error).message}`);
      }
    }
    
    if (!navDataIsCurrent || navData.length === 0) {
      console.log('Database data is stale for XGABX, fetching from API...');
      try {
        const { getPriceHistoryFromAPI } = await import('../src/services/tiingo.js');
        const apiData = await getPriceHistoryFromAPI(navSymbol, startDateStr, endDate);
        if (apiData.length > 0) {
          navData = apiData;
          console.log(`✓ Fetched ${navData.length} fresh records from API for ${navSymbol}`);
        }
      } catch (apiError) {
        console.warn(`⚠ API fetch failed for ${navSymbol}: ${(apiError as Error).message}`);
      }
    }
    
    console.log(`GAB price records: ${priceData.length}`);
    console.log(`XGABX NAV records: ${navData.length}`);
    
    if (priceData.length > 0) {
      const sortedPriceData = [...priceData].sort((a, b) => a.date.localeCompare(b.date));
      console.log(`GAB date range: ${sortedPriceData[0].date} to ${sortedPriceData[sortedPriceData.length - 1].date}`);
    }
    if (navData.length > 0) {
      const sortedNavData = [...navData].sort((a, b) => a.date.localeCompare(b.date));
      console.log(`XGABX date range: ${sortedNavData[0].date} to ${sortedNavData[sortedNavData.length - 1].date}`);
    }
    console.log('');
    
    // Create maps using UNADJUSTED prices (p.close)
    const priceMap = new Map<string, number>();
    priceData.forEach((p: any) => {
      const price = p.close ?? null;
      if (price !== null && price > 0) {
        priceMap.set(p.date, price);
      }
    });
    
    const navMap = new Map<string, number>();
    navData.forEach((p: any) => {
      const nav = p.close ?? null;
      if (nav !== null && nav > 0) {
        navMap.set(p.date, nav);
      }
    });
    
    // Calculate daily premium/discount: (Price / NAV) - 1
    const discounts: number[] = [];
    const allDates = new Set([...priceMap.keys(), ...navMap.keys()]);
    const sortedDates = Array.from(allDates).sort();
    
    for (const date of sortedDates) {
      const price = priceMap.get(date);
      const nav = navMap.get(date);
      if (price && nav && nav > 0) {
        const discount = (price / nav - 1.0); // Keep as decimal for calculation
        discounts.push(discount);
      }
    }
    
    console.log(`Total days with both price and NAV: ${discounts.length}`);
    
    // Check minimum threshold
    if (discounts.length < DAYS_1Y) {
      console.log(`ERROR: Insufficient data (${discounts.length} < ${DAYS_1Y} days)`);
      return;
    }
    
    // Use up to 3 years (most recent)
    const lookbackPeriod = Math.min(discounts.length, DAYS_3Y);
    const history = discounts.slice(-lookbackPeriod);
    
    console.log(`Using last ${lookbackPeriod} days (most recent 3 years)`);
    console.log('');
    
    // Calculate current P/D (most recent date) - keep as decimal
    const sortedDatesArray = Array.from(sortedDates).sort().reverse();
    let currentDiscount: number | null = null;
    let currentDate: string | null = null;
    for (const date of sortedDatesArray) {
      const price = priceMap.get(date);
      const nav = navMap.get(date);
      if (price && nav && nav > 0) {
        currentDiscount = (price / nav - 1.0); // Keep as decimal
        currentDate = date;
        break;
      }
    }
    
    // Fallback to last value in history if needed
    if (currentDiscount === null) {
      currentDiscount = history[history.length - 1];
    }
    
    console.log(`Current Date: ${currentDate}`);
    console.log(`Current P/D (decimal): ${currentDiscount?.toFixed(8)}`);
    console.log(`Current P/D (%): ${((currentDiscount ?? 0) * 100).toFixed(8)}%`);
    console.log('');
    
    // Calculate average (mean)
    const avgDiscount = history.reduce((sum, d) => sum + d, 0) / history.length;
    console.log(`Average P/D (decimal, 3 years): ${avgDiscount.toFixed(8)}`);
    console.log(`Average P/D (%): ${(avgDiscount * 100).toFixed(8)}%`);
    
    // Calculate variance using POPULATION standard deviation (divide by n, not n-1)
    const variance = history.reduce((sum, d) => sum + Math.pow(d - avgDiscount, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);
    console.log(`STDEV.P (decimal): ${stdDev.toFixed(8)}`);
    console.log(`STDEV.P (%): ${(stdDev * 100).toFixed(8)}%`);
    console.log('');
    
    // Calculate Z-Score
    if (currentDiscount !== null && stdDev > 0) {
      const zScore = (currentDiscount - avgDiscount) / stdDev;
      console.log('Z-Score Calculation:');
      console.log(`  Z = (Current - Average) / StdDev`);
      console.log(`  Z = (${currentDiscount.toFixed(8)} - ${avgDiscount.toFixed(8)}) / ${stdDev.toFixed(8)}`);
      console.log(`  Z = ${(currentDiscount - avgDiscount).toFixed(8)} / ${stdDev.toFixed(8)}`);
      console.log(`  Z = ${zScore.toFixed(8)}`);
      console.log('');
      
      // Compare with CEO's expected Z-Score
      console.log('Comparison with CEO\'s Expected Z-Score:');
      console.log(`  Expected: ${EXPECTED_ZSCORE.toFixed(8)}`);
      console.log(`  Actual:   ${zScore.toFixed(8)}`);
      console.log(`  Diff:     ${Math.abs(zScore - EXPECTED_ZSCORE).toFixed(8)}`);
      console.log(`  Match:    ${Math.abs(zScore - EXPECTED_ZSCORE) < 0.1 ? '✅ YES' : '❌ NO'}`);
      console.log('');
      
      // Show first and last dates in history
      console.log('3-year history range:');
      const dateDiscountPairs: Array<{ date: string; discount: number }> = [];
      for (const date of sortedDates) {
        const price = priceMap.get(date);
        const nav = navMap.get(date);
        if (price && nav && nav > 0) {
          const discount = (price / nav - 1.0);
          dateDiscountPairs.push({ date, discount });
        }
      }
      dateDiscountPairs.sort((a, b) => a.date.localeCompare(b.date));
      const last3Years = dateDiscountPairs.slice(-lookbackPeriod);
      
      if (last3Years.length > 0) {
        console.log(`  First date: ${last3Years[0].date}, P/D: ${(last3Years[0].discount * 100).toFixed(8)}%`);
        console.log(`  Last date:  ${last3Years[last3Years.length - 1].date}, P/D: ${(last3Years[last3Years.length - 1].discount * 100).toFixed(8)}%`);
        console.log(`  Total days: ${last3Years.length}`);
      }
      
      // Test the actual calculateCEFZScore function
      console.log('');
      console.log('='.repeat(80));
      console.log('Testing calculateCEFZScore Function');
      console.log('='.repeat(80));
      console.log('');
      
      const functionZScore = await calculateCEFZScore(ticker, navSymbol);
      if (functionZScore !== null) {
        console.log(`Function Z-Score: ${functionZScore.toFixed(8)}`);
        console.log(`Manual Z-Score:   ${zScore.toFixed(8)}`);
        console.log(`Difference:       ${Math.abs(functionZScore - zScore).toFixed(8)}`);
        console.log(`Match:            ${Math.abs(functionZScore - zScore) < 0.0001 ? '✅ YES' : '❌ NO'}`);
        console.log('');
        console.log(`Expected Z-Score: ${EXPECTED_ZSCORE.toFixed(8)}`);
        console.log(`Function Result:  ${functionZScore.toFixed(8)}`);
        console.log(`Difference:       ${Math.abs(functionZScore - EXPECTED_ZSCORE).toFixed(8)}`);
        console.log(`CEO Expected Match: ${Math.abs(functionZScore - EXPECTED_ZSCORE) < 0.1 ? '✅ YES' : '❌ NO'}`);
      } else {
        console.log('Function returned null');
      }
      
    } else {
      console.log('ERROR: Could not calculate Z-Score');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testGABZScore().catch(console.error);

