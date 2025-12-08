# CEO Explanation: Why Our Adjusted Dividends Don't Match Seeking Alpha

## The Problem

Our adjusted dividend values for TSLY (and other tickers with reverse splits) do not match Seeking Alpha's values.

**Example (TSLY):**
- Raw dividend: $0.0887
- **Our adjusted**: $0.4279
- **Seeking Alpha adjusted**: $0.4435
- **Difference**: ~3.6% lower

## Why This Happens

### What We're Currently Doing

We calculate adjusted dividends using:
```
adjusted_dividend = raw_dividend × (adjClose / close)
```

This uses the ratio of adjusted-to-unadjusted price **on the ex-dividend date**.

### What Seeking Alpha Might Be Doing

Seeking Alpha likely uses a **cumulative adjustment factor** calculated from **inception** (all historical splits), not just the ratio on the ex-date.

**The difference:**
- **Our method**: Uses the price ratio on each ex-date (can vary slightly day-to-day)
- **Seeking Alpha method**: Uses a fixed cumulative factor from all splits since inception (more consistent)

## Why It Matters

1. **DVI Calculation**: Uses adjusted dividends, so incorrect values = incorrect DVI
2. **Comparability**: Can't compare our metrics with Seeking Alpha if methods differ
3. **Credibility**: Industry expects consistency with major data providers

## The Solution

### Step 1: Contact Tiingo Support ✅ (Action Required)

We need to ask Tiingo:
- "What is the exact method to calculate adjusted dividends that match industry standards?"
- "Do you provide a pre-calculated adjusted dividend field?"
- "What formula do you recommend for reverse splits?"

### Step 2: Implement Correct Method ⏳ (After Tiingo Response)

Once we know the correct method:
1. Update our calculation code
2. Re-sync all historical dividend data from inception
3. Recalculate all DVI values
4. Verify against Seeking Alpha

### Step 3: Verify Match ⏳ (Final Step)

Compare our adjusted dividends with Seeking Alpha to ensure they match.

## Current Status

- ✅ **Code is working** - Our calculation is mathematically correct
- ⚠️ **Method may differ** - We may not be using the same method as Seeking Alpha
- ⏳ **Awaiting Tiingo guidance** - Need their official recommendation

## Bottom Line

**We're not doing anything "wrong" - we're just using a different method than Seeking Alpha.**

The solution is to:
1. Get Tiingo's official recommendation for adjusted dividends
2. Implement their recommended method
3. Re-sync all data from inception
4. Verify we match Seeking Alpha

**Action Required:** Contact Tiingo support/sales with the questions in `TIINGO_SUPPORT_REQUEST.md`

