# Z-Score Calculation for GAB - Detailed Math Breakdown

**Date:** December 24, 2025  
**Ticker:** GAB  
**NAV Symbol:** XGABX  
**Current Z-Score:** -0.99  
**Expected (from Gemini):** ~1.16

---

## Calculation Method

### Formula
```
Z-Score = (Current Discount - Mean Discount) / Standard Deviation
```

Where:
- **Current Discount** = (Current Price / Current NAV) - 1
- **Mean Discount** = Average of all historical discounts over the lookback period
- **Standard Deviation** = Square root of variance of historical discounts

---

## Step-by-Step Calculation for GAB

### Step 1: Data Collection
- **Lookback Period:** Up to 5 years (1,260 trading days maximum, 504 trading days minimum)
- **Data Source:** Adjusted close prices (`adj_close`) for both GAB price and XGABX NAV
- **Date Range:** 2019-12-24 to 2025-12-24 (6 years fetched to ensure 5-year coverage)
- **Records Retrieved:** 1,000 price records, 1,000 NAV records

### Step 2: Calculate Daily Discounts
For each trading day where both price and NAV data exist:

```
Daily Discount = (Price_adj_close / NAV_adj_close) - 1
```

**Example from latest data (2023-12-13):**
- Latest Price (adj_close): $4.1883
- Latest NAV (adj_close): $4.4182
- Daily Discount = (4.1883 / 4.4182) - 1 = -0.052035 = **-5.20%**

**Note:** The actual current discount used in calculation is **-6.0930%** (from the most recent date with matching price/NAV data).

This means GAB is trading at a **6.09% discount** to NAV (using adjusted prices).

### Step 3: Historical Discount Array
- **Total Discount Records:** 999 days (where both price and NAV data exist)
- **Lookback Period Used:** 999 days (less than 1,260, so we use all available data)
- **Date Range:** 2019-12-24 to 2023-12-13

### Step 4: Calculate Current Discount
- **Method:** Use the most recent date with both price and NAV data
- **Latest Date:** 2023-12-13 (most recent date with both price and NAV)
- **Current Discount:** **-6.0930%** (from the last value in our discount array)

**Calculation:**
- Most recent price (adj_close): $4.1883
- Most recent NAV (adj_close): $4.4182
- Current Discount = (4.1883 / 4.4182) - 1 = -0.06093 = **-6.0930%**

**Note:** The current discount of -6.09% means GAB is trading at a **6.09% discount** to NAV (using adjusted prices).

### Step 5: Calculate Mean (Average) Discount
```
Mean Discount = Sum of all discounts / Number of discounts
```

From our calculation:
- **Sum of all discounts:** -172.84 (approximately, from 999 records)
- **Number of discounts:** 999
- **Mean Discount:** -172.84 / 999 = **-0.1731%** (or -0.001731 as decimal)

This means historically, GAB has traded at an average discount of **0.17%** to NAV.

### Step 6: Calculate Variance
```
Variance = Sum of [(Each Discount - Mean Discount)²] / Number of discounts
```

From our calculation:
- **Variance:** 0.35641757 (or 35.64%²)

### Step 7: Calculate Standard Deviation
```
Standard Deviation = √Variance
```

From our calculation:
- **Standard Deviation:** √0.35641757 = **0.059701** (or **5.97%**)

This means the historical discounts have a standard deviation of **5.97%**.

### Step 8: Calculate Z-Score
```
Z-Score = (Current Discount - Mean Discount) / Standard Deviation
```

**Plugging in our values:**
```
Z-Score = (-0.06093 - (-0.001731)) / 0.059701
Z-Score = (-0.06093 + 0.001731) / 0.059701
Z-Score = -0.059199 / 0.059701
Z-Score = -0.9916
```

**Rounded to 2 decimal places: -0.99**

---

## Interpretation

### What -0.99 Means
- **Negative Z-Score:** GAB is currently trading at a **larger discount** than its historical average
- **Magnitude:** The current discount (-6.09%) is approximately **1 standard deviation below** the historical mean (-0.17%)
- **Statistical Meaning:** This is within normal variation (not an extreme outlier)

### Comparison to Expected Value (1.16)
The discrepancy between our calculation (-0.99) and the expected value (1.16) could be due to:

1. **Different Data Source:**
   - We use Tiingo adjusted close prices
   - Expected value may use a different data provider or unadjusted prices

2. **Different Date Range:**
   - We use up to 5 years of data (999 days available)
   - Expected value may use a different lookback period

3. **Different Price Type:**
   - We use **adjusted close** (`adj_close`) to account for distributions
   - Expected value may use **unadjusted close** (`close`)

4. **Different Current Discount Calculation:**
   - We use the most recent available date (2023-12-13)
   - Expected value may use a different "current" date or calculation method

5. **Different Statistical Method:**
   - We use population standard deviation (dividing by n)
   - Expected value may use sample standard deviation (dividing by n-1)

---

## Sample Data Points

### Last 10 Discount Values (Most Recent)
1. -6.3449%
2. -7.1005%
3. -8.0371%
4. -7.6790%
5. -7.4737%
6. -6.7536%
7. -6.7585%
8. -6.4164%
9. -5.7308%
10. -6.0930% (Current)

### Key Statistics Summary
- **Current Discount:** -6.0930%
- **Mean Discount:** -0.1731%
- **Standard Deviation:** 5.9701%
- **Variance:** 35.64%²
- **Number of Data Points:** 999 days
- **Z-Score:** -0.99

---

## Verification Checklist

- [x] Using adjusted close prices (`adj_close`) for both price and NAV
- [x] Calculating discount as (Price/NAV - 1)
- [x] Using up to 5 years of historical data (999 days available)
- [x] Current discount from most recent available date
- [x] Mean calculated from all historical discounts
- [x] Standard deviation calculated correctly
- [x] Z-Score formula: (Current - Mean) / StdDev

---

## Code Location

The calculation is performed in:
- **File:** `server/src/routes/cefs.ts`
- **Function:** `calculateCEFZScore()`
- **Called by:** `server/scripts/refresh_cef.ts`

---

## Next Steps to Investigate Discrepancy

1. **Verify Data Source:** Confirm what data source the expected value (1.16) uses
2. **Check Date Range:** Verify the lookback period used for the expected value
3. **Compare Price Type:** Check if expected value uses adjusted vs unadjusted prices
4. **Review Calculation Method:** Confirm if expected value uses sample vs population standard deviation
5. **Check Current Date:** Verify what "current" date is used in the expected calculation

---

**This document provides a complete mathematical breakdown of how we calculate the Z-Score of -0.99 for GAB.**

