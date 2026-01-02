# AMDY Issues Analysis - CEO Report

## Issue 1: Frequency Detection Error (10/15/25 dividend showing "Weekly" instead of "Monthly")

### Problem
- **9/17/25 dividend**: Monthly (correct)
- **10/15/25 dividend**: Showing "Weekly" (WRONG - should be "Monthly")
- Gap between 9/17 and 10/15 = ~28 days (monthly pattern)

### Root Cause
The backward confirmation rule was looking AHEAD to the next dividend (which is weekly, 7 days later) to determine the frequency of the 10/15 dividend. However, at frequency transition points (monthly → weekly), we should use the gap FROM the previous dividend, not TO the next dividend.

### Fix Applied
Added frequency transition detection logic to `calculate_normalized_dividends.ts`:
- When processing a dividend, check if gap FROM previous indicates one frequency (monthly) and gap TO next indicates different frequency (weekly)
- If frequencies differ, use the frequency from the PREVIOUS gap (monthly) for the current dividend
- This ensures the last monthly dividend before a transition is correctly labeled as monthly

### Status
✅ **FIXED** - Transition detection logic now matches the main normalization service

---

## Issue 2: Ex-Date Mismatch (Showing 10/15 vs Tiingo's 10/16)

### Problem
- **Our system shows**: 10/15/25
- **Tiingo shows**: 10/16/25
- **CEO question**: Is this true? How do we get the date?

### Facts from Research
1. **Tiingo API**: Returns ex-dates from EOD (End-of-Day) price data where `divCash > 0`
2. **Tiingo shows 10/16/25**: Confirmed via web search - YieldMax announced on 10/15/25 that the ex-dividend date for the first weekly distribution was **10/16/25**
3. **Our data source**: We pull ex-dates directly from Tiingo's `date` field in EOD price data

### Possible Causes
1. **Timezone issue**: Tiingo may return dates in UTC, we may be converting incorrectly
2. **Data sync timing**: If we synced before Tiingo updated their data
3. **Manual override**: If there was a manual upload that overwrote Tiingo data
4. **Tiingo data error**: Less likely, but possible if Tiingo had incorrect data initially

### How We Get Ex-Dates
1. Fetch EOD price data from Tiingo API endpoint: `/tiingo/daily/{ticker}/prices`
2. Filter for records where `divCash > 0` (indicates dividend payment)
3. Use the `date` field from that record as the ex-dividend date
4. Store in database as `ex_date` field

### Recommendation
1. **Verify current Tiingo data**: Check what Tiingo API currently returns for AMDY ex-date on 10/15-10/16
2. **Check database**: Query our database to see what ex_date we have stored
3. **Check for manual overrides**: Verify if there was a manual upload that might have set 10/15
4. **Re-sync if needed**: If Tiingo shows 10/16, we should update our database to match

### Next Steps
1. Run diagnostic query to check current ex_date in database
2. Fetch fresh data from Tiingo API to verify current value
3. If mismatch exists, update database and re-run normalization

---

## Summary

**Frequency Issue**: ✅ FIXED - Transition detection now correctly identifies monthly dividends at transition points

**Ex-Date Issue**: ⚠️ NEEDS VERIFICATION - Need to check:
- What Tiingo API currently returns
- What we have in database
- If there was a manual override
- If timezone conversion is causing the issue

