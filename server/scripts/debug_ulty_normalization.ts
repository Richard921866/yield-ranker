/**
 * Debug ULTY 3/6 normalized calculation
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { calculateNormalizedDividends, getFrequencyFromDays } from '../src/services/dividendNormalization.js';

// Simulate 3 dividends around the transition
const testDividends = [
    { id: 1, ticker: 'ULTY', ex_date: '2025-02-06', div_cash: 0.5369, adj_amount: 5.369 },
    { id: 2, ticker: 'ULTY', ex_date: '2025-03-06', div_cash: 0.4653, adj_amount: 4.653 },
    { id: 3, ticker: 'ULTY', ex_date: '2025-03-13', div_cash: 0.1025, adj_amount: 1.025 },
];

console.log('=== Testing getFrequencyFromDays ===');
console.log('28 days:', getFrequencyFromDays(28), '(expected: 12)');
console.log('7 days:', getFrequencyFromDays(7), '(expected: 52)');

console.log('\\n=== Normalized Results ===');
const results = calculateNormalizedDividends(testDividends);
results.forEach((r, i) => {
    const d = testDividends[i];
    console.log(`${d.ex_date}: freq=${r.frequency_num}, normalized=${r.normalized_div}, type=${r.pmt_type}, days=${r.days_since_prev}`);
});

console.log('\\n=== EXPECTED ===');
console.log('2/6: freq=12, normalized=1.239 (Initial)');
console.log('3/6: freq=12, normalized=1.07 (frequency transition, use prev gap)');
console.log('3/13: freq=52, normalized=1.025 (weekly)');
