# Database Index Final Audit — Phase 28.9

**Date:** 2026-08-27  
**Evidence:** `_db_indexes_final.json`, `_db_closure_verify_mysql8.json`

---

## Summary

| Metric | Value |
|--------|-------|
| Total index entries | 681 |
| Tables with indexes | 123 |
| FK columns indexed | 209/209 |
| New indexes (Phase 28.9) | 5 composite groups |
| Redundant candidates | 6 (all deferred) |

---

## Phase 28.9 index additions

| Migration | Index | Serves |
|-----------|-------|--------|
| `2026_08_27_120000` | `products(status, created_at)` | Public catalog list OPT-DB-001 |
| `2026_08_27_130000` | `products(category_id, status, created_at)` | Category browse OPT-DB-004 |
| `2026_08_27_130000` | `products(vendor_account_id, status, created_at)` | Vendor catalog OPT-DB-005 |
| `2026_08_27_130000` | `orders(user_id, created_at)` | Customer history OPT-DB-006 |
| `2026_08_27_130000` | `orders(status, created_at)` | Admin status filter OPT-DB-007 |

Migrations use `Schema::getIndexes()` idempotency checks. Safe on MySQL 8 and MariaDB 10.4. Rollback via `down()` drops named indexes only.

---

## Verified query plans (MySQL 8 @ 10k)

| Query pattern | Index used | Filesort | Pass |
|---------------|------------|----------|------|
| Active products, `-created_at` | `products_status_created_at_index` | No | YES |
| Category + active + sort | `products_category_status_created_at_index` | No | YES |
| Vendor + active + sort | `products_vendor_status_created_at_index` | No | YES |
| User orders history | `orders_user_created_at_index` | No | YES |
| Orders by status | `orders_status_created_at_index` | No | YES |
| Admin all orders | `orders_created_at_index` | No | YES |

---

## Redundant index investigation

### INDEX-001 — `products(category_id, status)`

**Candidate redundant with:** `products(category_id, status, created_at)`

| Factor | Assessment |
|--------|------------|
| Query usage | Category filter without sort may use 2-col index |
| Uniqueness | Not unique |
| FK | `category_id` FK covered by both |
| Optimizer (MySQL 8) | May prefer shorter index for count-only queries |
| MariaDB 10.4 | Similar behavior |
| Drop risk | Medium — could regress category COUNT queries |

**Decision:** **KEEP** — DEFERRED WITH SCALE TRIGGER (90-day production slow-query proof of non-use).

### INDEX-002 — `products(vendor_account_id, status)`

Same analysis as INDEX-001 for vendor-scoped queries.

**Decision:** **KEEP** — DEFERRED WITH SCALE TRIGGER.

### Other candidates (4)

Prefix-redundant pairs on `messages`, `user_notifications`, `analytics_events` — all **KEEP** for write-pattern isolation and covering-index benefits at current scale.

---

## Missing index candidates (not implemented)

No missing index met all criteria:

1. Proven slow query in EXPLAIN
2. Selectivity benefit > write overhead
3. No existing covering index
4. Safe on MariaDB + MySQL 8

Catalog LIKE search (`CatalogSearchService`) uses FULLTEXT/prefix patterns — index addition deferred to search architecture phase.

---

## Migration quality review

| Check | `2026_08_27_120000` | `2026_08_27_130000` |
|-------|---------------------|---------------------|
| Destructive ops | No | No |
| Table rebuild risk | No | No |
| Idempotent up() | N/A (single index) | Yes (`getIndexes()`) |
| Rollback | Yes | Yes |
| MySQL 8 tested | Yes | Yes |
| MariaDB tested | Yes | Yes |
| Deploy time @ 10k products | <200ms | <800ms |

---

## Conclusion

Index audit **PASS**. All production-hot paths verified. Redundant indexes documented with explicit keep rationale — zero unexplained candidates.
