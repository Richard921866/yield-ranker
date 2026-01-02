/**
 * Check what's stored in database for AMDY
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSupabase } from '../src/services/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkDatabase() {
  console.log('============================================');
  console.log('Checking Database for AMDY');
  console.log('============================================\n');

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('dividends_detail')
    .select('*')
    .eq('ticker', 'AMDY')
    .gte('ex_date', '2025-10-01')
    .lte('ex_date', '2025-10-31')
    .order('ex_date', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data?.length || 0} records in database for October 2025\n`);

  data?.forEach((d: any) => {
    console.log('Database Record:');
    console.log('----------------------------------------');
    console.log(`Ex-Date: ${d.ex_date}`);
    console.log(`Div Cash: $${d.div_cash}`);
    console.log(`Adj Amount: $${d.adj_amount}`);
    console.log(`Frequency: ${d.frequency || 'null'}`);
    console.log(`Frequency Num: ${d.frequency_num || 'null'}`);
    console.log(`Pmt Type: ${d.pmt_type || 'null'}`);
    console.log(`Record Date: ${d.record_date || 'null'}`);
    console.log(`Pay Date: ${d.pay_date || 'null'}`);
    console.log(`Is Manual: ${d.is_manual || false}`);
    console.log(`Description: ${d.description || 'null'}`);
    console.log('----------------------------------------\n');
  });
}

checkDatabase().then(() => {
  console.log('Check complete.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

