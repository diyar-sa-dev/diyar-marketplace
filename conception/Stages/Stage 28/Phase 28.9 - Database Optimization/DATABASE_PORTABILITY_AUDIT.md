# Database Portability Audit — Phase 28.9

**Current:** MySQL 8 production, MariaDB 10.4 dev, SQLite PHPUnit  
**Future:** PostgreSQL (not a migration target)

---

## Engine compatibility matrix

| Change | MySQL 8 | MariaDB 10.4 | SQLite tests |
|--------|---------|--------------|--------------|
| OPT-DB-001 `(status, created_at)` | Verified EXPLAIN ANALYZE | Verified EXPLAIN | Migration runs |
| OPT-DB-004/005 composite products | Index created | Index created | Migration runs |
| OPT-DB-006/007 order composites | N/A local | Verified EXPLAIN | Migration runs |
| EXPLAIN ANALYZE scripts | Supported | **Not supported** | Skipped |

---

## MySQL-specific SQL (PORTABILITY RISK)

| Location | Construct | Class | PostgreSQL equivalent |
|----------|-----------|-------|----------------------|
| `AdminAnalyticsService` | `DATE_FORMAT`, `TIMESTAMPDIFF`, `STR_TO_DATE` | **FUTURE REFACTOR** | `to_char`, `EXTRACT`, `to_date` |
| `VendorAnalyticsService` | Raw aggregates | **SAFE** | Portable with date fn swap |
| `ProviderAnalyticsService` | `SUM(CASE...)` | **SAFE** | Portable |
| Product discount sort | `orderByRaw('(compare_price - sale_price)')` | **SAFE** | Portable |

**28.9 action:** Inventory only — no rewrites. Analytics not proven slow @ current scale.

---

## Index portability

All 28.9 indexes use standard B-tree DDL — portable to PostgreSQL with equivalent `CREATE INDEX`.

---

## ENUM / JSON

- Status fields use `VARCHAR` — portable ✓
- JSON columns use Laravel casts — mostly portable
- No MySQL ENUM abuse in critical paths

---

## Classification summary

| Risk level | Count | Action |
|------------|-------|--------|
| SAFE | Majority of queries | No change |
| PORTABILITY RISK | ~5 analytics services | Document in 28.10+ |
| FUTURE REFACTOR | Admin cohort SQL | When/if PostgreSQL pursued |

See also [DATABASE_POSTGRESQL_PORTABILITY.md](./DATABASE_POSTGRESQL_PORTABILITY.md).
