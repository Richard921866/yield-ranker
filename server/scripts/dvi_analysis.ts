/**
 * DVI Analysis Script
 * 
 * Generates a comprehensive table of all ETFs with their DVI values
 * and calculates statistics for categorization analysis.
 */

import { getSupabase } from '../src/services/database.js';
import { logger } from '../src/utils/index.js';
import fs from 'fs';
import path from 'path';

interface ETFWithDVI {
  ticker: string;
  name: string | null;
  dvi: number | null;
  forwardYield: number | null;
  annualDividend: number | null;
}

async function generateDVIAnalysis() {
  logger.info('DVI Analysis', 'Starting DVI analysis for all ETFs...\n');
  
  const supabase = getSupabase();
  
  const { data: etfs, error } = await supabase
    .from('etf_static')
    .select('ticker, description, dividend_cv_percent, forward_yield, annual_dividend')
    .order('ticker');
  
  if (error || !etfs) {
    logger.error('DVI Analysis', `Failed to fetch ETFs: ${error?.message}`);
    process.exit(1);
  }
  
  logger.info('DVI Analysis', `Found ${etfs.length} ETFs in database\n`);
  
  const etfsWithDVI: ETFWithDVI[] = etfs.map(etf => ({
    ticker: etf.ticker,
    name: etf.description,
    dvi: etf.dividend_cv_percent,
    forwardYield: etf.forward_yield,
    annualDividend: etf.annual_dividend,
  }));
  
  const validDVI = etfsWithDVI
    .filter(etf => etf.dvi != null && !isNaN(etf.dvi) && isFinite(etf.dvi))
    .map(etf => etf.dvi!);
  
  if (validDVI.length === 0) {
    logger.error('DVI Analysis', 'No ETFs with valid DVI values found');
    process.exit(1);
  }
  
  validDVI.sort((a, b) => a - b);
  
  const mean = validDVI.reduce((sum, val) => sum + val, 0) / validDVI.length;
  const median = validDVI.length % 2 === 0
    ? (validDVI[validDVI.length / 2 - 1] + validDVI[validDVI.length / 2]) / 2
    : validDVI[Math.floor(validDVI.length / 2)];
  
  const variance = validDVI.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validDVI.length;
  const stdDev = Math.sqrt(variance);
  
  const min = validDVI[0];
  const max = validDVI[validDVI.length - 1];
  const q1 = validDVI[Math.floor(validDVI.length * 0.25)];
  const q3 = validDVI[Math.floor(validDVI.length * 0.75)];
  
  logger.info('DVI Analysis', '=== STATISTICAL SUMMARY ===');
  logger.info('DVI Analysis', `Total ETFs: ${etfsWithDVI.length}`);
  logger.info('DVI Analysis', `ETFs with DVI: ${validDVI.length}`);
  logger.info('DVI Analysis', `ETFs without DVI: ${etfsWithDVI.length - validDVI.length}`);
  logger.info('DVI Analysis', '');
  logger.info('DVI Analysis', '=== DVI STATISTICS ===');
  logger.info('DVI Analysis', `Mean (Average): ${mean.toFixed(2)}%`);
  logger.info('DVI Analysis', `Median: ${median.toFixed(2)}%`);
  logger.info('DVI Analysis', `Standard Deviation: ${stdDev.toFixed(2)}%`);
  logger.info('DVI Analysis', `Minimum: ${min.toFixed(2)}%`);
  logger.info('DVI Analysis', `Maximum: ${max.toFixed(2)}%`);
  logger.info('DVI Analysis', `Q1 (25th percentile): ${q1.toFixed(2)}%`);
  logger.info('DVI Analysis', `Q3 (75th percentile): ${q3.toFixed(2)}%`);
  logger.info('DVI Analysis', '');
  
  const categories = {
    veryLow: validDVI.filter(d => d < 20).length,
    low: validDVI.filter(d => d >= 20 && d < 35).length,
    moderate: validDVI.filter(d => d >= 35 && d < 50).length,
    high: validDVI.filter(d => d >= 50 && d < 70).length,
    veryHigh: validDVI.filter(d => d >= 70).length,
  };
  
  logger.info('DVI Analysis', '=== CURRENT CATEGORIZATION (Based on Fixed Thresholds) ===');
  logger.info('DVI Analysis', `Very Low (< 20%): ${categories.veryLow} ETFs`);
  logger.info('DVI Analysis', `Low (20-35%): ${categories.low} ETFs`);
  logger.info('DVI Analysis', `Moderate (35-50%): ${categories.moderate} ETFs`);
  logger.info('DVI Analysis', `High (50-70%): ${categories.high} ETFs`);
  logger.info('DVI Analysis', `Very High (≥ 70%): ${categories.veryHigh} ETFs`);
  logger.info('DVI Analysis', '');
  
  logger.info('DVI Analysis', '=== SUGGESTED CATEGORIZATION (Based on Quartiles) ===');
  logger.info('DVI Analysis', `Very Low (< ${q1.toFixed(1)}%): ${validDVI.filter(d => d < q1).length} ETFs`);
  logger.info('DVI Analysis', `Low (${q1.toFixed(1)}-${median.toFixed(1)}%): ${validDVI.filter(d => d >= q1 && d < median).length} ETFs`);
  logger.info('DVI Analysis', `Moderate (${median.toFixed(1)}-${q3.toFixed(1)}%): ${validDVI.filter(d => d >= median && d < q3).length} ETFs`);
  logger.info('DVI Analysis', `High (${q3.toFixed(1)}-${(q3 + stdDev).toFixed(1)}%): ${validDVI.filter(d => d >= q3 && d < q3 + stdDev).length} ETFs`);
  logger.info('DVI Analysis', `Very High (≥ ${(q3 + stdDev).toFixed(1)}%): ${validDVI.filter(d => d >= q3 + stdDev).length} ETFs`);
  logger.info('DVI Analysis', '');
  
  const csvRows: string[] = [];
  csvRows.push('Ticker,Name,DVI (%),Forward Yield (%),Annual Dividend ($)');
  
  etfsWithDVI
    .sort((a, b) => {
      if (a.dvi == null && b.dvi == null) return 0;
      if (a.dvi == null) return 1;
      if (b.dvi == null) return -1;
      return a.dvi - b.dvi;
    })
    .forEach(etf => {
      const dvi = etf.dvi != null ? etf.dvi.toFixed(2) : 'N/A';
      const yieldVal = etf.forwardYield != null ? etf.forwardYield.toFixed(2) : 'N/A';
      const annualDiv = etf.annualDividend != null ? etf.annualDividend.toFixed(2) : 'N/A';
      const name = etf.name ? etf.name.replace(/,/g, ';') : 'N/A';
      csvRows.push(`${etf.ticker},${name},${dvi},${yieldVal},${annualDiv}`);
    });
  
  const csvContent = csvRows.join('\n');
  const outputPath = path.join(process.cwd(), 'dvi_analysis.csv');
  fs.writeFileSync(outputPath, csvContent);
  
  logger.info('DVI Analysis', `✅ CSV file generated: ${outputPath}`);
  logger.info('DVI Analysis', '');
  
  logger.info('DVI Analysis', '=== TOP 10 LOWEST DVI (Most Stable) ===');
  etfsWithDVI
    .filter(etf => etf.dvi != null)
    .sort((a, b) => (a.dvi || 0) - (b.dvi || 0))
    .slice(0, 10)
    .forEach((etf, idx) => {
      logger.info('DVI Analysis', `${idx + 1}. ${etf.ticker}: ${etf.dvi?.toFixed(2)}% ${etf.name ? `(${etf.name})` : ''}`);
    });
  
  logger.info('DVI Analysis', '');
  logger.info('DVI Analysis', '=== TOP 10 HIGHEST DVI (Most Volatile) ===');
  etfsWithDVI
    .filter(etf => etf.dvi != null)
    .sort((a, b) => (b.dvi || 0) - (a.dvi || 0))
    .slice(0, 10)
    .forEach((etf, idx) => {
      logger.info('DVI Analysis', `${idx + 1}. ${etf.ticker}: ${etf.dvi?.toFixed(2)}% ${etf.name ? `(${etf.name})` : ''}`);
    });
  
  logger.info('DVI Analysis', '');
  logger.info('DVI Analysis', '=== ANALYSIS COMPLETE ===');
  logger.info('DVI Analysis', `CSV file ready for Gemini analysis: ${outputPath}`);
  logger.info('DVI Analysis', '');
  
  const analysisPrompt = `
ANALYSIS REQUEST FOR GEMINI:

Please analyze the DVI (Dividend Volatility Index) data for ${validDVI.length} ETFs.

STATISTICAL SUMMARY:
- Mean (Average): ${mean.toFixed(2)}%
- Median: ${median.toFixed(2)}%
- Standard Deviation: ${stdDev.toFixed(2)}%
- Range: ${min.toFixed(2)}% to ${max.toFixed(2)}%
- Q1 (25th percentile): ${q1.toFixed(2)}%
- Q3 (75th percentile): ${q3.toFixed(2)}%

CURRENT CATEGORIZATION:
- Very Low (< 20%): ${categories.veryLow} ETFs
- Low (20-35%): ${categories.low} ETFs
- Moderate (35-50%): ${categories.moderate} ETFs
- High (50-70%): ${categories.high} ETFs
- Very High (≥ 70%): ${categories.veryHigh} ETFs

Please provide:
1. Recommended DVI category thresholds based on the distribution
2. Analysis of whether fixed thresholds or percentile-based thresholds are better
3. Suggested rating system (A+ to F or similar) with DVI ranges
4. Any insights about the distribution and outliers
`;
  
  const promptPath = path.join(process.cwd(), 'gemini_analysis_prompt.txt');
  fs.writeFileSync(promptPath, analysisPrompt);
  
  logger.info('DVI Analysis', `✅ Gemini analysis prompt generated: ${promptPath}`);
  logger.info('DVI Analysis', '');
  logger.info('DVI Analysis', 'Files ready for CEO review:');
  logger.info('DVI Analysis', `  1. ${outputPath} - Complete ETF table with DVI values`);
  logger.info('DVI Analysis', `  2. ${promptPath} - Analysis prompt for Gemini`);
}

generateDVIAnalysis().catch(console.error);

