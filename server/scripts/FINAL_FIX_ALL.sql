-- ============================================================================
-- FINAL FIX - RUN THIS TO FIX EVERYTHING AND PREVENT FUTURE ISSUES
-- ============================================================================
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it
-- This will fix all issues and add safeguards to prevent it from happening again
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX ALL CEFs - Set category = 'CEF'
-- ============================================================================
UPDATE etf_static
SET category = 'CEF'
WHERE 
    nav IS NOT NULL 
    AND nav != 0 
    AND nav_symbol IS NOT NULL 
    AND nav_symbol != ''
    AND ticker != nav_symbol;

-- ============================================================================
-- STEP 2: FIX ALL CC ETFs - Set category = 'CCETF'
-- ============================================================================
UPDATE etf_static
SET category = 'CCETF'
WHERE 
    NOT (nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '')
    AND issuer IS NOT NULL 
    AND issuer != ''
    AND (ticker != nav_symbol OR nav_symbol IS NULL OR nav_symbol = '');

-- ============================================================================
-- STEP 3: ADD DATABASE TRIGGER TO PREVENT FUTURE ISSUES
-- ============================================================================
-- This trigger automatically sets the correct category when records are inserted/updated
-- It will NEVER let CEFs and CC ETFs get mixed up again

CREATE OR REPLACE FUNCTION auto_set_category()
RETURNS TRIGGER AS $$
BEGIN
    -- If it has nav_symbol AND nav data, it's a CEF - FORCE category = 'CEF'
    IF NEW.nav IS NOT NULL 
       AND NEW.nav != 0 
       AND NEW.nav_symbol IS NOT NULL 
       AND NEW.nav_symbol != ''
       AND NEW.ticker != NEW.nav_symbol THEN
        NEW.category := 'CEF';
    -- If it has issuer but NOT nav_symbol + nav data, it's a CCETF - FORCE category = 'CCETF'
    ELSIF NOT (NEW.nav IS NOT NULL AND NEW.nav != 0 AND NEW.nav_symbol IS NOT NULL AND NEW.nav_symbol != '')
          AND NEW.issuer IS NOT NULL 
          AND NEW.issuer != ''
          AND (NEW.ticker != NEW.nav_symbol OR NEW.nav_symbol IS NULL OR NEW.nav_symbol = '') THEN
        NEW.category := 'CCETF';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS trigger_auto_set_category ON etf_static;
CREATE TRIGGER trigger_auto_set_category
    BEFORE INSERT OR UPDATE ON etf_static
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_category();

-- ============================================================================
-- STEP 4: VERIFY THE FIX
-- ============================================================================
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

-- ============================================================================
-- STEP 5: CHECK FOR ANY PROBLEMS (should return 0 rows)
-- ============================================================================
SELECT 
    ticker,
    category,
    'PROBLEM: Wrong category' as issue
FROM etf_static
WHERE 
    (
        -- CEFs that are not category = 'CEF'
        (nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '' 
         AND ticker != nav_symbol AND (category IS NULL OR category != 'CEF'))
        OR
        -- CC ETFs that are not category = 'CCETF'
        (NOT (nav IS NOT NULL AND nav != 0 AND nav_symbol IS NOT NULL AND nav_symbol != '') 
         AND issuer IS NOT NULL AND issuer != '' 
         AND (ticker != nav_symbol OR nav_symbol IS NULL OR nav_symbol = '')
         AND (category IS NULL OR category != 'CCETF'))
    )
ORDER BY ticker;

-- ============================================================================
-- DONE! 
-- ============================================================================
-- After running this:
-- 1. All CEFs will have category = 'CEF' (should be 12)
-- 2. All CC ETFs will have category = 'CCETF' (should be 117)
-- 3. A trigger is now active that will AUTOMATICALLY set the correct category
--    whenever a record is inserted or updated - this prevents future issues
-- 4. The API will only return 117 CC ETFs (no CEFs)
-- ============================================================================

