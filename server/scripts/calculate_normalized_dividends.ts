/**
 * Backfill Normalized Dividend Columns
 * 
 * This script calculates and populates the following columns in dividends_detail:
 * - days_since_prev: Days between current and previous dividend payment
 * - pmt_type: "Regular", "Special", or "Initial"
 * - frequency_num: 52 (weekly), 12 (monthly), 4 (quarterly), 1 (annual)
 * - annualized: adj_amount × frequency_num
 * - normalized_div: Normalized dividend for line chart display
 * 
 * Logic Rules (from Google Doc):
 * 1. DAYS: days_since_prev = current_ex_date - previous_ex_date
 * 2. TYPE (pmt_type):
 *    - null days → "Initial" (first dividend for ticker)
 *    - ≤5 days → "Special" (too close to previous, likely special dividend)
 *    - >5 days → "Regular"
 * 3. FREQUENCY (frequency_num): Based on gap detection
 *    - 7-10 days → 52 (Weekly)
 *    - 25-35 days → 12 (Monthly)
 *    - 80-100 days → 4 (Quarterly)
 *    - else → 1 (Annual/Irregular)
 * 4. ANNUALIZED: adj_amount × frequency_num
 * 5. NORMALIZED: For consistent display on the line chart
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface DividendRecord {
    id: number;
    ticker: string;
    ex_date: string;
    adj_amount: number | null;
    div_cash: number;
}

interface CalculatedDividend {
    id: number;
    days_since_prev: number | null;
    pmt_type: string;
    frequency_num: number;
    annualized: number | null;
    normalized_div: number | null;
}

/**
 * Determine frequency based on days between payments
 * Using ranges to account for weekends/holidays
 */
function getFrequencyFromDays(days: number): number {
    if (days >= 7 && days <= 10) return 52;    // Weekly
    if (days >= 25 && days <= 35) return 12;   // Monthly  
    if (days >= 80 && days <= 100) return 4;   // Quarterly
    if (days >= 170 && days <= 200) return 2;  // Semi-annual
    if (days > 200) return 1;                   // Annual or irregular

    // Edge cases: handle transition periods
    if (days > 10 && days < 25) return 52;     // Likely weekly with holiday gap
    if (days > 35 && days < 80) return 12;     // Likely monthly with irregularity
    if (days > 100 && days < 170) return 4;    // Likely quarterly with irregularity

    return 12; // Default to monthly
}

/**
 * Determine payment type based on days gap
 */
function getPaymentType(daysSincePrev: number | null): string {
    if (daysSincePrev === null) return 'Initial';
    if (daysSincePrev <= 5) return 'Special';
    return 'Regular';
}

async function backfillNormalizedDividends() {
    console.log('============================================');
    console.log('Backfilling Normalized Dividend Columns');
    console.log('============================================\n');

    // Get all unique tickers from dividends_detail
    const { data: tickers, error: tickerError } = await supabase
        .from('dividends_detail')
        .select('ticker')
        .order('ticker');

    if (tickerError) {
        console.error('Error fetching tickers:', tickerError);
        process.exit(1);
    }

    const uniqueTickers = [...new Set(tickers.map(t => t.ticker))];
    console.log(`Found ${uniqueTickers.length} unique tickers to process\n`);

    let totalProcessed = 0;
    let totalUpdated = 0;

    for (const ticker of uniqueTickers) {
        // Get all dividends for this ticker, sorted by date ascending
        const { data: dividends, error: divError } = await supabase
            .from('dividends_detail')
            .select('id, ticker, ex_date, adj_amount, div_cash')
            .eq('ticker', ticker)
            .order('ex_date', { ascending: true });

        if (divError) {
            console.error(`Error fetching dividends for ${ticker}:`, divError);
            continue;
        }

        if (!dividends || dividends.length === 0) {
            continue;
        }

        const updates: CalculatedDividend[] = [];

        for (let i = 0; i < dividends.length; i++) {
            const current = dividends[i];
            const previous = i > 0 ? dividends[i - 1] : null;

            // Calculate days since previous dividend
            let daysSincePrev: number | null = null;
            if (previous) {
                const currentDate = new Date(current.ex_date);
                const prevDate = new Date(previous.ex_date);
                daysSincePrev = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
            }

            // Determine payment type
            const pmtType = getPaymentType(daysSincePrev);

            // Determine frequency - we look at the next payment to "confirm" the frequency
            // For the last dividend, use the previous interval
            let frequencyNum = 12; // Default to monthly

            if (daysSincePrev !== null && daysSincePrev > 5) {
                frequencyNum = getFrequencyFromDays(daysSincePrev);
            } else if (i < dividends.length - 1) {
                // Look ahead to next payment for frequency
                const nextDiv = dividends[i + 1];
                const nextDate = new Date(nextDiv.ex_date);
                const currentDate = new Date(current.ex_date);
                const daysToNext = Math.round((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysToNext > 5) {
                    frequencyNum = getFrequencyFromDays(daysToNext);
                }
            }

            // Calculate annualized and normalized values
            // Use adj_amount if available, otherwise use div_cash
            const amount = current.adj_amount !== null ? Number(current.adj_amount) : Number(current.div_cash);

            let annualized: number | null = null;
            let normalizedDiv: number | null = null;

            if (pmtType === 'Regular' && amount > 0) {
                annualized = amount * frequencyNum;
                // Normalized dividend: what this payment represents in the current frequency context
                // For consistent line chart display
                normalizedDiv = amount;
            }

            updates.push({
                id: current.id,
                days_since_prev: daysSincePrev,
                pmt_type: pmtType,
                frequency_num: frequencyNum,
                annualized: annualized ? Number(annualized.toFixed(6)) : null,
                normalized_div: normalizedDiv ? Number(normalizedDiv.toFixed(6)) : null,
            });
        }

        // Batch update this ticker's dividends
        for (const update of updates) {
            const { error: updateError } = await supabase
                .from('dividends_detail')
                .update({
                    days_since_prev: update.days_since_prev,
                    pmt_type: update.pmt_type,
                    frequency_num: update.frequency_num,
                    annualized: update.annualized,
                    normalized_div: update.normalized_div,
                })
                .eq('id', update.id);

            if (updateError) {
                console.error(`  Error updating dividend ID ${update.id}:`, updateError);
            } else {
                totalUpdated++;
            }
        }

        totalProcessed++;
        if (totalProcessed % 10 === 0) {
            console.log(`Processed ${totalProcessed}/${uniqueTickers.length} tickers...`);
        }
    }

    console.log('\n============================================');
    console.log('Backfill Complete!');
    console.log('============================================');
    console.log(`Total tickers processed: ${totalProcessed}`);
    console.log(`Total dividend records updated: ${totalUpdated}`);
}

// Run for a specific ticker (useful for testing)
async function backfillSingleTicker(ticker: string) {
    console.log(`\nProcessing single ticker: ${ticker}\n`);

    const { data: dividends, error } = await supabase
        .from('dividends_detail')
        .select('id, ticker, ex_date, adj_amount, div_cash')
        .eq('ticker', ticker)
        .order('ex_date', { ascending: true });

    if (error) {
        console.error(`Error fetching dividends for ${ticker}:`, error);
        return;
    }

    console.log(`Found ${dividends.length} dividends for ${ticker}\n`);

    for (let i = 0; i < dividends.length; i++) {
        const current = dividends[i];
        const previous = i > 0 ? dividends[i - 1] : null;

        let daysSincePrev: number | null = null;
        if (previous) {
            const currentDate = new Date(current.ex_date);
            const prevDate = new Date(previous.ex_date);
            daysSincePrev = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        const pmtType = getPaymentType(daysSincePrev);
        let frequencyNum = 12;

        if (daysSincePrev !== null && daysSincePrev > 5) {
            frequencyNum = getFrequencyFromDays(daysSincePrev);
        }

        const amount = current.adj_amount !== null ? Number(current.adj_amount) : Number(current.div_cash);
        const annualized = pmtType === 'Regular' && amount > 0 ? amount * frequencyNum : null;
        const normalizedDiv = pmtType === 'Regular' && amount > 0 ? amount : null;

        console.log(`${current.ex_date}: Days=${daysSincePrev ?? 'N/A'}, Type=${pmtType}, Freq=${frequencyNum}, Amt=${amount.toFixed(4)}, Ann=${annualized?.toFixed(4) ?? 'N/A'}, Norm=${normalizedDiv?.toFixed(4) ?? 'N/A'}`);

        // Update the database
        const { error: updateError } = await supabase
            .from('dividends_detail')
            .update({
                days_since_prev: daysSincePrev,
                pmt_type: pmtType,
                frequency_num: frequencyNum,
                annualized: annualized ? Number(annualized.toFixed(6)) : null,
                normalized_div: normalizedDiv ? Number(normalizedDiv.toFixed(6)) : null,
            })
            .eq('id', current.id);

        if (updateError) {
            console.error(`  Error updating:`, updateError);
        }
    }

    console.log('\nDone!');
}

// Main execution
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === '--ticker' && args[1]) {
    backfillSingleTicker(args[1]);
} else {
    backfillNormalizedDividends();
}
