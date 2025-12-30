# Simple Database Fix - CEF/ETF Separation

## Problem
CEFs and CC ETFs are mixed in the database, causing CEFs to appear in the ETF table.

## Solution
Run the SQL script `fix_database_separation.sql` in your Supabase SQL Editor.

## How to Use

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Copy and paste the entire script** from `fix_database_separation.sql`

3. **Run the script** (click "Run" or press Ctrl+Enter)

4. **Check the results**:
   - STEP 3 will show you how many CEFs and CC ETFs you have
   - STEP 4 should return 0 rows (if it returns rows, those need manual review)

## What the Script Does

**STEP 1**: Sets all CEFs (records with `nav_symbol` AND `nav` data) to `category = 'CEF'`

**STEP 2**: Sets all CC ETFs (records with `issuer` but NOT having both `nav_symbol` AND `nav` data) to `category = 'CCETF'`

**STEP 3**: Verifies the fix by counting CEFs and CC ETFs

**STEP 4**: Finds any remaining problematic records (should be 0)

## Expected Results

After running:
- All CEFs will have `category = 'CEF'`
- All CC ETFs will have `category = 'CCETF'`
- The ETF API will only return CC ETFs
- The CEF API will only return CEFs

## That's It!

Once you run this script, the database will be properly separated and the issue will be fixed permanently.

