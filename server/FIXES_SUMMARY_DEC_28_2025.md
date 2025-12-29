# Fixes Summary - December 28, 2025

## Issue 1: Normalized Value Showing 0.0201 Instead of 0.0869 for GOOY Dec 25

### Problem
The normalized line chart was showing 0.0201 for December 25, 2025, but the correct value should be 0.0869 (matching the CEO's table).

### Root Cause
When the API route fetched dividends from Tiingo, it overwrote the database records, losing the calculated `normalized_div` values. Then when the code checked for normalized values, they weren't present, so it fell back to recalculating, which produced incorrect values.

### Fix
1. **Re-fetch from database after upsert**: After upserting Tiingo dividends, we now re-fetch from the database to get the latest calculated `normalized_div` values.

2. **Always use database normalized values**: Changed the logic to always prefer database `normalized_div` values if available, and return `null` if not available (rather than recalculating incorrectly).

3. **Fixed calculation script bug**: Fixed `calculate_normalized_dividends.ts` to use `annualized / 52` instead of raw `amount`.

### Files Changed
- `server/src/routes/tiingo.ts` - Re-fetch from database after upsert, always use database normalized values
- `server/scripts/calculate_normalized_dividends.ts` - Fixed normalized calculation formula

### How to Verify
1. Run `npm run calc:normalized:ticker GOOY` to recalculate normalized values
2. Check the chart - Dec 25 should show 0.0869 for normalized line
3. The normalized value should match the database table

---

## Issue 2: Z-Score Values Changed for GAB and PCN

### Problem
CEO reports that:
- GAB z-score matched 2 days ago but has changed
- PCN z-score shows -1.58 but CEO calculates -1.46

### Possible Causes
1. **Rolling window**: Z-scores use a rolling 3-year window, so values change as new data comes in each day
2. **Data updates**: Price/NAV data may have been updated, changing the calculation
3. **Different date ranges**: The most recent date used for calculation may have changed

### Solution
Created an export script to provide the CEO with the exact data and calculations used.

### New Script: Export Z-Score Calculation Data

**Location**: `server/scripts/export_zscore_calculation.ts`

**Usage**:
```bash
cd server
npm run export:zscore -- --ticker GAB --nav XGABX
npm run export:zscore -- --ticker PCN --nav XPCNX
```

**Output**:
- Creates a CSV file in `server/exports/` directory
- File name: `zscore_{TICKER}_{NAV}_{DATE}.csv`
- Contains:
  - Summary section with calculation parameters
  - Current P/D, Average P/D, STDEV.P, Z-Score
  - Daily Price and NAV data for the 3-year window
  - Premium/Discount calculations for each day

**Example Output File**:
```
Z-Score Calculation Summary
====================================================================================================
Ticker: GAB
NAV Symbol: XGABX
Start Date: 2022-12-28
End Date: 2025-12-26
Data Points: 756
Current Premium/Discount: 8.11287500% (0.08112875)
Average Premium/Discount: 4.51225459% (0.04512255)
STDEV.P: 3.89711882% (0.03897119)
Z-Score: 0.92391856

====================================================================================================
Daily Price and NAV Data (3-Year Window)
====================================================================================================
Date,Price,NAV,Premium/Discount (Decimal),Premium/Discount (%)
2022-12-28,5.67,5.25,0.08000000,8.00000000%
...
```

### Z-Score Calculation Details

**Formula**:
1. Premium/Discount (P/D) = (Price / NAV) - 1.0 (as decimal)
2. Average P/D = Mean of all P/D values in 3-year window
3. STDEV.P = Population Standard Deviation: √(Σ(P/D - Average)² / n)
4. Z-Score = (Current P/D - Average P/D) / STDEV.P

**Data Range**:
- Uses exactly 3 calendar years from the most recent date with both Price and NAV
- Minimum: 252 trading days (1 year)
- Maximum: ~756 trading days (3 years)
- Uses UNADJUSTED prices only (`close`, NOT `adj_close`)

**Implementation**:
- File: `server/src/routes/cefs.ts` → `calculateCEFZScore()`
- Lines: 44-245
- Uses population standard deviation (STDEV.P, divide by n, not n-1)

### Next Steps for CEO

1. **Run export script** for GAB and PCN:
   ```bash
   npm run export:zscore -- --ticker GAB --nav XGABX
   npm run export:zscore -- --ticker PCN --nav XPCNX
   ```

2. **Compare with your Excel calculations**:
   - Check if the date ranges match
   - Verify Price and NAV values match
   - Compare P/D calculations
   - Check if Average and STDEV.P match

3. **If discrepancies found**:
   - Check the most recent date used in our calculation
   - Verify we're using unadjusted prices (not adjusted)
   - Compare the 3-year window dates

---

## Files Changed

1. `server/src/routes/tiingo.ts` - Fixed normalized value handling
2. `server/scripts/calculate_normalized_dividends.ts` - Fixed calculation formula
3. `server/scripts/export_zscore_calculation.ts` - New export script for z-score data
4. `server/package.json` - Added export:zscore script

All changes have been committed and pushed to the repository.

