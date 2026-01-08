# Frequency Calculation Bug Fix

## Problem Identified

**Issue**: Dividend frequency was incorrectly calculated as Monthly when it should be Weekly.

**Example**: 
- Date gap: 12/31/25 to 1/7/26 = **7 days**
- Expected: **Weekly** (52 payments/year)
- Actual: **Monthly** (12 payments/year) ❌

## Root Cause

The transition detection logic was incorrectly overriding the correct frequency calculation. When there was a frequency transition (e.g., from monthly to weekly), the code was using the **PREVIOUS frequency** instead of recognizing that a 7-day gap clearly indicates Weekly.

### The Bug:
1. Previous gap might be ~28 days (Monthly pattern)
2. Next gap is 7 days (Weekly pattern)
3. Transition detected → Code used PREVIOUS frequency (Monthly) ❌
4. Should have used NEXT gap frequency (Weekly) ✓

## The Fix

**New Priority Logic**:
1. **PRIORITY 1**: If gap to next is **5-10 days** → **ALWAYS Weekly** (52)
   - This ensures 7 days = Weekly, not Monthly
   - Clear and unambiguous - no transition detection override

2. **PRIORITY 2**: If gap to next is **20-40 days** → **ALWAYS Monthly** (12)
   - Clear and unambiguous - no transition detection override

3. **PRIORITY 3**: Transition detection only applies for **ambiguous gaps** (11-19 days, 41-59 days, etc.)
   - Only use previous frequency if:
     - Previous gap is clearly in a frequency range
     - Next gap is ambiguous (not clearly weekly or monthly)
     - Previous frequency is clearly established

## Files Fixed

1. `server/src/services/dividendNormalization.ts` - Main service function
2. `server/scripts/calculate_normalized_dividends.ts` - Backfill script (2 locations)

## Action Required

**You MUST run the recalculation script** to fix all existing data:

```bash
cd server
npm run ts-node scripts/calculate_normalized_dividends.ts
```

Or for a specific ticker:
```bash
npm run ts-node scripts/calculate_normalized_dividends.ts --ticker TICKER_NAME
```

This will:
- Recalculate all frequency_num values
- Recalculate annualized values (adj_amount × frequency_num)
- Recalculate normalized_div values (annualized / 52)
- Update the database with correct values

## Prevention

The fix ensures that:
- **Clear weekly gaps (5-10 days) are ALWAYS Weekly** - no exceptions
- **Clear monthly gaps (20-40 days) are ALWAYS Monthly** - no exceptions
- Transition detection only applies to ambiguous cases
- Frequency calculation is now **always correct** for all ETFs and CEFs

## Testing

After running the script, verify:
- 7-day gaps show as Weekly
- 28-day gaps show as Monthly
- Frequency is always accurate based on actual date gaps

