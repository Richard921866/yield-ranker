/**
 * Test normalization formula against spreadsheet values
 */

// Test cases from spreadsheet
const testCases = [
  { adjDiv: 0.694, freq: 12, expectedAnnlzd: 8.33, expectedNormalzd: 0.1601538462 },
  { adjDiv: 0.164, freq: 52, expectedAnnlzd: 8.53, expectedNormalzd: 0.164 },
  { adjDiv: 0.0869, freq: 52, expectedAnnlzd: 4.52, expectedNormalzd: 0.0869 },
  { adjDiv: 0.0917, freq: 52, expectedAnnlzd: 4.77, expectedNormalzd: 0.0917 },
  { adjDiv: 0.1084, freq: 52, expectedAnnlzd: 5.64, expectedNormalzd: 0.1084 },
  { adjDiv: 0.2508, freq: 52, expectedAnnlzd: 13.04, expectedNormalzd: 0.2508 },
];

console.log('Testing normalization formula against spreadsheet:');
console.log('='.repeat(80));

for (const test of testCases) {
  const { adjDiv, freq, expectedAnnlzd, expectedNormalzd } = test;
  
  // Calculate annualized: Amount × Frequency
  const annualizedRaw = adjDiv * freq;
  const annualized = Number(annualizedRaw.toFixed(2));
  
  // Calculate normalized: (Amount × Frequency) / 52 (using unrounded annualized)
  const normalized = annualizedRaw / 52;
  
  console.log(`ADJ DIV: ${adjDiv}, FREQ: ${freq}`);
  console.log(`  Annualized (raw): ${annualizedRaw}`);
  console.log(`  Annualized (rounded): ${annualized} (expected: ${expectedAnnlzd})`);
  console.log(`  Normalized: ${normalized.toFixed(10)} (expected: ${expectedNormalzd})`);
  console.log(`  Match: ${Math.abs(normalized - expectedNormalzd) < 0.0001 ? '✓' : '✗'}`);
  console.log('');
}

console.log('Formula: normalizedDiv = (adjDiv × frequency) / 52');
console.log('(Using unrounded annualized value for normalization)');

