# How CSQ Received Signal Rating +3 (High/Optimal)

## Summary

**CSQ received a Signal rating of +3 (High/Optimal) because it met ALL THREE required conditions simultaneously:**

1. ✅ **Z-Score < -1.5** (Trading at a statistically significant discount - cheap)
2. ✅ **6-Month NAV Trend > 0** (Assets growing over 6 months)
3. ✅ **12-Month NAV Trend > 0** (Assets growing over 12 months)

---

## Signal Rating System Overview

The Signal rating combines three metrics to provide an investment signal:

| Metric | What It Measures | Threshold for +3 |
|--------|------------------|-------------------|
| **Z-Score** | How cheap/expensive the CEF is relative to its 3-year average | Must be < -1.5 (cheap) |
| **6M NAV Trend** | Percentage change in Net Asset Value over 6 months | Must be > 0 (growing) |
| **12M NAV Trend** | Percentage change in Net Asset Value over 12 months | Must be > 0 (growing) |

---

## Detailed Explanation for CSQ

### Condition 1: Z-Score < -1.5 ✅

**What it means:**
- CSQ is trading at a **statistically significant discount** to its historical average
- The Z-Score measures how many standard deviations the current premium/discount is from the 3-year average
- A Z-Score of -2.12 means CSQ is trading **2.12 standard deviations below** its 3-year average premium/discount

**Why this matters:**
- Indicates the fund is **undervalued** (cheap entry point)
- Historically, when Z-Score < -1.5, the fund is in the bottom ~7% of its 3-year premium/discount range

### Condition 2: 6-Month NAV Trend > 0 ✅

**What it means:**
- CSQ's Net Asset Value has **increased over the past 6 months**
- Uses **adjusted NAV prices** (accounts for all distributions)

**Calculation:**
```
6M NAV Trend = ((Current NAV - NAV 6 months ago) / NAV 6 months ago) × 100
```

**Example for CSQ:**
- NAV 6 months ago: $18.65 (adjusted)
- Current NAV: $20.85 (adjusted)
- 6M Trend = ((20.85 - 18.65) / 18.65) × 100 = **+11.79%**

**Why this matters:**
- Shows **short-term asset health** - the underlying portfolio is growing
- Indicates the fund is not a "value trap" (cheap but shrinking)

### Condition 3: 12-Month NAV Trend > 0 ✅

**What it means:**
- CSQ's Net Asset Value has **increased over the past 12 months**
- Uses **adjusted NAV prices** (accounts for all distributions)

**Calculation:**
```
12M NAV Trend = ((Current NAV - NAV 12 months ago) / NAV 12 months ago) × 100
```

**Example for CSQ:**
- NAV 12 months ago: $17.46 (adjusted)
- Current NAV: $20.85 (adjusted)
- 12M Trend = ((20.85 - 17.46) / 17.46) × 100 = **+19.41%**

**Why this matters:**
- Shows **long-term asset health** - sustained growth over a full year
- Confirms the 6-month trend is not just a short-term blip

---

## The Decision Tree Logic

The system uses this exact logic (from our code):

```typescript
// +3: Optimal (Cheap + 6mo Health + 12mo Health)
if (Z-Score < -1.5 && 6M NAV Trend > 0 && 12M NAV Trend > 0) {
    return 3; // High/Optimal rating
}
```

**For CSQ:**
- Z-Score: -2.12 ✅ (< -1.5)
- 6M NAV Trend: +11.79% ✅ (> 0)
- 12M NAV Trend: +19.41% ✅ (> 0)

**Result: +3 (High/Optimal)**

---

## What +3 Rating Means

**CSQ's +3 rating indicates:**

1. **Value Opportunity**: Trading at a significant discount (cheap entry point)
2. **Short-Term Health**: Assets growing over 6 months (not a value trap)
3. **Long-Term Health**: Assets growing over 12 months (sustained growth)

**This is the optimal combination** - undervalued with healthy, consistent asset growth.

---

## Why All Three Conditions Are Required

The +3 rating requires **all three conditions** to prevent false signals:

- **Just cheap (Z < -1.5) alone** → Could be a value trap (cheap but assets shrinking)
- **Just growing (NAV trends > 0) alone** → Could be overvalued (growing but expensive)
- **Cheap + Growing** → Optimal investment opportunity

This makes +3 the highest rating, reserved for funds that are both undervalued AND showing consistent asset growth.

---

## Technical Notes

- **NAV Trends use adjusted prices**: All NAV calculations use `adj_close` prices from Tiingo, which account for distributions. This ensures accurate trend calculations.
- **Minimum history required**: Funds need at least 504 trading days (2 years) of history to receive a Signal rating.
- **Real-time calculation**: Signal is calculated using the latest available data from the database, with automatic refresh from Tiingo API if data is stale.

