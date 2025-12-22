# Database Structure Report

## Executive Summary

**Database Type: Relational Database (PostgreSQL)**

Our application uses a **fully relational database structure**, not a flat file system. We are leveraging PostgreSQL as our database management system with Prisma as our Object-Relational Mapping (ORM) tool.

---

## Key Characteristics

### 1. **Relational Database Features**
- ✅ **Foreign Key Relationships**: Multiple tables are connected through foreign keys with referential integrity
- ✅ **Normalized Data Structure**: Data is organized across multiple related tables to eliminate redundancy
- ✅ **ACID Compliance**: Full transactional support ensuring data consistency
- ✅ **Complex Queries**: Support for JOINs, aggregations, and complex relational queries

### 2. **Database Architecture**

**Database System**: PostgreSQL  
**ORM Framework**: Prisma  
**Schemas**: Two schemas for logical separation:
- `auth` schema: Authentication and user management
- `public` schema: Application business data

### 3. **Key Table Relationships**

#### Authentication & User Management (auth schema)
- `users` → `identities` (one-to-many)
- `users` → `sessions` (one-to-many)
- `users` → `favorites` (one-to-many)
- `users` → `profiles` (one-to-one)
- `users` → `saved_screeners` (one-to-many)
- `sessions` → `refresh_tokens` (one-to-many)
- `mfa_factors` → `mfa_challenges` (one-to-many)

#### Financial Data (public schema)
- `etf_static` → `prices_daily` (one-to-many)
- `etf_static` → `dividends_detail` (one-to-many)
- `etf_static` → `data_sync_log` (one-to-many)

### 4. **Data Integrity Features**

- **Cascade Deletes**: When a parent record is deleted, related child records are automatically removed
- **Unique Constraints**: Prevent duplicate data entries
- **Indexes**: Optimized for fast lookups and queries
- **Data Types**: Properly typed fields (UUIDs, decimals, timestamps, JSON)

---

## Why Relational vs. Flat File?

### Advantages of Our Relational Structure:

1. **Data Integrity**: Foreign keys ensure referential integrity - you can't have orphaned records
2. **Scalability**: Can handle millions of records efficiently
3. **Query Performance**: Indexed relationships enable fast complex queries
4. **Data Consistency**: ACID transactions prevent data corruption
5. **Flexibility**: Easy to add new relationships and tables without restructuring
6. **Multi-user Support**: Concurrent access with proper locking mechanisms

### What a Flat File Structure Would Mean:
- ❌ Single large files (CSV, JSON) with all data
- ❌ No relationships between data entities
- ❌ Manual data integrity checks
- ❌ Poor performance with large datasets
- ❌ Difficult to maintain and update

---

## Current Database Tables

### Authentication Schema (auth)
- audit_log_entries
- flow_state
- identities
- instances
- mfa_amr_claims
- mfa_challenges
- mfa_factors
- oauth_authorizations
- oauth_clients
- oauth_consents
- one_time_tokens
- refresh_tokens
- saml_providers
- saml_relay_states
- schema_migrations
- sessions
- sso_domains
- sso_providers
- users

### Public Schema (application data)
- etfs
- etf_static
- favorites
- profiles
- prices_daily
- dividends_detail
- data_sync_log
- saved_screeners
- site_messages
- site_settings

---

## Technical Implementation

**Database Provider**: PostgreSQL  
**Connection**: Managed through Prisma Client  
**Migration System**: Prisma Migrations (version-controlled schema changes)  
**Query Builder**: Prisma ORM with type-safe queries

---

## Conclusion

We are using a **modern, enterprise-grade relational database structure** that provides:
- Strong data integrity
- Excellent performance
- Scalability for growth
- Maintainability and extensibility

This structure is appropriate for a production financial data application requiring complex relationships, data consistency, and high performance.

