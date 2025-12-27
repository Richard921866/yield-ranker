-- Complete Migration: Create etf_static table (if needed) and add CEF fields
-- Run this in your Supabase SQL Editor
-- This migration is safe to run multiple times - it will skip steps that are already done

-- ============================================================================
-- STEP 1: Create etf_static table if it doesn't exist
-- ============================================================================
CREATE TABLE IF NOT EXISTS etf_static (
    ticker VARCHAR(20) PRIMARY KEY,
    issuer VARCHAR(255),
    description TEXT,
    pay_day_text VARCHAR(100),
    payments_per_year INTEGER,
    ipo_price DECIMAL(12, 4),
    default_rank_weights JSONB DEFAULT '{}',
    
    -- Live price fields (from Tiingo EOD)
    price DECIMAL(12, 4),
    price_change DECIMAL(12, 4),
    price_change_pct DECIMAL(12, 4),
    
    -- Dividend + frequency fields
    last_dividend DECIMAL(12, 6),
    annual_dividend DECIMAL(12, 6),
    forward_yield DECIMAL(12, 6),
    
    -- Volatility metrics
    dividend_sd DECIMAL(12, 6),
    dividend_cv DECIMAL(12, 6),
    dividend_cv_percent DECIMAL(12, 4),
    dividend_volatility_index VARCHAR(20),
    
    -- Ranking
    weighted_rank DECIMAL(12, 4),
    
    -- Total Return WITH DRIP
    tr_drip_3y DECIMAL(12, 6),
    tr_drip_12m DECIMAL(12, 6),
    tr_drip_6m DECIMAL(12, 6),
    tr_drip_3m DECIMAL(12, 6),
    tr_drip_1m DECIMAL(12, 6),
    tr_drip_1w DECIMAL(12, 6),
    
    -- Price Return (non-DRIP)
    price_return_3y DECIMAL(12, 6),
    price_return_12m DECIMAL(12, 6),
    price_return_6m DECIMAL(12, 6),
    price_return_3m DECIMAL(12, 6),
    price_return_1m DECIMAL(12, 6),
    price_return_1w DECIMAL(12, 6),
    
    -- Total Return WITHOUT DRIP
    tr_nodrip_3y DECIMAL(12, 6),
    tr_nodrip_12m DECIMAL(12, 6),
    tr_nodrip_6m DECIMAL(12, 6),
    tr_nodrip_3m DECIMAL(12, 6),
    tr_nodrip_1m DECIMAL(12, 6),
    tr_nodrip_1w DECIMAL(12, 6),
    
    -- 52-week range
    week_52_high DECIMAL(12, 4),
    week_52_low DECIMAL(12, 4),
    
    -- Metadata
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'Tiingo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_etf_static_issuer ON etf_static(issuer);

-- ============================================================================
-- STEP 2: Add CEF-specific fields (will skip if columns already exist)
-- ============================================================================
DO $$ 
BEGIN
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

-- ============================================================================
-- STEP 3: Verify the migration
-- ============================================================================
-- Check that the table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'etf_static')
        THEN '✓ Table etf_static exists'
        ELSE '✗ Table etf_static does NOT exist'
    END as table_status;

-- Check that CEF columns were added
SELECT 
    column_name, 
    data_type,
    CASE 
        WHEN column_name IN ('nav', 'premium_discount', 'five_year_z_score', 'nav_trend_6m', 'nav_trend_12m', 'signal', 'return_3yr', 'return_5yr', 'return_10yr', 'return_15yr', 'dividend_history')
        THEN '✓ CEF field'
        ELSE 'Other field'
    END as field_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'etf_static' 
AND column_name IN ('nav', 'premium_discount', 'five_year_z_score', 'nav_trend_6m', 'nav_trend_12m', 'signal', 'return_3yr', 'return_5yr', 'return_10yr', 'return_15yr', 'dividend_history')
ORDER BY column_name;

