-- ============================================================================
-- SQL Script to Fix CEF/ETF Separation Issue
-- ============================================================================
-- This script ensures CEFs and CC ETFs are properly separated in the database
-- Run these queries in your Supabase SQL Editor or database client
-- ============================================================================

-- ============================================================================
-- STEP 1: Identify CEFs that might be showing in ETF table
-- ============================================================================

-- Find all records that have nav_symbol AND nav data (these are CEFs)
-- but might have wrong category or missing category
SELECT 
    ticker,
    category,
    nav_symbol,
    nav,
    issuer,
    description,
    CASE 
        WHEN nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '' THEN 'CEF'
        WHEN category = 'CCETF' THEN 'CCETF'
        ELSE 'UNKNOWN'
    END AS should_be_category
FROM etf_static
WHERE 
    -- Records with nav_symbol and nav data (should be CEFs)
    (nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '')
    -- OR records that might be mis-categorized
    OR (category IS NULL OR category NOT IN ('CEF', 'CCETF'))
ORDER BY ticker;

-- ============================================================================
-- STEP 2: Update CEFs to have category = 'CEF'
-- ============================================================================

-- Set category = 'CEF' for all records that have nav_symbol AND nav data
UPDATE etf_static
SET category = 'CEF'
WHERE 
    nav IS NOT NULL 
    AND nav != 0 
    AND nav_symbol IS NOT NULL 
    AND nav_symbol != ''
    AND ticker != nav_symbol  -- Exclude NAV symbol records (where ticker = nav_symbol)
    AND (category IS NULL OR category != 'CEF');

-- ============================================================================
-- STEP 3: Update CC ETFs to have category = 'CCETF'
-- ============================================================================

-- Set category = 'CCETF' for records that:
-- 1. Do NOT have nav_symbol AND nav data (not CEFs)
-- 2. Have an issuer (real CC ETFs have issuers)
-- 3. Are not NAV symbol records
UPDATE etf_static
SET category = 'CCETF'
WHERE 
    -- Not a CEF (no nav_symbol + nav data combination)
    NOT (nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '')
    -- Has an issuer (real CC ETFs have issuers)
    AND issuer IS NOT NULL 
    AND issuer != ''
    -- Not a NAV symbol record
    AND (ticker != nav_symbol OR nav_symbol IS NULL OR nav_symbol = '')
    -- Not already set to CEF
    AND category != 'CEF'
    -- Either NULL or not CCETF
    AND (category IS NULL OR category != 'CCETF');

-- ============================================================================
-- STEP 4: Verify the fix - Check category distribution
-- ============================================================================

-- Count records by category
SELECT 
    category,
    COUNT(*) as count,
    COUNT(CASE WHEN nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '' THEN 1 END) as has_nav_data,
    COUNT(CASE WHEN issuer IS NOT NULL AND issuer != '' THEN 1 END) as has_issuer
FROM etf_static
WHERE ticker != nav_symbol OR nav_symbol IS NULL OR nav_symbol = ''  -- Exclude NAV symbol records
GROUP BY category
ORDER BY category;

-- ============================================================================
-- STEP 5: Find any remaining problematic records
-- ============================================================================

-- Find records that still don't have proper category
SELECT 
    ticker,
    category,
    nav_symbol,
    nav,
    issuer,
    description,
    CASE 
        WHEN nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '' THEN 'SHOULD BE CEF'
        WHEN issuer IS NOT NULL AND issuer != '' THEN 'SHOULD BE CCETF'
        ELSE 'NEEDS MANUAL REVIEW'
    END AS recommendation
FROM etf_static
WHERE 
    (category IS NULL OR category NOT IN ('CEF', 'CCETF'))
    AND (ticker != nav_symbol OR nav_symbol IS NULL OR nav_symbol = '')  -- Exclude NAV symbol records
ORDER BY ticker;

-- ============================================================================
-- STEP 6: Final verification - CEFs should only have category = 'CEF'
-- ============================================================================

-- Verify all CEFs have category = 'CEF'
SELECT 
    COUNT(*) as total_cefs,
    COUNT(CASE WHEN category = 'CEF' THEN 1 END) as correctly_categorized_cefs,
    COUNT(CASE WHEN category != 'CEF' OR category IS NULL THEN 1 END) as mis_categorized_cefs
FROM etf_static
WHERE 
    nav IS NOT NULL 
    AND nav != 0 
    AND nav_symbol IS NOT NULL 
    AND nav_symbol != ''
    AND ticker != nav_symbol;

-- ============================================================================
-- STEP 7: Final verification - CC ETFs should only have category = 'CCETF'
-- ============================================================================

-- Verify CC ETFs have category = 'CCETF' and are not CEFs
SELECT 
    COUNT(*) as total_ccetfs,
    COUNT(CASE WHEN category = 'CCETF' THEN 1 END) as correctly_categorized_ccetfs,
    COUNT(CASE WHEN category != 'CCETF' OR category IS NULL THEN 1 END) as mis_categorized_ccetfs,
    COUNT(CASE WHEN nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '' THEN 1 END) as cefs_in_etf_table
FROM etf_static
WHERE 
    -- Not a CEF
    NOT (nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '')
    -- Has issuer (real CC ETFs)
    AND issuer IS NOT NULL 
    AND issuer != ''
    -- Not NAV symbol record
    AND (ticker != nav_symbol OR nav_symbol IS NULL OR nav_symbol = '');

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Run STEP 1 first to see what needs fixing
-- 2. Run STEP 2 to set all CEFs to category = 'CEF'
-- 3. Run STEP 3 to set all CC ETFs to category = 'CCETF'
-- 4. Run STEP 4-7 to verify the fix
-- 5. If STEP 5 shows records needing manual review, check those individually
-- ============================================================================

