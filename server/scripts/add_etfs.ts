/**
 * Quick script to add covered call ETFs to etf_static
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Common Covered Call ETFs
const etfs = [
  { ticker: 'QYLD', issuer: 'Global X', description: 'NASDAQ 100 Covered Call ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 25 },
  { ticker: 'XYLD', issuer: 'Global X', description: 'S&P 500 Covered Call ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 50 },
  { ticker: 'RYLD', issuer: 'Global X', description: 'Russell 2000 Covered Call ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 25 },
  { ticker: 'JEPI', issuer: 'JPMorgan', description: 'Equity Premium Income ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 50 },
  { ticker: 'JEPQ', issuer: 'JPMorgan', description: 'NASDAQ Equity Premium Income ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 50 },
  { ticker: 'DIVO', issuer: 'Amplify', description: 'CWP Enhanced Dividend Income ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 25 },
  { ticker: 'SPYI', issuer: 'NEOS', description: 'S&P 500 High Income ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 50 },
  { ticker: 'QQQI', issuer: 'NEOS', description: 'NASDAQ 100 High Income ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 50 },
  { ticker: 'DJIA', issuer: 'Global X', description: 'Dow 30 Covered Call ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 25 },
  { ticker: 'PBP', issuer: 'Invesco', description: 'S&P 500 BuyWrite ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 24 },
  { ticker: 'QQQY', issuer: 'Defiance', description: 'NASDAQ 100 Enhanced Options Income ETF', pay_day_text: 'Weekly', payments_per_year: 52, ipo_price: 15 },
  { ticker: 'IWMY', issuer: 'Defiance', description: 'Russell 2000 Enhanced Options Income ETF', pay_day_text: 'Weekly', payments_per_year: 52, ipo_price: 15 },
  { ticker: 'YMAG', issuer: 'YieldMax', description: 'Magnificent 7 Fund of Option Income ETFs', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 20 },
  { ticker: 'CONY', issuer: 'YieldMax', description: 'COIN Option Income Strategy ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 20 },
  { ticker: 'TSLY', issuer: 'YieldMax', description: 'TSLA Option Income Strategy ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 20 },
  { ticker: 'NVDY', issuer: 'YieldMax', description: 'NVDA Option Income Strategy ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 20 },
  { ticker: 'MSTY', issuer: 'YieldMax', description: 'MSTR Option Income Strategy ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 20 },
  { ticker: 'AMZY', issuer: 'YieldMax', description: 'AMZN Option Income Strategy ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 20 },
  { ticker: 'APLY', issuer: 'YieldMax', description: 'AAPL Option Income Strategy ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 20 },
  { ticker: 'GOOY', issuer: 'YieldMax', description: 'GOOGL Option Income Strategy ETF', pay_day_text: 'Monthly', payments_per_year: 12, ipo_price: 20 },
];

async function main() {
  console.log('Adding Covered Call ETFs to database...\n');
  
  const now = new Date().toISOString();
  const records = etfs.map(etf => ({
    ...etf,
    data_source: 'Tiingo',
    created_at: now,
    updated_at: now,
    last_updated: now,
  }));
  
  const { data, error } = await supabase
    .from('etf_static')
    .upsert(records, { onConflict: 'ticker' });
  
  if (error) {
    console.error('Error inserting ETFs:', error);
    process.exit(1);
  }
  
  console.log(`Successfully added ${records.length} ETFs!`);
  
  // Verify
  const { data: count } = await supabase
    .from('etf_static')
    .select('ticker');
  
  console.log(`Total ETFs in database: ${count?.length || 0}`);
}

main().catch(console.error);
