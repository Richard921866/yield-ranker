# Dividend Upload Feature - Implementation & How It Works

## Overview

This feature allows Rich to upload the latest dividend announcements from issuers **before** Tiingo has them in their database. The system automatically handles matching when Tiingo syncs later.

## Excel Format

Rich's Excel file should have these columns:

**Required:**
- `Symbol` or `Ticker` - ETF ticker symbol
- `Div` or `Dividend` - Dividend amount per share

**Optional:**
- `Ex Date` or `Ex-Date` - Ex-dividend date (if missing, estimated from payment frequency)
- `Declare Date` or `Declaration Date` - Declaration date (defaults to today if missing)
- `Pay Date` or `Payment Date` - Payment date

**Example:**
```
Symbol | Div    | Ex Date   | Declare Date | Pay Date
TSLY   | 1.3015 | 2025-01-15| 2025-01-10   | 2025-01-20
AMDY   | 0.5000 |           | 2025-01-12   |
```

## How It Works

### Step 1: Manual Upload

1. Rich uploads Excel file via Admin Panel → "Upload Latest Dividends"
2. System reads each row:
   - Extracts ticker and dividend amount
   - If `Ex Date` provided: uses it
   - If `Ex Date` missing: estimates based on `Declare Date` + typical payment schedule
     - For monthly payers: ~30 days after declaration
     - For weekly payers: ~7 days after declaration
   - Marks dividend with description: "Manual upload - Early announcement"
3. Dividends are saved to `dividends_detail` table
4. **Metrics are automatically recalculated** for affected tickers:
   - Annual dividend
   - DVI (Dividend Volatility Index)
   - Forward yield
   - Total returns (all time periods)
   - Price returns

### Step 2: Tiingo Sync (2-3 Days Later)

When Tiingo updates their database, our daily sync script runs:

1. Fetches dividends from Tiingo API
2. **Smart Matching Algorithm:**
   - For each Tiingo dividend, checks for manual uploads:
     - **Exact match:** Same ticker + same ex-date → Updates the record
     - **Fuzzy match:** Same ticker + same amount + within ±7 days → Updates the record
   - If match found: Tiingo data overwrites manual data (Tiingo has complete info)
   - If no match: Both records kept (manual shows early, Tiingo shows official)
3. Metrics are recalculated again with the updated data

## Recalculation - How It Works & Why It's Safe

### What Gets Recalculated

When a new dividend is uploaded, `calculateMetrics()` is called automatically. This function:

1. **Fetches ALL dividends** from the last 2 years (not just the new one)
2. **Recalculates everything from scratch:**
   - **Annual Dividend:** Sums all dividends in the last 12 months (using adjusted amounts)
   - **DVI:** 
     - Annualizes each dividend payment
     - Calculates standard deviation of annualized amounts
     - Calculates average (mean) of annualized amounts
     - DVI = (SD / Average) × 100
   - **Total Returns:** Recalculates all time periods (1W, 1M, 3M, 6M, 1Y, 3Y) using DRIP methodology
   - **Price Returns:** Recalculates all time periods using price changes only

### Why This Doesn't "Throw Things Off"

**✅ Safe because:**

1. **Full Recalculation:** We don't just add the new dividend to old calculations. We recalculate everything from scratch using ALL dividends. This ensures accuracy.

2. **Uses Adjusted Amounts:** All calculations use `adj_amount` (split-adjusted) when available, ensuring consistency even after stock splits.

3. **Time-Based Windows:** 
   - Annual dividend uses last 12 months (rolling window)
   - DVI uses last 12 months of annualized payments
   - Returns use specific time periods (1W, 1M, etc.)
   - Adding a new dividend only affects calculations if it falls within these windows

4. **Automatic Updates:** When Tiingo syncs and updates the dividend with official data, metrics are recalculated again automatically.

### Example: Adding a New Dividend

**Before Upload:**
- Last 12 months: 11 dividends totaling $60.00
- Annual Dividend: $60.00
- DVI: 25.5%

**After Upload (New $5.00 dividend):**
- Last 12 months: 12 dividends totaling $65.00
- Annual Dividend: $65.00 (updated)
- DVI: Recalculated with 12 annualized payments (new one included)
- All returns recalculated if new dividend affects those time periods

**After Tiingo Sync (Updates dividend with official data):**
- Same 12 dividends, but one updated with official ex-date and split adjustments
- Annual Dividend: Recalculated (may change slightly if adj_amount differs)
- DVI: Recalculated with official data
- All metrics now reflect official data

## Database Schema

The `dividends_detail` table stores:
- `ticker` + `ex_date` (unique constraint)
- `div_cash` - Raw dividend amount
- `adj_amount` - Split-adjusted amount (used for calculations)
- `description` - "Manual upload - Early announcement" for manual uploads
- Other fields: pay_date, record_date, declare_date, etc.

## API Endpoint

**POST** `/api/etfs/upload-dividends`

**Request:** Multipart form data with Excel file

**Response:**
```json
{
  "success": true,
  "dividendsAdded": 5,
  "skippedRows": 0,
  "metricsRecalculated": 5,
  "metricsFailed": 0,
  "recalcResults": [
    { "ticker": "TSLY", "success": true },
    { "ticker": "AMDY", "success": true }
  ],
  "message": "Successfully uploaded 5 dividend(s) and recalculated metrics for 5 ticker(s)",
  "note": "When Tiingo syncs, it will automatically match and update these dividends with official data"
}
```

## Benefits

1. **Early Visibility:** Show dividends before competitors
2. **Automatic Sync:** Tiingo data seamlessly updates when available
3. **No Duplicates:** Smart matching prevents duplicate entries
4. **Accurate Metrics:** Full recalculation ensures all metrics are correct
5. **Transparency:** Manual dividends marked as "Early announcement"

## Troubleshooting

**Issue:** Dividend uploaded but not showing in calculations
- **Check:** Is the ex-date within the last 12 months? Older dividends won't affect annual calculations.

**Issue:** Tiingo sync created duplicate
- **Check:** Matching algorithm should prevent this. If it happens, check if ex-dates differ significantly (>7 days).

**Issue:** Metrics seem wrong after upload
- **Check:** Run `npm run refresh:ticker TICKER` to force full recalculation from scratch.

