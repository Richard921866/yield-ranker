-- ============================================================================
-- SIMPLE SQL SCRIPT TO FIX CEF/ETF SEPARATION IN DATABASE
-- ============================================================================
-- Run this in Supabase SQL Editor
-- This will ensure CEFs and CC ETFs are properly separated
-- ============================================================================

-- STEP 1: Set all CEFs to category = 'CEF'
-- CEFs are identified by having nav_symbol AND nav data
UPDATE etf_static
SET category = 'CEF'
WHERE 
    nav IS NOT NULL 
    AND nav != 0 
    AND nav_symbol IS NOT NULL 
    AND nav_symbol != ''
    AND ticker != nav_symbol;

-- STEP 2: Set all CC ETFs to category = 'CCETF'
-- CC ETFs are identified by having an issuer but NOT having nav_symbol + nav data
UPDATE etf_static
SET category = 'CCETF'
WHERE 
    -- Not a CEF (doesn't have nav_symbol + nav data)
    NOT (nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '')
    -- Has an issuer (real CC ETFs have issuers)
    AND issuer IS NOT NULL 
    AND issuer != ''
    -- Not a NAV symbol record
    AND (ticker != nav_symbol OR nav_symbol IS NULL OR nav_symbol = '');

-- STEP 3: Verify the fix
-- Check how many CEFs and CC ETFs we have
SELECT 
    'CEFs' as type,
    COUNT(*) as count
FROM etf_static
WHERE category = 'CEF'
    AND nav IS NOT NULL 
    AND nav != 0 
    AND nav_symbol IS NOT NULL 
    AND nav_symbol != ''
    AND ticker != nav_symbol

UNION ALL

SELECT 
    'CC ETFs' as type,
    COUNT(*) as count
FROM etf_static
WHERE category = 'CCETF'
    AND NOT (nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '')
    AND issuer IS NOT NULL 
    AND issuer != '';

-- STEP 4: Find any problematic records (should return 0 rows)
SELECT 
    ticker,
    category,
    CASE 
        WHEN nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '' THEN 'SHOULD BE CEF'
        WHEN issuer IS NOT NULL AND issuer != '' THEN 'SHOULD BE CCETF'
        ELSE 'NEEDS MANUAL REVIEW'
    END AS should_be
FROM etf_static
WHERE 
    (category IS NULL OR category NOT IN ('CEF', 'CCETF'))
    AND (ticker != nav_symbol OR nav_symbol IS NULL OR nav_symbol = '')
ORDER BY ticker;

