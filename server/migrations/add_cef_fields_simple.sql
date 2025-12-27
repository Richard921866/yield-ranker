-- Migration: Add CEF-specific fields to etf_static table
-- Run this in your Supabase SQL Editor
-- 
-- STEP 1: Verify the table exists
-- If this query returns 0 rows, the table doesn't exist yet
-- SELECT COUNT(*) FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'etf_static';

-- STEP 2: If the table exists, run the ALTER TABLE statements below
-- If the table doesn't exist, you need to run the initial migration first:
-- server/prisma/migrations/20241128_tiingo_integration/migration.sql

-- Add CEF-specific fields (will skip if columns already exist)
DO $$ 
BEGIN
    -- Check if table exists first
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'etf_static'
    ) THEN
        RAISE EXCEPTION 'Table "public.etf_static" does not exist. Please run the initial migration first: server/prisma/migrations/20241128_tiingo_integration/migration.sql';
    END IF;

    -- Add columns only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'nav') THEN
        ALTER TABLE public.etf_static ADD COLUMN nav DECIMAL(12, 4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'premium_discount') THEN
        ALTER TABLE public.etf_static ADD COLUMN premium_discount DECIMAL(12, 6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'five_year_z_score') THEN
        ALTER TABLE public.etf_static ADD COLUMN five_year_z_score DECIMAL(12, 6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'nav_trend_6m') THEN
        ALTER TABLE public.etf_static ADD COLUMN nav_trend_6m DECIMAL(12, 6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'nav_trend_12m') THEN
        ALTER TABLE public.etf_static ADD COLUMN nav_trend_12m DECIMAL(12, 6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'signal') THEN
        ALTER TABLE public.etf_static ADD COLUMN signal INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'return_3yr') THEN
        ALTER TABLE public.etf_static ADD COLUMN return_3yr DECIMAL(12, 6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'return_5yr') THEN
        ALTER TABLE public.etf_static ADD COLUMN return_5yr DECIMAL(12, 6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'return_10yr') THEN
        ALTER TABLE public.etf_static ADD COLUMN return_10yr DECIMAL(12, 6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'return_15yr') THEN
        ALTER TABLE public.etf_static ADD COLUMN return_15yr DECIMAL(12, 6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'etf_static' AND column_name = 'dividend_history') THEN
        ALTER TABLE public.etf_static ADD COLUMN dividend_history VARCHAR(50);
    END IF;
    
    RAISE NOTICE 'CEF fields migration completed successfully';
END $$;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'etf_static' 
AND column_name IN ('nav', 'premium_discount', 'five_year_z_score', 'nav_trend_6m', 'nav_trend_12m', 'signal', 'return_3yr', 'return_5yr', 'return_10yr', 'return_15yr', 'dividend_history')
ORDER BY column_name;

