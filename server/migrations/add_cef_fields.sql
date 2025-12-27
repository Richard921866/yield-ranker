-- Migration: Add CEF-specific fields to etf_static table
-- Run this in your Supabase SQL Editor
-- 
-- IMPORTANT: This migration assumes the etf_static table already exists.
-- If you get an error that the table doesn't exist, you need to run the
-- initial migration first: 20241128_tiingo_integration/migration.sql

-- First, verify the table exists (this will fail with a clear error if it doesn't)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'etf_static'
    ) THEN
        RAISE EXCEPTION 'Table "public.etf_static" does not exist. Please ensure you have run the initial Tiingo integration migration (20241128_tiingo_integration/migration.sql) first.';
    END IF;
END $$;

-- Now add the columns (this will only run if table exists)
DO $$ 
BEGIN
    -- NAV (Net Asset Value)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'nav') THEN
        ALTER TABLE public.etf_static ADD COLUMN nav DECIMAL(12, 4);
    END IF;

    -- Premium/Discount percentage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'premium_discount') THEN
        ALTER TABLE public.etf_static ADD COLUMN premium_discount DECIMAL(12, 6);
    END IF;

    -- 5-year Z-Score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'five_year_z_score') THEN
        ALTER TABLE public.etf_static ADD COLUMN five_year_z_score DECIMAL(12, 6);
    END IF;

    -- 6-month NAV Trend %
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'nav_trend_6m') THEN
        ALTER TABLE public.etf_static ADD COLUMN nav_trend_6m DECIMAL(12, 6);
    END IF;

    -- 12-month NAV Trend %
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'nav_trend_12m') THEN
        ALTER TABLE public.etf_static ADD COLUMN nav_trend_12m DECIMAL(12, 6);
    END IF;

    -- Signal rating
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'signal') THEN
        ALTER TABLE public.etf_static ADD COLUMN signal INTEGER;
    END IF;

    -- 3-year annualized return
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'return_3yr') THEN
        ALTER TABLE public.etf_static ADD COLUMN return_3yr DECIMAL(12, 6);
    END IF;

    -- 5-year annualized return
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'return_5yr') THEN
        ALTER TABLE public.etf_static ADD COLUMN return_5yr DECIMAL(12, 6);
    END IF;

    -- 10-year annualized return
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'return_10yr') THEN
        ALTER TABLE public.etf_static ADD COLUMN return_10yr DECIMAL(12, 6);
    END IF;

    -- 15-year annualized return
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'return_15yr') THEN
        ALTER TABLE public.etf_static ADD COLUMN return_15yr DECIMAL(12, 6);
    END IF;

    -- Dividend history (format: "X+ Y-")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'etf_static' 
                   AND column_name = 'dividend_history') THEN
        ALTER TABLE public.etf_static ADD COLUMN dividend_history VARCHAR(50);
    END IF;

    RAISE NOTICE 'CEF fields migration completed successfully';
END $$;

