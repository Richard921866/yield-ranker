/**
 * Debug Script: Dividend History Calculation for ALL CEFs
 * 
 * This script runs the dividend history calculation for all CEFs
 * and outputs the results to a file for review.
 * 
 * Usage:
 *   npx tsx server/scripts/debug_all_dividend_history.ts
 */

import { getDividendHistory } from '../src/services/database.js';
import { getSupabase } from '../src/services/database.js';
import type { DividendRecord } from '../src/types/index.js';

function calculateDividendHistory(dividends: DividendRecord[]): { result: string; increases: number; decreases: number } {
  if (!dividends || dividends.length < 2) {
    return {
      result: dividends.length === 1 ? "1 DIV+" : "0+ 0-",
      increases: dividends.length === 1 ? 1 : 0,
      decreases: 0
    };
  }

  const regularDivs = dividends.filter((d) => {
    if (!d.div_type) return true;
    const dtype = d.div_type.toLowerCase();
    return (
      dtype.includes("regular") ||
      dtype === "cash" ||
      dtype === "" ||
      !dtype.includes("special")
    );
  });

  if (regularDivs.length < 2) {
    return {
      result: regularDivs.length === 1 ? "1 DIV+" : "0+ 0-",
      increases: regularDivs.length === 1 ? 1 : 0,
      decreases: 0
    };
  }

  const sorted = [...regularDivs].sort((a, b) => {
    const aManual = a.is_manual === true ? 1 : 0;
    const bManual = b.is_manual === true ? 1 : 0;
    if (aManual !== bManual) {
      return bManual - aManual;
    }
    const aDate = a.ex_date instanceof Date ? a.ex_date : new Date(a.ex_date);
    const bDate = b.ex_date instanceof Date ? b.ex_date : new Date(b.ex_date);
    return bDate.getTime() - aDate.getTime();
  });

  const chronological = [...sorted].reverse();

  let increases = 0;
  let decreases = 0;

  for (let i = 1; i < chronological.length; i++) {
    const current = chronological[i];
    const previous = chronological[i - 1];

    const currentAmount = current.adj_amount ?? current.div_cash;
    const previousAmount = previous.adj_amount ?? previous.div_cash;

    if (currentAmount > previousAmount) {
      increases++;
    } else if (currentAmount < previousAmount) {
      decreases++;
    }
  }

  return {
    result: `${increases}+ ${decreases}-`,
    increases,
    decreases
  };
}

async function getAllCEFTickers(): Promise<string[]> {
  const db = getSupabase();
  
  // Get all records with nav_symbol set
  const { data, error } = await db
    .from('etf_static')
    .select('ticker, nav_symbol, nav')
    .not('nav_symbol', 'is', null)
    .neq('nav_symbol', '');

  if (error) {
    throw new Error(`Failed to fetch CEF tickers: ${error.message}`);
  }

  // Filter out NAV symbol records (where ticker === nav_symbol)
  // These are placeholder records, not actual CEFs
  const actualCEFs = (data || []).filter((row: any) => {
    return row.ticker !== row.nav_symbol && row.nav !== null && row.nav !== undefined;
  });

  return actualCEFs.map((row: any) => row.ticker);
}

function calculateDividendHistoryDetailed(dividends: DividendRecord[]): any {
  const details: any = {
    totalDividends: dividends.length,
    step1_filtering: {
      description: "Step 1: Filter to regular dividends only (exclude special dividends)",
      allDividends: dividends.map(d => {
        const exDate = d.ex_date instanceof Date 
          ? d.ex_date.toISOString().split('T')[0]
          : new Date(d.ex_date).toISOString().split('T')[0];
        const isRegular = !d.div_type || 
                         d.div_type.toLowerCase().includes('regular') ||
                         d.div_type.toLowerCase() === 'cash' ||
                         d.div_type === '' ||
                         !d.div_type.toLowerCase().includes('special');
        return {
          exDate,
          divCash: Number(d.div_cash),
          adjAmount: d.adj_amount !== null ? Number(d.adj_amount) : null,
          divType: d.div_type || 'null',
          isRegular
        };
      }),
      regularDividends: [] as any[],
      excludedDividends: [] as any[]
    },
    step2_sorting: {
      description: "Step 2: Sort by date (newest first), with manual entries prioritized",
      sortedDividends: [] as any[]
    },
    step3_chronological: {
      description: "Step 3: Reverse to chronological order (oldest first)",
      chronologicalDividends: [] as any[]
    },
    step4_comparisons: {
      description: "Step 4: Compare each dividend to previous one using formula:",
      formula: "currentAmount = current.adj_amount ?? current.div_cash",
      formula2: "previousAmount = previous.adj_amount ?? previous.div_cash",
      formula3: "if (currentAmount > previousAmount) → INCREASE (+)",
      formula4: "if (currentAmount < previousAmount) → DECREASE (-)",
      comparisons: [] as any[],
      increases: 0,
      decreases: 0,
      noChange: 0
    },
    finalResult: ""
  };

  if (!dividends || dividends.length < 2) {
    const result = dividends.length === 1 ? "1 DIV+" : "0+ 0-";
    details.finalResult = result;
    return { result, details };
  }

  // Step 1: Filter to regular dividends
  const regularDivs = dividends.filter((d) => {
    const isRegular = !d.div_type || 
                     d.div_type.toLowerCase().includes('regular') ||
                     d.div_type.toLowerCase() === 'cash' ||
                     d.div_type === '' ||
                     !d.div_type.toLowerCase().includes('special');
    
    const exDate = d.ex_date instanceof Date 
      ? d.ex_date.toISOString().split('T')[0]
      : new Date(d.ex_date).toISOString().split('T')[0];
    
    if (isRegular) {
      details.step1_filtering.regularDividends.push({
        exDate,
        divCash: Number(d.div_cash),
        adjAmount: d.adj_amount !== null ? Number(d.adj_amount) : null,
        divType: d.div_type || 'null'
      });
    } else {
      details.step1_filtering.excludedDividends.push({
        exDate,
        divCash: Number(d.div_cash),
        adjAmount: d.adj_amount !== null ? Number(d.adj_amount) : null,
        divType: d.div_type || 'null',
        reason: 'Special dividend - excluded'
      });
    }
    
    return isRegular;
  });

  if (regularDivs.length < 2) {
    const result = regularDivs.length === 1 ? "1 DIV+" : "0+ 0-";
    details.finalResult = result;
    return { result, details };
  }

  // Step 2: Sort by date (newest first), manual entries prioritized
  const sorted = [...regularDivs].sort((a, b) => {
    const aManual = a.is_manual === true ? 1 : 0;
    const bManual = b.is_manual === true ? 1 : 0;
    if (aManual !== bManual) {
      return bManual - aManual;
    }
    const aDate = a.ex_date instanceof Date ? a.ex_date : new Date(a.ex_date);
    const bDate = b.ex_date instanceof Date ? b.ex_date : new Date(b.ex_date);
    return bDate.getTime() - aDate.getTime();
  });

  details.step2_sorting.sortedDividends = sorted.map(d => {
    const exDate = d.ex_date instanceof Date 
      ? d.ex_date.toISOString().split('T')[0]
      : new Date(d.ex_date).toISOString().split('T')[0];
    const dateTime = d.ex_date instanceof Date 
      ? d.ex_date.getTime()
      : new Date(d.ex_date).getTime();
    return {
      exDate,
      divCash: Number(d.div_cash),
      adjAmount: d.adj_amount !== null ? Number(d.adj_amount) : null,
      isManual: d.is_manual || false,
      sortKey: `${d.is_manual ? '1' : '0'}_${dateTime}`
    };
  });

  // Step 3: Reverse to chronological order (oldest first)
  const chronological = [...sorted].reverse();

  details.step3_chronological.chronologicalDividends = chronological.map(d => {
    const exDate = d.ex_date instanceof Date 
      ? d.ex_date.toISOString().split('T')[0]
      : new Date(d.ex_date).toISOString().split('T')[0];
    return {
      exDate,
      divCash: Number(d.div_cash),
      adjAmount: d.adj_amount !== null ? Number(d.adj_amount) : null,
      amountUsed: d.adj_amount !== null ? Number(d.adj_amount) : Number(d.div_cash)
    };
  });

  // Step 4: Compare each dividend to previous one
  let increases = 0;
  let decreases = 0;
  let noChange = 0;

  for (let i = 1; i < chronological.length; i++) {
    const current = chronological[i];
    const previous = chronological[i - 1];

    const currentAmount = current.adj_amount !== null ? Number(current.adj_amount) : Number(current.div_cash);
    const previousAmount = previous.adj_amount !== null ? Number(previous.adj_amount) : Number(previous.div_cash);

    const prevDate = previous.ex_date instanceof Date 
      ? previous.ex_date.toISOString().split('T')[0]
      : new Date(previous.ex_date).toISOString().split('T')[0];
    const currDate = current.ex_date instanceof Date 
      ? current.ex_date.toISOString().split('T')[0]
      : new Date(current.ex_date).toISOString().split('T')[0];
    
    const comparison = {
      comparisonNumber: i,
      previousDate: prevDate,
      previousDivCash: Number(previous.div_cash),
      previousAdjAmount: previous.adj_amount !== null ? Number(previous.adj_amount) : null,
      previousAmount: previousAmount,
      previousSource: previous.adj_amount !== null ? 'adj_amount' : 'div_cash',
      currentDate: currDate,
      currentDivCash: Number(current.div_cash),
      currentAdjAmount: current.adj_amount !== null ? Number(current.adj_amount) : null,
      currentAmount: currentAmount,
      currentSource: current.adj_amount !== null ? 'adj_amount' : 'div_cash',
      calculation: `${currentAmount} ${currentAmount > previousAmount ? '>' : currentAmount < previousAmount ? '<' : '='} ${previousAmount}`,
      change: currentAmount - previousAmount,
      changePercent: previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount * 100).toFixed(2) + '%' : 'N/A',
      result: ''
    };

    if (currentAmount > previousAmount) {
      increases++;
      comparison.result = 'INCREASE (+)';
    } else if (currentAmount < previousAmount) {
      decreases++;
      comparison.result = 'DECREASE (-)';
    } else {
      noChange++;
      comparison.result = 'NO CHANGE';
    }

    details.step4_comparisons.comparisons.push(comparison);
  }

  details.step4_comparisons.increases = increases;
  details.step4_comparisons.decreases = decreases;
  details.step4_comparisons.noChange = noChange;

  const result = `${increases}+ ${decreases}-`;
  details.finalResult = result;

  return { result, details };
}

function formatDetailedOutput(ticker: string, result: string, details: any): string {
  let output = `\n${'='.repeat(100)}\n`;
  output += `DIVIDEND HISTORY CALCULATION FOR: ${ticker.toUpperCase()}\n`;
  output += `${'='.repeat(100)}\n\n`;

  output += `FINAL RESULT: ${result}\n\n`;

  output += `${details.step1_filtering.description}\n`;
  output += `${'-'.repeat(100)}\n`;
  output += `Total Dividends in Database: ${details.totalDividends}\n\n`;
  
  if (details.step1_filtering.excludedDividends.length > 0) {
    output += `EXCLUDED (Special Dividends): ${details.step1_filtering.excludedDividends.length}\n`;
    details.step1_filtering.excludedDividends.forEach((d: any) => {
      output += `  - ${d.exDate}: $${d.divCash.toFixed(4)} (adj: ${d.adjAmount !== null ? '$' + d.adjAmount.toFixed(4) : 'null'}) [${d.divType}] - ${d.reason}\n`;
    });
    output += `\n`;
  }

  output += `INCLUDED (Regular Dividends): ${details.step1_filtering.regularDividends.length}\n`;
  if (details.step1_filtering.regularDividends.length <= 20) {
    details.step1_filtering.regularDividends.forEach((d: any, idx: number) => {
      output += `  ${idx + 1}. ${d.exDate}: div_cash=$${d.divCash.toFixed(4)}, adj_amount=${d.adjAmount !== null ? '$' + d.adjAmount.toFixed(4) : 'null'} [${d.divType}]\n`;
    });
  } else {
    output += `  (Showing first 10 and last 10 of ${details.step1_filtering.regularDividends.length} dividends)\n`;
    details.step1_filtering.regularDividends.slice(0, 10).forEach((d: any, idx: number) => {
      output += `  ${idx + 1}. ${d.exDate}: div_cash=$${d.divCash.toFixed(4)}, adj_amount=${d.adjAmount !== null ? '$' + d.adjAmount.toFixed(4) : 'null'}\n`;
    });
    output += `  ... (${details.step1_filtering.regularDividends.length - 20} more) ...\n`;
    details.step1_filtering.regularDividends.slice(-10).forEach((d: any, idx: number) => {
      const actualIdx = details.step1_filtering.regularDividends.length - 10 + idx;
      output += `  ${actualIdx + 1}. ${d.exDate}: div_cash=$${d.divCash.toFixed(4)}, adj_amount=${d.adjAmount !== null ? '$' + d.adjAmount.toFixed(4) : 'null'}\n`;
    });
  }
  output += `\n`;

  output += `${details.step2_sorting.description}\n`;
  output += `${'-'.repeat(100)}\n`;
  output += `Sorting Logic: Manual entries first, then by date (newest first)\n`;
  output += `Sorted Order (showing first 5 and last 5):\n`;
  const sorted = details.step2_sorting.sortedDividends;
  sorted.slice(0, 5).forEach((d: any, idx: number) => {
    output += `  ${idx + 1}. ${d.exDate}: $${(d.adjAmount !== null ? d.adjAmount : d.divCash).toFixed(4)} ${d.isManual ? '[MANUAL]' : ''}\n`;
  });
  if (sorted.length > 10) {
    output += `  ... (${sorted.length - 10} more) ...\n`;
  }
  sorted.slice(-5).forEach((d: any, idx: number) => {
    const actualIdx = sorted.length - 5 + idx;
    output += `  ${actualIdx + 1}. ${d.exDate}: $${(d.adjAmount !== null ? d.adjAmount : d.divCash).toFixed(4)} ${d.isManual ? '[MANUAL]' : ''}\n`;
  });
  output += `\n`;

  output += `${details.step3_chronological.description}\n`;
  output += `${'-'.repeat(100)}\n`;
  output += `Chronological Order (Oldest First) - Amount Used for Comparison:\n`;
  const chrono = details.step3_chronological.chronologicalDividends;
  if (chrono.length <= 20) {
    chrono.forEach((d: any, idx: number) => {
      output += `  ${idx + 1}. ${d.exDate}: $${d.amountUsed.toFixed(4)} (using ${d.adjAmount !== null ? 'adj_amount' : 'div_cash'})\n`;
    });
  } else {
    chrono.slice(0, 10).forEach((d: any, idx: number) => {
      output += `  ${idx + 1}. ${d.exDate}: $${d.amountUsed.toFixed(4)} (using ${d.adjAmount !== null ? 'adj_amount' : 'div_cash'})\n`;
    });
    output += `  ... (${chrono.length - 20} more) ...\n`;
    chrono.slice(-10).forEach((d: any, idx: number) => {
      const actualIdx = chrono.length - 10 + idx;
      output += `  ${actualIdx + 1}. ${d.exDate}: $${d.amountUsed.toFixed(4)} (using ${d.adjAmount !== null ? 'adj_amount' : 'div_cash'})\n`;
    });
  }
  output += `\n`;

  output += `${details.step4_comparisons.description}\n`;
  output += `  ${details.step4_comparisons.formula}\n`;
  output += `  ${details.step4_comparisons.formula2}\n`;
  output += `  ${details.step4_comparisons.formula3}\n`;
  output += `  ${details.step4_comparisons.formula4}\n`;
  output += `${'-'.repeat(100)}\n`;
  output += `Total Comparisons: ${details.step4_comparisons.comparisons.length}\n\n`;
  
  // Show all comparisons (this is the key part)
  details.step4_comparisons.comparisons.forEach((comp: any) => {
    output += `Comparison ${comp.comparisonNumber}:\n`;
    output += `  Previous Dividend:\n`;
    output += `    Date: ${comp.previousDate}\n`;
    output += `    div_cash: $${comp.previousDivCash.toFixed(4)}\n`;
    output += `    adj_amount: ${comp.previousAdjAmount !== null ? '$' + comp.previousAdjAmount.toFixed(4) : 'null'}\n`;
    output += `    → Amount Used: $${comp.previousAmount.toFixed(4)} (from ${comp.previousSource})\n`;
    output += `  Current Dividend:\n`;
    output += `    Date: ${comp.currentDate}\n`;
    output += `    div_cash: $${comp.currentDivCash.toFixed(4)}\n`;
    output += `    adj_amount: ${comp.currentAdjAmount !== null ? '$' + comp.currentAdjAmount.toFixed(4) : 'null'}\n`;
    output += `    → Amount Used: $${comp.currentAmount.toFixed(4)} (from ${comp.currentSource})\n`;
    output += `  Calculation: ${comp.calculation}\n`;
    output += `  Change: $${comp.change.toFixed(4)} (${comp.changePercent})\n`;
    output += `  Result: ${comp.result}\n\n`;
  });

  output += `SUMMARY:\n`;
  output += `${'-'.repeat(100)}\n`;
  output += `Increases (+): ${details.step4_comparisons.increases}\n`;
  output += `Decreases (-): ${details.step4_comparisons.decreases}\n`;
  output += `No Change:     ${details.step4_comparisons.noChange}\n`;
  output += `\nFINAL RESULT: ${result}\n`;
  output += `${'='.repeat(100)}\n\n`;

  return output;
}

async function debugAllCEFs(): Promise<void> {
  console.log('Fetching all CEF tickers...');
  const tickers = await getAllCEFTickers();
  console.log(`Found ${tickers.length} CEFs\n`);

  let fullOutput = '';

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    try {
      console.log(`[${i + 1}/${tickers.length}] Processing ${ticker}...`);
      
      const dividends = await getDividendHistory(ticker);
      const { result, details } = calculateDividendHistoryDetailed(dividends);
      
      const detailedOutput = formatDetailedOutput(ticker, result, details);
      fullOutput += detailedOutput;
      
      console.log(`  ✓ ${result}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`  ✗ Error: ${errorMsg}`);
      fullOutput += `\n${'='.repeat(100)}\n`;
      fullOutput += `ERROR PROCESSING ${ticker.toUpperCase()}: ${errorMsg}\n`;
      fullOutput += `${'='.repeat(100)}\n\n`;
    }
  }

  // Output everything at once for easy copy-paste
  console.log(`\n${'='.repeat(100)}`);
  console.log('DETAILED CALCULATIONS FOR ALL CEFs');
  console.log('='.repeat(100));
  console.log('(Ready to copy-paste into Google Doc)\n');
  console.log(fullOutput);

  // Also save to file
  const fs = await import('fs/promises');
  const outputFile = 'dividend_history_calculations_detailed.txt';
  await fs.writeFile(outputFile, fullOutput, 'utf-8');
  console.log(`\n${'='.repeat(100)}`);
  console.log(`Output also saved to: ${outputFile}`);
  console.log(`You can open this file and copy-paste into Google Doc`);
  console.log(`${'='.repeat(100)}\n`);

  // Output summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  // Sort by ticker for easy reading
  results.sort((a, b) => a.ticker.localeCompare(b.ticker));

  console.log('TICKER | DIV HISTO | INCREASES | DECREASES | TOTAL DIVS | REGULAR DIVS');
  console.log('-'.repeat(80));
  
  for (const r of results) {
    if (r.error) {
      console.log(`${r.ticker.padEnd(6)} | ERROR     | ${r.error.substring(0, 40)}`);
    } else {
      console.log(
        `${r.ticker.padEnd(6)} | ${r.result.padEnd(9)} | ${String(r.increases).padStart(9)} | ${String(r.decreases).padStart(9)} | ${String(r.totalDividends).padStart(10)} | ${String(r.regularDividends).padStart(12)}`
      );
    }
  }

  // Also output detailed format for copy-paste
  console.log(`\n${'='.repeat(80)}`);
  console.log('DETAILED OUTPUT (for Google Doc)');
  console.log(`${'='.repeat(80)}\n`);

  for (const r of results) {
    if (r.error) {
      console.log(`${r.ticker}: ERROR - ${r.error}\n`);
    } else {
      console.log(`${r.ticker}: ${r.result}`);
      console.log(`  Total Dividends: ${r.totalDividends}`);
      console.log(`  Regular Dividends: ${r.regularDividends}`);
      console.log(`  Increases: ${r.increases}`);
      console.log(`  Decreases: ${r.decreases}\n`);
    }
  }
}

async function main() {
  try {
    await debugAllCEFs();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

