# Dividend Upload Explanation for CEO

## How Dividend Uploads Work

**The Issue:**
When you upload a dividend manually through the admin panel, it gets saved to the database with a special flag (`is_manual: true`). However, our daily refresh script (`npm run refresh:all`) pulls fresh dividend data from the Tiingo API every day.

**The Problem:**
- If you upload a dividend on Monday for a CEF
- The refresh script runs on Tuesday and pulls fresh data from Tiingo
- Tiingo might have new dividend data that overwrites or conflicts with your manual upload
- Your manual dividend will only persist if it matches exactly what Tiingo has, OR if you upload it again before each refresh

**Why This Happens:**
The refresh script is designed to keep all data current with the latest market information. It treats Tiingo as the authoritative source for dividend data, so manual uploads can get overwritten.

**The Solution - Two Options:**

1. **Upload Latest Dividend Each Day** (Before Refresh Script Runs)
   - If you want to ensure your manual dividend stays in the system, upload the latest dividend each day before the refresh script runs
   - This way, your manual dividend will be the most recent and won't get overwritten

2. **Wait for Tiingo to Catch Up** (Recommended)
   - Tiingo typically gets dividend data 2-3 days after announcement
   - Your manual upload will persist until Tiingo catches up
   - Once Tiingo has the data, it will naturally replace your manual entry
   - This is the most reliable approach - let the system handle it automatically

**Current System Behavior:**
- Manual dividends are marked with `is_manual: true`
- The system prioritizes manual dividends when displaying data
- However, the refresh script will still pull fresh data from Tiingo daily
- If Tiingo has newer data, it will update the records

**Recommendation:**
Use manual dividend uploads only when:
- You need to enter data before Tiingo has it (2-3 day window)
- You're testing or debugging the system
- There's a discrepancy you need to correct immediately

For regular operations, let the daily refresh script handle dividend updates automatically - it will keep everything current without manual intervention.

