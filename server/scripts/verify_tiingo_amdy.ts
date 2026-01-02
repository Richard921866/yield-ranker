/**
 * Verify Tiingo API response for AMDY dividend data
 * Check what Tiingo actually returns vs what we're storing
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchDividendHistory } from '../src/services/tiingo.js';
import { logger } from '../src/utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verifyAMDY() {
  console.log('============================================');
  console.log('Verifying Tiingo API Response for AMDY');
  console.log('============================================\n');

  try {
    // Fetch dividend history from Tiingo
    const dividends = await fetchDividendHistory('AMDY', '2025-09-01', '2025-11-01');
    
    console.log(`Found ${dividends.length} dividends from Tiingo API\n`);
    
    // Find the October 15, 2025 dividend
    const targetDiv = dividends.find(d => {
      const date = new Date(d.date);
      return date.getFullYear() === 2025 && 
             date.getMonth() === 9 && // October (0-indexed)
             date.getDate() === 15;
    });
    
    if (targetDiv) {
      console.log('✅ Found dividend for October 15, 2025:');
      console.log('----------------------------------------');
      console.log(`Date (ex-date): ${targetDiv.date}`);
      console.log(`Dividend Amount: $${targetDiv.dividend.toFixed(4)}`);
      console.log(`Adjusted Dividend: $${targetDiv.adjDividend.toFixed(4)}`);
      console.log(`Scaled Dividend: $${targetDiv.scaledDividend.toFixed(4)}`);
      console.log(`Record Date: ${targetDiv.recordDate || 'null'}`);
      console.log(`Payment Date: ${targetDiv.paymentDate || 'null'}`);
      console.log(`Declaration Date: ${targetDiv.declarationDate || 'null'}`);
      console.log('----------------------------------------\n');
      
      // Check nearby dates too
      console.log('Nearby dividends (September - November 2025):');
      console.log('----------------------------------------');
      dividends
        .filter(d => {
          const date = new Date(d.date);
          return date.getFullYear() === 2025 && 
                 date.getMonth() >= 8 && 
                 date.getMonth() <= 10;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(d => {
          console.log(`${d.date}: $${d.dividend.toFixed(4)} (adj: $${d.adjDividend.toFixed(4)})`);
        });
    } else {
      console.log('❌ No dividend found for October 15, 2025');
      console.log('\nAvailable dividends in October 2025:');
      dividends
        .filter(d => {
          const date = new Date(d.date);
          return date.getFullYear() === 2025 && date.getMonth() === 9;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(d => {
          console.log(`${d.date}: $${d.dividend.toFixed(4)}`);
        });
    }
    
    // Also check what the raw Tiingo API returns
    console.log('\n============================================');
    console.log('Fetching Raw Tiingo API Response');
    console.log('============================================\n');
    
    const config = await import('../src/config/index.js');
    const tiingoConfig = config.default.tiingo;
    
    const url = new URL(`${tiingoConfig.baseUrl}/tiingo/daily/AMDY/prices`);
    url.searchParams.append('token', tiingoConfig.apiKey);
    url.searchParams.append('startDate', '2025-10-01');
    url.searchParams.append('endDate', '2025-10-31');
    
    const response = await fetch(url.toString());
    const priceData = await response.json();
    
    console.log(`Raw API response: ${priceData.length} price records\n`);
    
    // Find records with divCash > 0
    const dividendRecords = priceData.filter((p: any) => p.divCash && p.divCash > 0);
    
    console.log(`Records with divCash > 0: ${dividendRecords.length}\n`);
    
    dividendRecords.forEach((p: any) => {
      console.log('Raw Tiingo Record:');
      console.log('----------------------------------------');
      console.log(`Date: ${p.date}`);
      console.log(`divCash: $${p.divCash}`);
      console.log(`close: $${p.close}`);
      console.log(`adjClose: $${p.adjClose}`);
      console.log(`splitFactor: ${p.splitFactor}`);
      console.log('----------------------------------------\n');
    });
    
  } catch (error) {
    console.error('Error:', error);
    logger.error('Verify', `Error verifying AMDY: ${(error as Error).message}`);
  }
}

verifyAMDY().then(() => {
  console.log('\nVerification complete.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

