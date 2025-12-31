# NAV Trend Calculation Analysis - CSQ (XCSQX)

## Executive Summary

**We ARE using ADJUSTED prices** (adj_close), which is correct. However, there are **date discrepancies** causing the calculation differences.

---

## CEO's Data (from Tiingo - Adjusted Prices)

| Date | Adjusted Price | Notes |
|------|----------------|-------|
| 12/29/25 | $20.85 | Current |
| 6/29/25 | $18.65 | 6 months ago |
| 12/30/24 | $17.46 | 12 months ago |

**CEO's Calculations:**
- **6M NAV Trend**: (20.85 - 18.65) / 18.65 × 100 = **11.80%**
- **12M NAV Trend**: (20.85 - 17.46) / 17.46 × 100 = **19.42%**

---

## Our Calculation (from Database/API - Adjusted Prices)

| Date | Adjusted Price | Notes |
|------|----------------|-------|
| 12/24/25 | $20.97 | Current (last available) |
| 6/24/25 | $18.21 | 6 months ago (calculated from 12/24/25) |
| 12/24/24 | $17.89 | 12 months ago (calculated from 12/24/24) |

**Our Calculations:**
- **6M NAV Trend**: (20.97 - 18.21) / 18.21 × 100 = **15.15%**
- **12M NAV Trend**: (20.97 - 17.89) / 17.89 × 100 = **17.20%**

---

## The Discrepancy

### Issue #1: Different Current Date

- **CEO uses**: 12/29/25 (specific end-of-month date)
- **We use**: 12/24/25 (last available data date in database)

**Impact**: 5-day difference in current date

### Issue #2: Different 6-Month Date

- **CEO uses**: 6/29/25 (exactly 6 months from 12/29/25)
- **We use**: 6/24/25 (exactly 6 months from 12/24/25)

**Impact**: 5-day difference, and different adjusted prices:
- CEO's 6/29/25: $18.65
- Our 6/24/25: $18.21
- Difference: $0.44 (2.4% lower)

### Issue #3: Different 12-Month Date

- **CEO uses**: 12/30/24 (exactly 12 months from 12/29/25)
- **We use**: 12/24/24 (exactly 12 months from 12/24/25)

**Impact**: 6-day difference, and different adjusted prices:
- CEO's 12/30/24: $17.46
- Our 12/24/24: $17.89
- Difference: $0.43 (2.5% higher)

---

## Why the Differences?

### 1. Date Selection Method

**CEO's Method:**
- Uses specific calendar dates (end-of-month: 12/29, 6/29, 12/30)
- These dates may be manually selected or from a specific data source

**Our Method:**
- Uses the **last available data date** in the database (12/24/25)
- Calculates 6/12 months **backward from that date** (6/24/25, 12/24/24)
- This ensures we always use the most recent available data

### 2. Data Source Timing

**CEO's Data:**
- From Tiingo, likely fetched on or after 12/29/25
- Has data for 12/29/25

**Our Data:**
- From database (prices_daily table)
- Last available date: 12/24/25 (may not have been updated with 12/29 data yet)
- Falls back to Tiingo API if database is empty, but uses database if available

### 3. Adjusted Price Differences

Even on nearby dates, adjusted prices can differ slightly:
- 2024-12-30: Adj Close = $17.46 (matches CEO's 12/30/24) ✓
- 2025-06-30: Adj Close = $18.65 (matches CEO's 6/29/25) ✓
- But we're using 12/24/24 = $17.89 and 6/24/25 = $18.21

---

## Verification: What We're Actually Using

### Current Code (server/src/routes/cefs.ts):

```typescript
// Line 333-335: We ARE using adjusted prices
const currentNav = currentRecord.adj_close ?? currentRecord.close;
const past6MNav = past6MRecord.adj_close ?? past6MRecord.close;
```

**✅ CONFIRMED: We ARE using ADJUSTED prices (adj_close)**

### Date Selection Logic:

```typescript
// Line 290: Uses last available data date
const currentDate = new Date(currentRecord.date + "T00:00:00");

// Line 291-292: Calculates 6 months backward from that date
const sixMonthsAgo = new Date(currentDate);
sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
```

**✅ CONFIRMED: We calculate dates backward from last available date**

---

## The Root Cause

**The discrepancy is caused by:**
1. **Different current dates**: CEO uses 12/29/25, we use 12/24/25 (last available)
2. **Different historical dates**: CEO uses 6/29/25 and 12/30/24, we use 6/24/25 and 12/24/24
3. **Different adjusted prices** on those different dates

**NOT caused by:**
- ❌ Using unadjusted prices (we ARE using adjusted prices)
- ❌ Wrong formula (formula is correct: (Current - Past) / Past × 100)
- ❌ Wrong data source (we use Tiingo, same as CEO)

---

## Solution Options

### Option 1: Use Specific Calendar Dates (Match CEO)

**Change**: Use specific end-of-month dates instead of last available date
- Current: Use 12/29/25 (or last trading day of month)
- 6M Ago: Use 6/29/25 (or last trading day 6 months ago)
- 12M Ago: Use 12/30/24 (or last trading day 12 months ago)

**Pros**: Matches CEO's calculation exactly
**Cons**: May not have data for those specific dates, requires fallback logic

### Option 2: Use Last Trading Day of Month

**Change**: Find the last trading day of the current month, then calculate backward
- Current: Last trading day of current month
- 6M Ago: Last trading day 6 months ago
- 12M Ago: Last trading day 12 months ago

**Pros**: More consistent, still uses recent data
**Cons**: Still may differ from CEO's specific dates

### Option 3: Keep Current Method, Document Difference

**Change**: Keep using last available date, but document that dates may differ
**Pros**: Always uses most recent data, no code changes
**Cons**: Will continue to differ from CEO's calculation

---

## Recommendation

**Option 1** is recommended to match CEO's calculation exactly. We should:
1. Use specific calendar dates (12/29, 6/29, 12/30) or find the closest available date
2. If exact date not available, use the closest date within ±2 days
3. Update the code to use these specific dates instead of calculating backward from last available date

---

## Current Status

- ✅ **Using Adjusted Prices**: Confirmed (adj_close)
- ✅ **Formula Correct**: (Current - Past) / Past × 100
- ✅ **Data Source**: Tiingo (same as CEO)
- ❌ **Date Selection**: Different from CEO (using last available vs specific dates)

---

## Next Steps

1. Update code to use specific calendar dates (end-of-month) instead of last available date
2. Add fallback logic to find closest available date if exact date not found
3. Re-run calculation and verify it matches CEO's results
4. Update documentation to reflect date selection method

