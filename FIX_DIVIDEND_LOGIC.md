# Manual Dividend Upload Logic - Clear Rules

## Purpose
Admin uploads Excel with updated dividends 2-3 days before Tiingo has them. These manual uploads must persist until:
1. Tiingo matches the value (same amount), OR
2. Admin uploads a NEW dividend for the same date (overwrites previous manual upload)

## Rules
1. **Manual uploads are identified by description containing:**
   - "Manual upload" OR
   - "Early announcement"

2. **When Tiingo sync runs:**
   - If Tiingo has data for a date with manual upload:
     - Check if values match (within 0.001 tolerance)
     - If MATCH: Use Tiingo data (replace manual upload)
     - If NO MATCH: Keep manual upload (ignore Tiingo data)
   - If Tiingo doesn't have data for a date with manual upload:
     - Keep manual upload (preserve it)

3. **Manual uploads are NEVER overwritten by Tiingo unless values match exactly**

4. **Only admin can overwrite a manual upload by uploading a new one**

