# Visual ERD Representation - Yield Ranker Database

## Entity Relationship Diagram (Text Format)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTH SCHEMA                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│       users         │
│  (Primary Key: id)  │
│─────────────────────│
│ • id (UUID)         │
│ • email             │
│ • role              │
│ • ...               │
└─────────────────────┘
         │
         │ 1:N
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  identities  │   │   sessions   │   │  favorites   │
│  FK: user_id │   │  FK: user_id │   │  FK: user_id │
└──────────────┘   └──────────────┘   └──────────────┘
         │                 │                 │
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   profiles   │   │refresh_tokens│   │saved_screeners│
│  FK: id      │   │  FK:session_id│   │  FK: user_id │
└──────────────┘   └──────────────┘   └──────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          PUBLIC SCHEMA                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────┐
                    │      etf_static              │
                    │  (PRIMARY ENTITY)            │
                    │──────────────────────────────│
                    │ • ticker (PK)                │
                    │ • issuer                     │
                    │ • description                │
                    │ • price                      │
                    │ • annual_dividend            │
                    │ • forward_yield              │
                    │ • dividend_volatility_index │
                    │ • weighted_rank             │
                    │ • tr_drip_3y, tr_drip_12m... │
                    │ • price_return_3y, ...        │
                    │ • week_52_high/low           │
                    │ • last_updated               │
                    └──────────────────────────────┘
                              │
                              │ 1:N (Foreign Key: ticker)
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
    │  prices_daily   │ │dividends_    │ │data_sync_log │
    │                 │ │  detail      │ │              │
    │ • id (PK)       │ │ • id (PK)    │ │ • id (PK)    │
    │ • ticker (FK)   │ │ • ticker (FK)│ │ • ticker (FK)│
    │ • date          │ │ • ex_date    │ │ • data_type  │
    │ • open          │ │ • pay_date   │ │ • last_sync  │
    │ • high          │ │ • record_date│ │ • status     │
    │ • low           │ │ • div_cash   │ │              │
    │ • close         │ │ • adj_amount │ │              │
    │ • adj_close     │ │ • scaled_amt │ │              │
    │ • volume        │ │ • frequency  │ │              │
    │ • div_cash      │ │ • div_type   │ │              │
    │ • split_factor  │ │ • currency   │ │              │
    │                 │ │              │ │              │
    │ Unique:         │ │ Unique:      │ │ Unique:      │
    │ [ticker, date]  │ │ [ticker,     │ │ [ticker,     │
    │                 │ │  ex_date]    │ │  data_type]  │
    └─────────────────┘ └──────────────┘ └──────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                    LEGACY TABLE (No Relations)                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│       etfs         │
│  (Flat Table)       │
│─────────────────────│
│ • symbol (PK)       │
│ • name              │
│ • price             │
│ • dividend          │
│ • ...               │
│                     │
│ ⚠️ NO FOREIGN KEYS │
│ ⚠️ NO RELATIONS     │
└─────────────────────┘
```

## Relationship Summary

### Core Financial Data Relationships:

1. **etf_static** (1) → (N) **prices_daily**
   - Foreign Key: `prices_daily.ticker` → `etf_static.ticker`
   - Cascade Delete: ✅ Yes
   - Purpose: EOD price history

2. **etf_static** (1) → (N) **dividends_detail**
   - Foreign Key: `dividends_detail.ticker` → `etf_static.ticker`
   - Cascade Delete: ✅ Yes
   - Purpose: Dividend payment history

3. **etf_static** (1) → (N) **data_sync_log**
   - Foreign Key: `data_sync_log.ticker` → `etf_static.ticker`
   - Cascade Delete: ✅ Yes
   - Purpose: Sync tracking

### User Data Relationships:

4. **users** (1) → (N) **favorites**
   - Foreign Key: `favorites.user_id` → `users.id`
   - Cascade Delete: ✅ Yes

5. **users** (1) → (1) **profiles**
   - Foreign Key: `profiles.id` → `users.id`
   - Cascade Delete: ✅ Yes

6. **users** (1) → (N) **saved_screeners**
   - Foreign Key: `saved_screeners.user_id` → `users.id`
   - Cascade Delete: ✅ Yes

## Verification Checklist

✅ **All core tables are properly linked:**
- `prices_daily` → `etf_static` ✅
- `dividends_detail` → `etf_static` ✅
- `data_sync_log` → `etf_static` ✅

✅ **Foreign key constraints are present:**
- All use `@relation` directive
- All specify `fields` and `references`
- All have `onDelete: Cascade`

✅ **Indexes are optimized:**
- Foreign keys are indexed
- Composite indexes on `[ticker, date]` for time-series queries
- Unique constraints prevent duplicates

✅ **Data integrity is maintained:**
- Referential integrity through foreign keys
- Cascade deletes prevent orphaned records
- Unique constraints prevent duplicate data

## Conclusion

**The database structure is FULLY RELATIONAL and properly designed for:**
- ✅ EOD price history storage and queries
- ✅ Dividend history storage and queries
- ✅ User favorites and preferences
- ✅ Data synchronization tracking
- ✅ Complex JOIN queries across related tables
- ✅ Data consistency and integrity

**The ERD confirms that the developer has correctly implemented a relational database structure, not a flat file system.**

