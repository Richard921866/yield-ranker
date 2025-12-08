# Adjusted Dividend Discrepancy with Seeking Alpha

## Current Situation

### What We're Doing
We're calculating "adjusted dividends" using:
```
adj_amount = divCash × (adjClose / close)
```

This is the **scaled dividend** method recommended by Gemini/Tiingo documentation.

### What Seeking Alpha Shows
Looking at TSLY data from Seeking Alpha:
- Raw dividend: $0.0887 → Adj. Amount: **$0.4435** (5x factor)
- Raw dividend: $0.0956 → Adj. Amount: **$0.4780** (5x factor)
- Raw dividend: $0.1470 → Adj. Amount: **$0.7350** (5x factor)
- Raw dividend: $0.8020 → Adj. Amount: **$4.0100** (5x factor)
- Raw dividend: $1.2860 → Adj. Amount: **$6.4300** (5x factor)

### What We're Calculating
- Raw dividend: $0.0887 → Our adj_amount: **$0.4279** (4.82x factor)
- Raw dividend: $0.0956 → Our adj_amount: **$0.4669** (4.88x factor)
- Raw dividend: $0.1470 → Our adj_amount: **$0.6917** (4.71x factor)

**Our values are LOWER than Seeking Alpha's adjusted dividends.**

## The Problem

1. **Different Calculation Methods**: Seeking Alpha may be using a different formula or data source
2. **Cumulative Adjustment Factor**: Seeking Alpha might be using a cumulative adjustment factor that accounts for ALL historical splits, not just the ratio on the ex-date
3. **Tiingo API Limitation**: Tiingo may not provide a direct "adjusted dividend" field - we're calculating it ourselves

## Why This Matters

- **DVI Calculation**: Uses adjusted dividends, so incorrect values = incorrect DVI
- **Comparability**: Can't compare our metrics with Seeking Alpha if we're using different methods
- **CEO Confusion**: The discrepancy makes it unclear which is "correct"

## Solution

### Immediate Action Required

1. **Contact Tiingo Support/Sales** to ask:
   - "What is the exact API endpoint or field to get adjusted dividends that match industry standards (like Seeking Alpha)?"
   - "Do you provide a pre-calculated adjusted dividend field, or must we calculate it ourselves?"
   - "What formula do you recommend for reverse split adjustments to match other data providers?"

2. **Verify Our Calculation**:
   - Our current method: `divCash × (adjClose/close)` on ex-date
   - This may need to be: `divCash × cumulative_adjustment_factor` (calculated from inception)

3. **Check Seeking Alpha's Method**:
   - They may be using a cumulative factor that accounts for ALL splits since inception
   - This would explain why their adjusted amounts are consistently higher

## Technical Details

### Current Implementation
```typescript
// In tiingo.ts
adjDividend = divCash × (adjClose / close)  // On ex-date only
```

### Possible Correct Implementation
```typescript
// May need cumulative adjustment factor
adjDividend = divCash × cumulative_adjustment_factor_from_inception
```

The cumulative factor would be calculated by:
1. Finding all split events since inception
2. Calculating the product of all split factors
3. Applying that to historical dividends

## Next Steps

1. ✅ **Contact Tiingo Support** - Get exact method for adjusted dividends
2. ⏳ **Implement Correct Method** - Once we know the right formula
3. ⏳ **Re-sync All Historical Data** - Recalculate all adjusted dividends from inception
4. ⏳ **Verify Against Seeking Alpha** - Ensure our values match

## CEO Summary

**Why our adjusted dividends don't match Seeking Alpha:**

1. **Different Calculation Methods**: We're using `divCash × (adjClose/close)` on the ex-date, but Seeking Alpha may be using a cumulative adjustment factor from inception.

2. **Tiingo API Limitation**: Tiingo doesn't provide a direct "adjusted dividend" field - we're calculating it ourselves, and we may not be using the same method as Seeking Alpha.

3. **Solution**: We need to contact Tiingo support to get the exact method they recommend for calculating adjusted dividends that match industry standards.

**Action Required**: Contact Tiingo support/sales to get the exact code/method for adjusted dividends.

