-- Tiingo API Integration Schema Migration
-- Creates three tables for the hybrid data approach

-- ============================================================================
-- Table 1: etf_static (Manual data from Excel uploads)
-- Source: Admin panel Excel upload
-- Purpose: Data Tiingo doesn't provide or that we want to control manually
-- ============================================================================
CREATE TABLE IF NOT EXISTS etf_static (
    ticker VARCHAR(20) PRIMARY KEY,
    issuer VARCHAR(255),
    description TEXT,
    pay_day_text VARCHAR(100),        -- e.g., "Monthly", "Every Friday"
    payments_per_year INTEGER,         -- e.g., 12, 4, 52
    ipo_price DECIMAL(12, 4),
    default_rank_weights JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_etf_static_issuer ON etf_static(issuer);

-- ============================================================================
-- Table 2: prices_daily (Automated from Tiingo EOD Endpoint)
-- Source: https://api.tiingo.com/tiingo/daily/${ticker}/prices
-- Purpose: End-of-day price data for return calculations
-- ============================================================================
CREATE TABLE IF NOT EXISTS prices_daily (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    open DECIMAL(12, 4),
    high DECIMAL(12, 4),
    low DECIMAL(12, 4),
    close DECIMAL(12, 4),             -- For Price Return calculations
    adj_close DECIMAL(12, 4),         -- For Total Return calculations (dividend-adjusted)
    volume BIGINT,
    adj_open DECIMAL(12, 4),
    adj_high DECIMAL(12, 4),
    adj_low DECIMAL(12, 4),
    adj_volume BIGINT,
    div_cash DECIMAL(12, 6),          -- Dividend amount if ex-date
    split_factor DECIMAL(12, 6) DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to etf_static
    CONSTRAINT fk_prices_daily_ticker FOREIGN KEY (ticker) 
        REFERENCES etf_static(ticker) ON DELETE CASCADE,
    
    -- Ensure unique ticker+date combination
    CONSTRAINT uq_prices_daily_ticker_date UNIQUE (ticker, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prices_daily_ticker ON prices_daily(ticker);
CREATE INDEX IF NOT EXISTS idx_prices_daily_date ON prices_daily(date);
CREATE INDEX IF NOT EXISTS idx_prices_daily_ticker_date ON prices_daily(ticker, date DESC);

-- ============================================================================
-- Table 3: dividends_detail (Automated from Tiingo Dividends Endpoint)
-- Source: https://api.tiingo.com/tiingo/daily/${ticker}/dividends
-- Purpose: Detailed dividend history for yield and volatility calculations
-- ============================================================================
CREATE TABLE IF NOT EXISTS dividends_detail (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL,
    ex_date DATE NOT NULL,            -- Ex-dividend date
    pay_date DATE,                    -- Payment date
    record_date DATE,                 -- Record date
    declare_date DATE,                -- Declaration date
    div_cash DECIMAL(12, 6) NOT NULL, -- Dividend amount
    split_factor DECIMAL(12, 6) DEFAULT 1,
    div_type VARCHAR(50),             -- e.g., "Cash", "Stock"
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to etf_static
    CONSTRAINT fk_dividends_detail_ticker FOREIGN KEY (ticker) 
        REFERENCES etf_static(ticker) ON DELETE CASCADE,
    
    -- Ensure unique ticker+ex_date combination
    CONSTRAINT uq_dividends_detail_ticker_exdate UNIQUE (ticker, ex_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dividends_detail_ticker ON dividends_detail(ticker);
CREATE INDEX IF NOT EXISTS idx_dividends_detail_ex_date ON dividends_detail(ex_date);
CREATE INDEX IF NOT EXISTS idx_dividends_detail_ticker_exdate ON dividends_detail(ticker, ex_date DESC);

-- ============================================================================
-- Table 4: data_sync_log (Track sync status for incremental updates)
-- Purpose: Track last successful sync date per ticker for daily_update.ts
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_sync_log (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL,
    data_type VARCHAR(20) NOT NULL,   -- 'prices' or 'dividends'
    last_sync_date DATE NOT NULL,
    last_data_date DATE,              -- Most recent data date in our DB
    records_synced INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'error', 'pending'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to etf_static
    CONSTRAINT fk_data_sync_log_ticker FOREIGN KEY (ticker) 
        REFERENCES etf_static(ticker) ON DELETE CASCADE,
    
    -- Unique constraint per ticker and data type
    CONSTRAINT uq_data_sync_log_ticker_type UNIQUE (ticker, data_type)
);

CREATE INDEX IF NOT EXISTS idx_data_sync_log_ticker ON data_sync_log(ticker);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_status ON data_sync_log(status);

-- ============================================================================
-- Migrate existing ETF data from 'etfs' table to 'etf_static'
-- This preserves manual data while allowing the new automated tables
-- ============================================================================
INSERT INTO etf_static (ticker, issuer, description, pay_day_text, payments_per_year, ipo_price, updated_at)
SELECT 
    symbol as ticker,
    issuer,
    description,
    pay_day as pay_day_text,
    payments_per_year,
    ipo_price,
    COALESCE(spreadsheet_updated_at, NOW()) as updated_at
FROM etfs
ON CONFLICT (ticker) DO UPDATE SET
    issuer = EXCLUDED.issuer,
    description = EXCLUDED.description,
    pay_day_text = EXCLUDED.pay_day_text,
    payments_per_year = EXCLUDED.payments_per_year,
    ipo_price = EXCLUDED.ipo_price,
    updated_at = NOW();

-- ============================================================================
-- Add helpful comments to tables
-- ============================================================================
COMMENT ON TABLE etf_static IS 'Manual ETF metadata from Excel uploads - not populated by Tiingo';
COMMENT ON TABLE prices_daily IS 'Automated EOD price data from Tiingo API';
COMMENT ON TABLE dividends_detail IS 'Automated dividend history from Tiingo API';
COMMENT ON TABLE data_sync_log IS 'Tracks sync status for incremental daily updates';

COMMENT ON COLUMN prices_daily.close IS 'Unadjusted close price for Price Return calculations';
COMMENT ON COLUMN prices_daily.adj_close IS 'Dividend-adjusted close for Total Return calculations';
COMMENT ON COLUMN dividends_detail.ex_date IS 'Ex-dividend date - the cutoff for dividend eligibility';
