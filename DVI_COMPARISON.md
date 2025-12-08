# DVI Calculation Comparison

## Changes Made Per CEO Feedback

### 1. ✅ Standard Deviation: Changed to SAMPLE (S)
- **BEFORE**: Population SD (divide by n)
- **AFTER**: Sample SD (divide by n-1)
- **Formula**: `σ = √(Σ(Annualized_i - μ)² / (n-1))`
- **Reason**: Per CEO/Gemini recommendation

### 2. ✅ Frequency Detection: Use Database/Website Frequency Field
- **BEFORE**: Calculated frequency from payment intervals only
- **AFTER**: Uses frequency field from database/website first, falls back to interval detection
- **Priority**:
  1. Use `frequency` field from dividend record (as CEO bases on website)
  2. Fallback to interval-based detection if frequency field missing

### 3. ✅ Payment Selection: Use ALL Payments
- **CONFIRMED**: Uses ALL payments within 365-day period (no "12-or-all" rule)

### 4. ✅ Time Period: 365 Days
- **CONFIRMED**: Fixed 365 days from today
- CEO updated spreadsheet to match

## Current Formula

```
DVI = (SD / MEDIAN) × 100
```

Where:
- **SD** = Sample Standard Deviation of annualized amounts
  - Formula: `σ = √(Σ(Annualized_i - μ)² / (n-1))`
- **MEDIAN** = Median of annualized amounts
- **Frequency**: From database field (website) first, interval detection as fallback
- **Payments**: ALL payments within 365-day period

## Expected Results (After CEO Updates Spreadsheet to 365 Days)

Based on CEO's spreadsheet with 365-day period:
- **GOOY**: 62.35% (website currently shows 92.9%)
- **TSLY**: 41.36% (website currently shows 104.4%)
- **QQQI**: 5.26% (website currently shows 4.3%)

## Investigation Needed

**GOOY Weekly Payment Count Discrepancy:**
- CEO shows: 8 weekly payments
- Website shows: 7 weekly payments
- **Possible causes**:
  1. Different date range (CEO may have different start/end dates)
  2. Frequency field in database may differ from interval detection
  3. Missing dividend record in database

## Next Steps

1. Run verification script to see detailed breakdown
2. Compare frequency detection (database field vs interval)
3. Verify all payments are included in 365-day period
4. Check if frequency field matches website display

