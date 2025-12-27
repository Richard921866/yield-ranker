/**
 * Verify adjusted dividend calculation for YieldMax funds with reverse splits
 * 
 * Based on the December 2025 reverse splits:
 * - 1-for-10 splits (splitFactor = 0.1): MRNY, ULTY, FIAT, AIYY, CRSH, DIPS, CONY
 * - 1-for-5 splits (splitFactor = 0.2): TSLY, XYZY, YBIT, OARK, ABNY, AMDY, MSTY
 * 
 * Expected behavior:
 * - For dividends BEFORE the split: adjusted = raw / splitFactor
 * - For dividends AFTER the split: adjusted = raw (no adjustment needed)
 * 
 * Example: CONY with 1-for-10 split on Dec 2, 2025
 * - Dividend on 11/26/25: raw = 0.0594, adjusted = 0.0594 / 0.1 = 0.594
 * - Dividend on 12/5/25: raw = 0.05, adjusted = 0.05 (split already happened)
 */

import { fetchDividendHistory } from '../src/services/tiingo.js';
import { formatDate } from '../src/utils/index.js';

const YIELDMAX_SPLITS = [
  { ticker: 'MRNY', ratio: '1-for-10', splitFactor: 0.1, date: '2025-12-01' },
  { ticker: 'ULTY', ratio: '1-for-10', splitFactor: 0.1, date: '2025-12-01' },
  { ticker: 'TSLY', ratio: '1-for-5', splitFactor: 0.2, date: '2025-12-01' },
  { ticker: 'XYZY', ratio: '1-for-5', splitFactor: 0.2, date: '2025-12-01' },
  { ticker: 'YBIT', ratio: '1-for-5', splitFactor: 0.2, date: '2025-12-01' },
  { ticker: 'FIAT', ratio: '1-for-10', splitFactor: 0.1, date: '2025-12-02' },
  { ticker: 'AIYY', ratio: '1-for-10', splitFactor: 0.1, date: '2025-12-02' },
  { ticker: 'CRSH', ratio: '1-for-10', splitFactor: 0.1, date: '2025-12-02' },
  { ticker: 'DIPS', ratio: '1-for-10', splitFactor: 0.1, date: '2025-12-02' },
  { ticker: 'CONY', ratio: '1-for-10', splitFactor: 0.1, date: '2025-12-02' },
  { ticker: 'OARK', ratio: '1-for-5', splitFactor: 0.2, date: '2025-12-02' },
  { ticker: 'ABNY', ratio: '1-for-5', splitFactor: 0.2, date: '2025-12-02' },
  { ticker: 'AMDY', ratio: '1-for-5', splitFactor: 0.2, date: '2025-12-08' },
  { ticker: 'MSTY', ratio: '1-for-5', splitFactor: 0.2, date: '2025-12-08' },
];

async function verifyTicker(ticker: string, expectedSplitFactor: number, splitDate: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Verifying ${ticker} (${expectedSplitFactor === 0.1 ? '1-for-10' : '1-for-5'} split on ${splitDate})`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    // Fetch dividends from 90 days before split to 30 days after
    const splitDateObj = new Date(splitDate);
    const startDate = new Date(splitDateObj);
    startDate.setDate(startDate.getDate() - 90);
    const endDate = new Date(splitDateObj);
    endDate.setDate(endDate.getDate() + 30);
    
    const dividends = await fetchDividendHistory(
      ticker,
      formatDate(startDate),
      formatDate(endDate)
    );
    
    if (dividends.length === 0) {
      console.log(`❌ No dividends found for ${ticker}`);
      return;
    }
    
    console.log(`\nFound ${dividends.length} dividend(s) near split date:`);
    console.log(`\nDate        | Raw Div   | Adj Div   | Expected Adj | Status`);
    console.log(`${'-'.repeat(80)}`);
    
    let allCorrect = true;
    const splitDateObj2 = new Date(splitDate);
    
    for (const div of dividends) {
      const divDate = new Date(div.date);
      const isBeforeSplit = divDate < splitDateObj2;
      
      // Expected adjusted dividend
      // If dividend is BEFORE split: adjusted = raw / splitFactor
      // If dividend is AFTER split: adjusted = raw (no adjustment)
      const expectedAdj = isBeforeSplit 
        ? div.dividend / expectedSplitFactor
        : div.dividend;
      
      const isCorrect = Math.abs(div.adjDividend - expectedAdj) < 0.0001;
      const status = isCorrect ? '✓' : '❌';
      
      if (!isCorrect) allCorrect = false;
      
      console.log(
        `${div.date} | ${div.dividend.toFixed(6).padStart(9)} | ${div.adjDividend.toFixed(6).padStart(9)} | ${expectedAdj.toFixed(6).padStart(12)} | ${status}`
      );
      
      if (!isCorrect) {
        console.log(`  ⚠️  Mismatch! Expected ${expectedAdj.toFixed(6)}, got ${div.adjDividend.toFixed(6)}`);
      }
    }
    
    if (allCorrect) {
      console.log(`\n✅ All dividends calculated correctly for ${ticker}`);
    } else {
      console.log(`\n❌ Some dividends calculated incorrectly for ${ticker}`);
    }
    
  } catch (error) {
    console.error(`Error verifying ${ticker}:`, error);
  }
}

async function main() {
  console.log('Verifying YieldMax Reverse Split Adjustments');
  console.log('='.repeat(80));
  console.log('\nKey Formula: adjusted = raw / splitFactor (for dividends BEFORE split)');
  console.log('Expected split factors:');
  console.log('  - 1-for-10 splits: splitFactor = 0.1');
  console.log('  - 1-for-5 splits: splitFactor = 0.2');
  
  // Test a few key tickers first
  const testTickers = ['CONY', 'TSLY', 'ULTY', 'MRNY'];
  
  for (const splitInfo of YIELDMAX_SPLITS) {
    if (testTickers.includes(splitInfo.ticker)) {
      await verifyTicker(splitInfo.ticker, splitInfo.splitFactor, splitInfo.date);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('Verification complete');
}

main().catch(console.error);

