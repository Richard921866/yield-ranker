# Dividend Upload Feature - Explanation for CEO

## Current System Behavior

### How Dividend Data Works Now

1. **Primary Source: Tiingo API**
   - Our system automatically fetches dividend data from Tiingo API
   - Tiingo provides:
     - Ex-dividend date (required)
     - Payment date
     - Record date
     - Declaration date
     - Dividend amount (`div_cash`)
     - Split-adjusted amount (`adj_amount`) - automatically calculated by Tiingo
     - Scaled amount (for historical comparisons)

2. **Database Storage**
   - Dividends are stored in `dividends_detail` table
   - Unique constraint: `(ticker, ex_date)` - one dividend per ticker per ex-date
   - Uses `upsert` operation: if a dividend with same ticker+ex_date exists, it gets updated

3. **Sync Process**
   - Daily sync script checks Tiingo for new dividends
   - When Tiingo updates their database, our system automatically syncs
   - The `upsert` operation means: **newer data overwrites older data**

## Proposed Feature: Manual Dividend Upload

### What Rich Wants

Rich gets dividend announcements from issuers **before** Tiingo has them in their database. He wants to:
1. Upload the new dividend announcement immediately
2. Show it on the website right away
3. Have it automatically sync when Tiingo updates their database later

### How It Would Work

#### Scenario 1: Upload Dividend Without Date

**Problem:** Rich's dividend announcement doesn't have an ex-date yet.

**Solution Options:**

1. **Option A: Use Declaration Date as Placeholder**
   - If no ex-date, use declaration date (or today's date) as temporary ex-date
   - When Tiingo syncs with actual ex-date, it will update the record
   - **Issue:** If Tiingo uses a different ex-date, we'll have duplicate entries

2. **Option B: Store as "Pending" Dividend**
   - Create a separate `pending_dividends` table
   - Store without ex-date requirement
   - When Tiingo syncs, match by amount and date range, then move to `dividends_detail`
   - **Better:** Prevents duplicates, but requires matching logic

3. **Option C: Require Estimated Ex-Date**
   - Force Rich to provide an estimated ex-date
   - When Tiingo syncs, if ex-date matches → update the record
   - If ex-date differs → create new record, mark old one as "estimated"
   - **Best:** Most accurate, prevents confusion

#### Scenario 2: Tiingo Updates 2-3 Days Later

**What Happens:**

1. **If Ex-Date Matches:**
   - Tiingo data will **overwrite** the manually uploaded dividend
   - This is good - Tiingo's data is more complete (has all dates, split adjustments, etc.)
   - The manual upload served its purpose: showed the dividend early

2. **If Ex-Date Differs:**
   - Two separate records will exist (different ex-dates)
   - This could cause confusion
   - **Solution:** Need matching logic to merge/update based on amount and date proximity

### Recommended Implementation

**Best Approach: Manual Upload with Smart Matching**

1. **Upload Requirements:**
   - Ticker (required)
   - Dividend amount (required)
   - Declaration date (required)
   - Estimated ex-date (optional but recommended)
   - Payment date (optional)

2. **Storage:**
   - Store in `dividends_detail` with a `source` field: `'manual'` or `'tiingo'`
   - If no ex-date provided, use declaration date + typical payment schedule (e.g., +7 days for monthly payers)

3. **Sync Logic:**
   - When Tiingo syncs, check for matching dividends:
     - Same ticker
     - Same ex-date (if manual had ex-date)
     - OR same amount within 7-day window
   - If match found: Update manual record with Tiingo's complete data, change source to `'tiingo'`
   - If no match: Keep both (manual shows early, Tiingo shows official)

4. **Display Priority:**
   - Show both manual and Tiingo dividends
   - Mark manual dividends with a badge: "Early Announcement" or "Pending Confirmation"
   - When Tiingo confirms, remove the badge

### Benefits

✅ **Early Visibility:** Users see dividends as soon as Rich uploads them  
✅ **Automatic Sync:** Tiingo data seamlessly updates when available  
✅ **No Duplicates:** Smart matching prevents duplicate entries  
✅ **Transparency:** Users know which dividends are confirmed vs. early announcements

### Potential Issues & Solutions

**Issue 1: No Ex-Date in Manual Upload**
- **Solution:** Use declaration date + typical payment schedule as estimate
- When Tiingo syncs, match by amount and date range

**Issue 2: Tiingo Uses Different Ex-Date**
- **Solution:** Match by amount and date proximity (±7 days)
- Update the manual record instead of creating duplicate

**Issue 3: Amount Changes Between Manual and Tiingo**
- **Solution:** Keep both records, mark manual as "Estimated"
- Show Tiingo's amount as official when available

## Current Status

**This feature is NOT yet implemented.** The current system only supports:
- DTR spreadsheet upload (static ETF data: issuer, description, payment frequency)
- Automatic Tiingo sync (prices and dividends)

To implement manual dividend upload, we would need to:
1. Create an admin endpoint: `POST /api/admin/upload-dividend`
2. Add validation for required fields
3. Implement smart matching logic for Tiingo sync
4. Add UI in Admin Panel for manual dividend entry
5. Add source tracking in database schema

## Recommendation

**Implement this feature** - it provides significant value:
- Competitive advantage (show dividends before competitors)
- Better user experience (faster updates)
- Maintains data accuracy (Tiingo sync still works)

The key is implementing smart matching to handle the "no date" and "different date" scenarios gracefully.

