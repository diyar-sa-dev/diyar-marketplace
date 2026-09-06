# Database Index Audit — Phase 28.9

**Date:** 2026-08-27  
**Baseline:** Phase 28.2 `_db_schema_inventory.json` (~350+ index statistics on 123 tables)  
**Post-change:** +1 index on `products`

---

## Summary

| Category | Count | Action |
|----------|-------|--------|
| Missing critical (proven) | 1 | **Fixed** — OPT-DB-001 |
| Duplicate indexes | 0 proven | None removed |
| Redundant vs new index | 0 | Existing category/vendor indexes still needed |
| Low-value indexes | NOT AUDITED exhaustively | Deferred — no evidence of harm |
| FK without index | NOT VERIFIED row-by-row | Phase 28.2 integrity PASS |

---

## OPT-DB-001 — `products`

| Index | Columns | Reason | Evidence |
|-------|---------|--------|----------|
| **NEW** `products_status_created_at_index` | `(status, created_at)` | Default public list: `WHERE status='active' ORDER BY created_at DESC` | EXPLAIN ALL+filesort → range+backward scan |
| Existing `products_category_id_status_index` | `(category_id, status)` | Category-filtered catalog | Still used when `category_id` filter present |
| Existing `products_vendor_account_id_status_index` | `(vendor_account_id, status)` | Vendor storefront lists | Still used |
| Existing `products_vendor_account_id_slug_unique` | `(vendor_account_id, slug)` | Slug uniqueness | Unchanged |

**Column order rationale:** Equality predicate on `status` first, then `created_at` for descending sort. MySQL 8 uses backward index scan — no filesort.

## OPT-DB-004 / OPT-DB-005 — `products` (deep pass)

| Index | Columns | Reason | Status |
|-------|---------|--------|--------|
| `products_category_status_created_at_index` | `(category_id, status, created_at)` | Category pages + sort | **ADDED** |
| `products_vendor_status_created_at_index` | `(vendor_account_id, status, created_at)` | Vendor storefront + sort | **ADDED** |

**Redundancy note (INDEX-001/002):** Shorter `(category_id, status)` and `(vendor_account_id, status)` indexes are prefix-subsumed — **DEFER drop** until production EXPLAIN confirms zero use.

## OPT-DB-006 / OPT-DB-007 — `orders` (deep pass)

| Index | Columns | Reason | Status |
|-------|---------|--------|--------|
| `orders_user_created_at_index` | `(user_id, created_at)` | Customer order history | **ADDED** |
| `orders_status_created_at_index` | `(status, created_at)` | Admin filtered lists | **ADDED** |
| `orders_created_at_index` | `(created_at)` | Admin default sort | **Pre-existing** (2026_08_26_264100) |

---

## OPT-DB-002 — `analytics_events` (deferred)

Existing indexes from migration `2026_08_26_264000`:

- `(event_type, created_at)` — **used** for 30-day aggregation
- `(vendor_account_id, event_type, created_at)`
- `created_at`, `event_type` singles

**EXPLAIN @ 5k rows:** covering index scan, ~2 ms aggregate. **No change in 28.9.**

---

## OPT-DB-003 — Admin list tables (not measured)

Tables: `orders`, `users`, `vendor_accounts`, etc.  
Admin endpoints use `paginate()` with status filters.  
**NOT VERIFIED at 10k row scale** — recommend seed + EXPLAIN in 28.10 if admin slowness confirmed.

---

## Duplicate / redundant index policy

No indexes removed in 28.9. Removal requires:

1. Proof of zero query use (EXPLAIN on all known patterns)
2. No FK dependency
3. Migration rollback path
4. Full regression

---

## Compatibility

| Engine | OPT-DB-001 |
|--------|------------|
| MySQL 8 | Verified (8.0.46) |
| MariaDB 10.4 | Expected compatible (standard B-tree secondary index) |
| PostgreSQL (future) | Equivalent: `CREATE INDEX ON products (status, created_at DESC)` |
