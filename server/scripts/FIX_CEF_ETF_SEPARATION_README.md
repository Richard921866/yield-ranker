# Fix CEF/ETF Separation - SQL Script

## Problem
CEFs are appearing in the CC ETF table (showing 129 ETFs when some are actually CEFs).

## Solution
Run the SQL queries in `fix_cef_etf_separation.sql` to properly categorize all records in the database.

## How to Use

### Option 1: Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the queries from `fix_cef_etf_separation.sql`
4. Run them in order (STEP 1, then STEP 2, then STEP 3, then verification steps)

### Option 2: Database Client
1. Connect to your PostgreSQL database
2. Open `fix_cef_etf_separation.sql`
3. Run the queries in order

## Steps

### STEP 1: Identify the Problem
Run the first query to see which records need fixing.

### STEP 2: Fix CEFs
Updates all CEFs (records with nav_symbol AND nav data) to have `category = 'CEF'`.

### STEP 3: Fix CC ETFs
Updates all CC ETFs (records with issuers but no nav_symbol + nav data) to have `category = 'CCETF'`.

### STEP 4-7: Verify
Run the verification queries to confirm everything is fixed.

## What Gets Fixed

1. **CEFs**: All records with `nav_symbol` AND `nav` data will have `category = 'CEF'`
2. **CC ETFs**: All records with `issuer` but NOT having both `nav_symbol` AND `nav` data will have `category = 'CCETF'`
3. **NAV Symbol Records**: Excluded (where `ticker = nav_symbol`)

## After Running

After running these queries:
- The ETF route will only return records with `category = 'CCETF'`
- The CEF route will only return records with `category = 'CEF'`
- No more CEFs will appear in the ETF table

## Safety

These queries are safe to run multiple times. They use `WHERE` clauses to only update records that need updating.

