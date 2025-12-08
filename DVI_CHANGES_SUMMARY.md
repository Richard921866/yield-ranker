# DVI Formula Changes - Summary for CEO

## Changes Implemented

### ✅ 1. Standard Deviation: Changed to SAMPLE (S)
- **Changed from**: Population SD (divide by n)
- **Changed to**: Sample SD (divide by n-1)
- **Formula**: `σ = √(Σ(Annualized_i - μ)² / (n-1))`
- **Reason**: Per your request and Gemini recommendation

### ✅ 2. Frequency Detection: Use Database/Website Frequency Field
- **Changed from**: Only interval-based detection
- **Changed to**: Use frequency field from database/website first
- **Priority**:
  1. **First**: Use `frequency` field from dividend record (as you base on website)
  2. **Fallback**: Interval-based detection if frequency field missing

### ✅ 3. Payment Selection: Use ALL Payments
- **Confirmed**: Uses ALL payments within 365-day period
- No "12-or-all" rule

### ✅ 4. Time Period: 365 Days
- **Confirmed**: Fixed 365 days from today
- You updated spreadsheet to match

## Current Formula

```
DVI = (SD / MEDIAN) × 100
```

Where:
- **SD** = Sample Standard Deviation (S) of annualized amounts
  - Formula: `σ = √(Σ(Annualized_i - μ)² / (n-1))`
- **MEDIAN** = Median of annualized amounts
- **Frequency**: From database field (website) first, interval detection as fallback
- **Payments**: ALL payments within 365-day period

## GOOY Weekly Payment Investigation

**Issue**: You show 8 weekly payments, website shows 7

**Possible causes**:
1. Frequency field in database may differ from interval detection
2. Different payment included/excluded at period boundaries
3. Missing dividend record in database

**Next step**: Run verification script to see:
- Which payments are included
- Frequency source for each payment (database vs interval-detected)
- Exact dates and amounts

## Verification

Run this command to see detailed breakdown:
```bash
cd server
npx tsx scripts/dvi_verification.ts GOOY TSLY QQQI
```

This will show:
- All payments with RAW, FREQ, ANNUALIZED columns
- Frequency source (database vs interval-detected)
- SD (Sample), MEDIAN, CV calculations
- Final DVI value

## Expected Alignment

After these changes, the website should match your spreadsheet:
- **GOOY**: Should match 62.35% (once frequency field issue resolved)
- **TSLY**: Should match 41.36%
- **QQQI**: Should match 5.26%

