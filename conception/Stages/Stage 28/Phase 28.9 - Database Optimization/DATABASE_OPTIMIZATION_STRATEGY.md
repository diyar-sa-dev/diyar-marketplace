# Database Optimization Strategy — Phase 28.9

**Date:** 2026-08-27  
**Scope:** Database layer only (schema indexes, query plans, N+1, table inventory).  
**Out of scope:** API caching (28.10), Redis (28.11), frontend (28.12), infra (28.14).

---

## Principles

1. **Evidence first** — EXPLAIN / EXPLAIN ANALYZE before index changes.
2. **No speculative indexes** — every index maps to a measured query pattern.
3. **No table deletion without 14-point proof** — document UNKNOWN/SUSPECT instead.
4. **Preserve business semantics** — orders, payments, inventory, coupons unchanged.
5. **MySQL 8 primary** — MariaDB 10.4 secondary for dev compatibility.
6. **No PostgreSQL migration** — portability notes only.

---

## Prioritization applied

| Priority | Action in 28.9 |
|----------|----------------|
| P0 correctness | None found requiring schema change |
| P1 production perf | **OPT-DB-001** — products public list index |
| P2 scalability | Document OPT-DB-002/003; defer heavy changes |
| P3 maintainability | Table/domain map, audit scripts |
| P4 cosmetic | Skipped |

---

## Work performed

### Implemented

- **OPT-DB-001:** Composite index `products_status_created_at_index (status, created_at)`  
  Migration: `2026_08_27_120000_add_products_status_created_at_index.php`

### Investigated, deferred

- **OPT-DB-002:** Analytics events — already uses covering index at 5k rows (~2 ms). Monitor at 100k+.
- **OPT-DB-003:** Admin lists at 10k rows — **NOT VERIFIED** (no seeded dataset).
- **Category/vendor product sorts:** Existing `(category_id, status)` / `(vendor_account_id, status)` adequate at current scale; filesort on small vendor subsets acceptable.

### Not in 28.9 scope (per phase map)

- OPT-INFRA-002 (bcmath Docker) → 28.14
- OPT-API-002 (admin funnel wall time) → 28.10
- Security/assistant items → Tier 0 non-DB

---

## Tooling added

| Script | Purpose |
|--------|---------|
| `stage29-db-table-audit.php` | Table + index inventory with domain classification |
| `stage29-db-optimization-explain.php` | Repeatable EXPLAIN capture |

---

## Regression strategy

- Full PHPUnit on SQLite (CI default): **732 tests** expected PASS (1 optional MySQL index test skipped).
- MySQL EXPLAIN verification via script on staging dataset (500 products).
- Existing `CatalogQueryPerformanceTest`, `CheckoutShippingQueryCountTest` unchanged and passing.

---

## Success criteria

| Criterion | Status |
|-----------|--------|
| 123 tables classified | PASS (see DATABASE_TABLE_AUDIT.md) |
| OPT-DB-001 before/after | PASS |
| No tables removed | PASS |
| No API contract change | PASS |
| Documentation complete | PASS |
