# PostgreSQL Portability Notes — Phase 28.9

**Status:** NOT A MIGRATION TARGET  
**Current:** MySQL 8 production, MariaDB 10.4 development  
**Future:** Potential PostgreSQL support at application boundary

---

## Policy

- Do **not** sacrifice MySQL 8 performance for theoretical portability.
- Prefer Laravel query builder / Eloquent where efficient.
- Document engine-specific SQL for future migration planning.

---

## Known MySQL-specific areas

| Location | MySQL syntax | PostgreSQL note |
|----------|--------------|-----------------|
| `AdminAnalyticsService` | `DATE_FORMAT`, `TIMESTAMPDIFF` | `to_char`, `EXTRACT(EPOCH FROM …)` |
| `VendorAnalyticsService` | Raw aggregates | Mostly portable with date fn swap |
| `ProviderAnalyticsService` | Status breakdowns | Portable |
| `AffiliateDashboardService` | Period grouping | Date fn swap |
| `SearchAnalyticsQueryService` | Date filters | Portable |
| Migrations | `json` columns, `uuid` char(36) | PG `uuid` type native |
| Index DDL | BTREE default | Similar CREATE INDEX |

---

## OPT-DB-001 portability

MySQL:

```sql
CREATE INDEX products_status_created_at_index ON products (status, created_at);
```

PostgreSQL equivalent:

```sql
CREATE INDEX products_status_created_at_index ON products (status, created_at DESC);
```

---

## Low portability risk

- Eloquent models and relationships — high portability.
- Financial `DECIMAL` columns — portable; never use FLOAT.
- Soft deletes — portable.

---

## High portability risk (future work)

- Analytics raw SQL with MySQL date functions.
- Any `DB::statement` with engine-specific DDL.

**28.9 action:** Inventory only — no rewrites.
