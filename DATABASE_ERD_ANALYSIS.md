# Database ERD Analysis - Yield Ranker

## Executive Summary

**Database Type:** PostgreSQL (Relational Database)  
**ORM:** Prisma  
**Status:** ✅ **FULLY RELATIONAL** - All key tables are properly linked with foreign key relationships

---

## Core Financial Data Relationships

### Primary Entity: `etf_static`
**Purpose:** Central table containing ETF/CEF metadata and computed metrics  
**Primary Key:** `ticker` (String)

### Related Tables (All Properly Linked):

#### 1. `prices_daily` → `etf_static`
**Relationship Type:** One-to-Many  
**Foreign Key:** `ticker` references `etf_static.ticker`  
**Cascade:** `onDelete: Cascade` (if ETF is deleted, all price history is deleted)  
**Purpose:** Stores End-of-Day (EOD) price data from Tiingo API

**Key Fields:**
- `ticker` (FK to etf_static)
- `date` (Date)
- `open`, `high`, `low`, `close` (unadjusted prices)
- `adj_open`, `adj_high`, `adj_low`, `adj_close` (split-adjusted prices)
- `div_cash` (dividend amount on ex-date)
- `split_factor` (stock split adjustment factor)

**Indexes:**
- Unique constraint on `[ticker, date]` (prevents duplicate price records)
- Indexed on `ticker`, `date`, and `[ticker, date]` for fast queries

#### 2. `dividends_detail` → `etf_static`
**Relationship Type:** One-to-Many  
**Foreign Key:** `ticker` references `etf_static.ticker`  
**Cascade:** `onDelete: Cascade` (if ETF is deleted, all dividend history is deleted)  
**Purpose:** Stores detailed dividend payment history from Tiingo API

**Key Fields:**
- `ticker` (FK to etf_static)
- `ex_date` (ex-dividend date)
- `pay_date`, `record_date`, `declare_date` (dividend dates)
- `div_cash` (original dividend amount)
- `adj_amount` (split-adjusted dividend amount)
- `scaled_amount` (scaled dividend: divCash × (adjClose/close))
- `frequency` (payment frequency: Mo, Qtr, Week, etc.)
- `div_type` (Regular, Special, etc.)

**Indexes:**
- Unique constraint on `[ticker, ex_date]` (prevents duplicate dividend records)
- Indexed on `ticker`, `ex_date`, and `[ticker, ex_date]` for fast queries

#### 3. `data_sync_log` → `etf_static`
**Relationship Type:** One-to-Many  
**Foreign Key:** `ticker` references `etf_static.ticker`  
**Cascade:** `onDelete: Cascade`  
**Purpose:** Tracks synchronization status for incremental daily data updates

**Key Fields:**
- `ticker` (FK to etf_static)
- `data_type` (e.g., "prices", "dividends")
- `last_sync_date` (when last synced)
- `last_data_date` (most recent data date available)
- `records_synced` (count of records)
- `status` (success, error, etc.)

---

## User & Authentication Relationships

### `users` (auth schema) - Central User Entity
**Relationships:**
- `users` → `identities[]` (One-to-Many)
- `users` → `sessions[]` (One-to-Many)
- `users` → `favorites[]` (One-to-Many)
- `users` → `profiles` (One-to-One)
- `users` → `saved_screeners[]` (One-to-Many)
- `users` → `site_settings[]` (One-to-Many)

### `favorites` → `users`
**Relationship Type:** Many-to-One  
**Foreign Key:** `user_id` references `users.id`  
**Cascade:** `onDelete: Cascade`  
**Purpose:** User's favorite ETFs/CEFs

**Composite Primary Key:** `[user_id, symbol, category]`

---

## Visual ERD Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    etf_static (CORE TABLE)                   │
│  Primary Key: ticker                                         │
│  Contains: Metadata, metrics, computed values               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ (One-to-Many)
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
    ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐
    │  prices_daily   │ │ dividends_detail  │ │data_sync_log │
    │  FK: ticker     │ │  FK: ticker       │ │  FK: ticker   │
    │  EOD prices     │ │  Dividend history │ │  Sync status  │
    └─────────────────┘ └──────────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    users (AUTH SCHEMA)                       │
│  Primary Key: id (UUID)                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ (One-to-Many)
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
    ┌─────────────────┐ ┌──────────┐ ┌──────────────────┐
    │   favorites     │ │ profiles │ │ saved_screeners  │
    │  FK: user_id    │ │ FK: id    │ │  FK: user_id      │
    └─────────────────┘ └──────────┘ └──────────────────┘
```

---

## Key Relationship Verification

### ✅ **CONFIRMED: Proper Relational Structure**

1. **Foreign Key Constraints Present:**
   ```prisma
   // prices_daily
   etf_static   etf_static @relation(fields: [ticker], references: [ticker], onDelete: Cascade)
   
   // dividends_detail
   etf_static   etf_static @relation(fields: [ticker], references: [ticker], onDelete: Cascade)
   
   // data_sync_log
   etf_static   etf_static @relation(fields: [ticker], references: [ticker], onDelete: Cascade)
   ```

2. **Referential Integrity:**
   - All child tables (`prices_daily`, `dividends_detail`, `data_sync_log`) reference `etf_static.ticker`
   - Cascade deletes ensure data consistency
   - Unique constraints prevent duplicate records

3. **Indexing Strategy:**
   - Foreign keys are indexed for fast JOINs
   - Composite indexes on `[ticker, date]` for time-series queries
   - Proper indexing on frequently queried fields

---

## Data Flow Architecture

### EOD Price Data Flow:
```
Tiingo API → prices_daily → etf_static (computed metrics)
```

### Dividend Data Flow:
```
Tiingo API → dividends_detail → etf_static (annual_dividend, forward_yield)
```

### User Data Flow:
```
User Actions → favorites/saved_screeners → users (auth)
```

---

## Important Notes

### Legacy Table: `etfs`
- There is an `etfs` table (line 407) that appears to be a legacy/flat table
- **No foreign key relationship** to `etf_static`
- May be used for backward compatibility or separate data source
- **Recommendation:** Verify if this table is still in use or can be deprecated

### Schema Separation:
- **`auth` schema:** User authentication and authorization
- **`public` schema:** Application business data (ETFs, prices, dividends)

---

## Conclusion

✅ **The database IS properly relational:**
- All core financial tables (`prices_daily`, `dividends_detail`, `data_sync_log`) are correctly linked to `etf_static` via foreign keys
- Cascade deletes ensure referential integrity
- Proper indexing for performance
- Normalized structure eliminates data redundancy

✅ **Ready for Production:**
- Can handle EOD price history efficiently
- Can handle dividend history efficiently
- Supports complex queries with JOINs
- Maintains data consistency through foreign key constraints

---

## Next Steps for Visual ERD

To generate a visual ERD diagram, you can:

1. **Use Prisma ERD Generator:**
   ```bash
   npx prisma-erd-generator
   ```

2. **Use Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   (Shows visual relationships in the UI)

3. **Use drawSQL or dbdiagram.io:**
   - Export schema to SQL
   - Import into visual ERD tool

4. **Use Prisma Schema Visualizer:**
   ```bash
   npm install -g prisma-erd-generator
   npx prisma-erd-generator
   ```

