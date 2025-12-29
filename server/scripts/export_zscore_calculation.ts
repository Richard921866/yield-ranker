/**
 * Export Z-Score Calculation Data to CSV/Excel
 * 
 * Exports 3 years of Price and NAV data with Premium/Discount calculations
 * for CEO verification of z-score calculations.
 * 
 * Usage:
 *   npm run export:zscore -- --ticker GAB --nav XGABX
 *   npm run export:zscore -- --ticker PCN --nav XPCNX
 */

// CRITICAL: Load environment variables FIRST before ANY other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from multiple possible locations
const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
];

let envLoaded = false;
for (const envPath of envPaths) {
    try {
        const result = dotenv.config({ path: envPath });
        if (!result.error && result.parsed && Object.keys(result.parsed).length > 0) {
            console.log(`✓ Loaded .env from: ${envPath}`);
            envLoaded = true;
            break;
        }
    } catch (e) {
        // Continue to next path
    }
}

if (!envLoaded) {
    dotenv.config(); // Try default location
}

import { createClient } from '@supabase/supabase-js';
import { getPriceHistory } from '../src/services/database.js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ZScoreRow {
    Date: string;
    Price: number;
    NAV: number;
    Premium_Discount: number;
    Premium_Discount_Pct: string;
}

interface ZScoreSummary {
    ticker: string;
    navSymbol: string;
    startDate: string;
    endDate: string;
    dataPoints: number;
    currentPD: number;
    currentPDPct: string;
    averagePD: number;
    averagePDPct: string;
    stdDevPD: number;
    stdDevPDPct: string;
    zScore: number;
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function formatPercent(value: number): string {
    return `${(value * 100).toFixed(8)}%`;
}

function formatNumber(value: number, decimals: number = 6): string {
    return value.toFixed(decimals);
}

async function exportZScoreCalculation(ticker: string, navSymbol: string): Promise<void> {
    console.log('='.repeat(100));
    console.log(`Exporting Z-Score Calculation Data for ${ticker} (NAV: ${navSymbol})`);
    console.log('='.repeat(100));
    console.log('');

    // Fetch 4 years of data to ensure we have full 3-year window
    const endDate = new Date();
    const startDateForFetch = new Date();
    startDateForFetch.setFullYear(endDate.getFullYear() - 4);

    console.log(`Fetching price and NAV data from ${formatDate(startDateForFetch)} to ${formatDate(endDate)}...`);

    const [priceData, navData] = await Promise.all([
        getPriceHistory(ticker, formatDate(startDateForFetch), formatDate(endDate)),
        getPriceHistory(navSymbol.toUpperCase(), formatDate(startDateForFetch), formatDate(endDate)),
    ]);

    if (priceData.length === 0 || navData.length === 0) {
        console.error(`ERROR: No price or NAV data found for ${ticker} / ${navSymbol}`);
        process.exit(1);
    }

    console.log(`Found ${priceData.length} price records and ${navData.length} NAV records`);
    console.log('');

    // Create maps by date - USE UNADJUSTED PRICES (close, not adj_close)
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

    // Find all dates with both price and NAV
    const allDates = new Set([...priceMap.keys(), ...navMap.keys()]);
    const sortedDates = Array.from(allDates).sort();

    // Find the most recent date with both price and NAV
    let actualEndDate: Date | null = null;
    for (const date of sortedDates.slice().reverse()) {
        const price = priceMap.get(date);
        const nav = navMap.get(date);
        if (price && nav && nav > 0) {
            actualEndDate = new Date(date);
            break;
        }
    }

    if (!actualEndDate) {
        console.error('ERROR: Could not find a date with both price and NAV data');
        process.exit(1);
    }

    // Calculate 3-year lookback date
    const threeYearStartDate = new Date(actualEndDate);
    threeYearStartDate.setFullYear(actualEndDate.getFullYear() - 3);
    const threeYearStartDateStr = formatDate(threeYearStartDate);
    const actualEndDateStr = formatDate(actualEndDate);

    console.log(`3-Year Window: ${threeYearStartDateStr} to ${actualEndDateStr}`);
    console.log('');

    // Build data rows for the 3-year window
    const rows: ZScoreRow[] = [];
    const pDiscounts: number[] = [];

    for (const date of sortedDates) {
        if (date < threeYearStartDateStr || date > actualEndDateStr) {
            continue; // Skip dates outside the 3-year window
        }

        const price = priceMap.get(date);
        const nav = navMap.get(date);
        if (price && nav && nav > 0) {
            const premiumDiscount = (price / nav - 1.0);
            pDiscounts.push(premiumDiscount);

            rows.push({
                Date: date,
                Price: price,
                NAV: nav,
                Premium_Discount: premiumDiscount,
                Premium_Discount_Pct: formatPercent(premiumDiscount),
            });
        }
    }

    if (rows.length < 252) {
        console.error(`ERROR: Insufficient data - only ${rows.length} data points (need at least 252 for 1 year)`);
        process.exit(1);
    }

    // Calculate statistics
    const currentPD = pDiscounts[pDiscounts.length - 1];
    const averagePD = pDiscounts.reduce((sum, d) => sum + d, 0) / pDiscounts.length;
    const variance = pDiscounts.reduce((sum, d) => sum + Math.pow(d - averagePD, 2), 0) / pDiscounts.length;
    const stdDevPD = Math.sqrt(variance);
    const zScore = (currentPD - averagePD) / stdDevPD;

    const summary: ZScoreSummary = {
        ticker,
        navSymbol,
        startDate: threeYearStartDateStr,
        endDate: actualEndDateStr,
        dataPoints: rows.length,
        currentPD,
        currentPDPct: formatPercent(currentPD),
        averagePD,
        averagePDPct: formatPercent(averagePD),
        stdDevPD,
        stdDevPDPct: formatPercent(stdDevPD),
        zScore,
    };

    // Generate CSV content
    let csvContent = 'Z-Score Calculation Summary\n';
    csvContent += '='.repeat(100) + '\n';
    csvContent += `Ticker: ${ticker}\n`;
    csvContent += `NAV Symbol: ${navSymbol}\n`;
    csvContent += `Start Date: ${summary.startDate}\n`;
    csvContent += `End Date: ${summary.endDate}\n`;
    csvContent += `Data Points: ${summary.dataPoints}\n`;
    csvContent += `Current Premium/Discount: ${summary.currentPDPct} (${formatNumber(currentPD)})\n`;
    csvContent += `Average Premium/Discount: ${summary.averagePDPct} (${formatNumber(averagePD)})\n`;
    csvContent += `STDEV.P: ${summary.stdDevPDPct} (${formatNumber(stdDevPD)})\n`;
    csvContent += `Z-Score: ${formatNumber(zScore, 8)}\n`;
    csvContent += '\n';
    csvContent += '='.repeat(100) + '\n';
    csvContent += 'Daily Price and NAV Data (3-Year Window)\n';
    csvContent += '='.repeat(100) + '\n';
    csvContent += 'Date,Price,NAV,Premium/Discount (Decimal),Premium/Discount (%)\n';

    // Add data rows
    for (const row of rows) {
        csvContent += `${row.Date},${formatNumber(row.Price, 4)},${formatNumber(row.NAV, 4)},${formatNumber(row.Premium_Discount, 8)},${row.Premium_Discount_Pct}\n`;
    }

    // Write to file
    const outputDir = path.resolve(__dirname, '../exports');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `zscore_${ticker}_${navSymbol}_${formatDate(new Date())}.csv`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, csvContent);

    console.log('Summary:');
    console.log(`  Ticker: ${ticker}`);
    console.log(`  NAV Symbol: ${navSymbol}`);
    console.log(`  Date Range: ${summary.startDate} to ${summary.endDate}`);
    console.log(`  Data Points: ${summary.dataPoints}`);
    console.log(`  Current P/D: ${summary.currentPDPct}`);
    console.log(`  Average P/D: ${summary.averagePDPct}`);
    console.log(`  STDEV.P: ${summary.stdDevPDPct}`);
    console.log(`  Z-Score: ${formatNumber(zScore, 8)}`);
    console.log('');
    console.log(`✓ Exported to: ${filepath}`);
    console.log('');
    console.log('File includes:');
    console.log('  - Summary section with all calculation parameters');
    console.log('  - Daily Price and NAV data for the 3-year window');
    console.log('  - Premium/Discount calculations for each day');
    console.log('');
}

// Main execution
const args = process.argv.slice(2);
const tickerIndex = args.indexOf('--ticker');
const navIndex = args.indexOf('--nav');

if (tickerIndex === -1 || tickerIndex === args.length - 1) {
    console.error('ERROR: --ticker argument required');
    console.error('Usage: npm run export:zscore -- --ticker GAB --nav XGABX');
    process.exit(1);
}

if (navIndex === -1 || navIndex === args.length - 1) {
    console.error('ERROR: --nav argument required');
    console.error('Usage: npm run export:zscore -- --ticker GAB --nav XGABX');
    process.exit(1);
}

const ticker = args[tickerIndex + 1].toUpperCase();
const navSymbol = args[navIndex + 1].toUpperCase();

exportZScoreCalculation(ticker, navSymbol).catch(error => {
    console.error('ERROR:', error);
    process.exit(1);
});

