-- Remove CEFs from ETF list by clearing nav_symbol and nav fields
-- This will make them appear as regular ETFs again
-- OR delete them entirely if you want to remove them completely

-- OPTION 1: Clear nav_symbol and nav to convert CEFs back to ETFs
-- (Use this if you want to keep the data but remove CEF classification)
UPDATE etf_static 
SET nav_symbol = NULL, 
    nav = NULL,
    premium_discount = NULL,
    five_year_z_score = NULL,
    nav_trend_6m = NULL,
    nav_trend_12m = NULL,
    value_health_score = NULL
WHERE nav_symbol IS NOT NULL 
   OR nav IS NOT NULL;

-- OPTION 2: Delete CEFs entirely
-- (Use this if you want to completely remove CEFs from the database)
-- DELETE FROM etf_static 
-- WHERE nav_symbol IS NOT NULL 
--    OR nav IS NOT NULL;

-- Check which CEFs exist before running
SELECT 
  ticker,
  nav_symbol,
  nav,
  description
FROM etf_static
WHERE nav_symbol IS NOT NULL 
   OR nav IS NOT NULL
ORDER BY ticker;

