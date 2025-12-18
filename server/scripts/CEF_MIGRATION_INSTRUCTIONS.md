# CEF Database Migration Instructions

## Required SQL Scripts to Run

You need to run **TWO** SQL migration scripts in your Supabase SQL Editor in this order:

### 1. Add CEF Columns to `etf_static` Table

**File:** `server/scripts/add_cef_columns.sql`

**What it does:**
- Adds `nav_symbol` column (VARCHAR) - stores NAV ticker symbols like XDNPX
- Adds `open_date` column (TEXT) - fund opening/inception date
- Adds `nav` column (DECIMAL) - Net Asset Value
- Adds `premium_discount` column (DECIMAL) - Premium/Discount percentage
- Adds `five_year_z_score` column (DECIMAL) - 5 Year Z-Score
- Adds `nav_trend_6m` column (DECIMAL) - 6 Month NAV Trend
- Adds `nav_trend_12m` column (DECIMAL) - 12 Month NAV Return
- Adds `value_health_score` column (DECIMAL) - Value/Health Score
- Creates index on `nav_symbol` for faster queries

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `server/scripts/add_cef_columns.sql`
3. Click "Run" or press Ctrl+Enter
4. Verify success message

### 2. Add Category Column to `favorites` Table

**File:** `server/scripts/add_category_to_favorites.sql`

**What it does:**
- Adds `category` column (TEXT) with default value 'etf'
- Updates existing favorites to have category = 'etf'
- Creates index on category
- Updates primary key to include category (allows separate favorites for ETFs and CEFs)

**How to run:**
1. In the same SQL Editor (or new query)
2. Copy and paste the entire contents of `server/scripts/add_category_to_favorites.sql`
3. Click "Run" or press Ctrl+Enter
4. Verify success message

## Verification

After running both scripts, you can verify by running:

```sql
-- Check CEF columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'etf_static' 
AND column_name IN ('nav_symbol', 'nav', 'open_date', 'premium_discount');

-- Check category column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'favorites' 
AND column_name = 'category';
```

## Important Notes

- Run these scripts in order (CEF columns first, then category)
- These scripts use `IF NOT EXISTS` so they're safe to run multiple times
- After running, restart your application or wait a few seconds for changes to propagate
- The 400 errors for favorites will stop once the category column is added

