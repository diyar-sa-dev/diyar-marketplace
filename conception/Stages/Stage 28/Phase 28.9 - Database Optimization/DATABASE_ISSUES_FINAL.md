# Database Issues — Final Register (Phase 28.9 Closure)

**Date:** 2026-08-27  
**Status:** All items classified — **0 blocking P2**

---

## Optimization register

| ID | Finding | Resolution | Status |
|----|---------|------------|--------|
| **OPT-DB-001** | Public product list full scan + filesort | `(status, created_at)` index | **RESOLVED** |
| **OPT-DB-004** | Category catalog sort | `(category_id, status, created_at)` | **RESOLVED** |
| **OPT-DB-005** | Vendor catalog sort | `(vendor_account_id, status, created_at)` | **RESOLVED** |
| **OPT-DB-006** | Customer order history sort | `(user_id, created_at)` | **RESOLVED** |
| **OPT-DB-007** | Admin order status filter sort | `(status, created_at)` | **RESOLVED** |
| **OPT-DB-003** | Admin lists @ 10k rows | Verified via `orders_created_at_index` + status composite @ 10k orders | **VERIFIED** |
| **OPT-DB-002** | Analytics aggregation @ scale | 44.98ms @ 150k events, index-only range scan | **VERIFIED** |

---

## Issue register

| ID | Severity | Description | Status | Trigger / Owner |
|----|----------|-------------|--------|-----------------|
| **DB-PAG-001** | P2→closed | Deep OFFSET pagination on catalog | **VERIFIED / ACCEPTED WITH SCALE TRIGGER** | MySQL 8: index scan pages 1–100 @ 10k products (max 3.6ms). MariaDB 10.4 dev showed ALL+filesort at offset 180+ on 500-row set — optimizer difference, not production path. Cursor pagination when catalog >50k SKUs or p95 page latency >100ms. Owner: **28.10** |
| **DB-N1-001** | P2→closed | Order list N+1 | **VERIFIED** | `OrderListQueryCountTest` ≤4 vendor_order queries |
| **DB-IDX-001** | P3 | Missing index candidates (non-hot paths) | **RECLASSIFIED** | No proven production hotspot; monitor slow query log |
| **DB-IDX-002** | P3 | Polymorphic index gaps | **RECLASSIFIED** | Existing indexes adequate for current volume |
| **INDEX-001** | P3 | `products(category_id, status)` prefix-redundant vs 3-col | **DEFERRED WITH SCALE TRIGGER** | Keep until production EXPLAIN proves 2-col unused |
| **INDEX-002** | P3 | `products(vendor_account_id, status)` prefix-redundant vs 3-col | **DEFERRED WITH SCALE TRIGGER** | Same as INDEX-001 |
| **DB-PORT-001** | P3 | Analytics `DATE_FORMAT` / `TIMESTAMPDIFF` | **DEFERRED WITH SCALE TRIGGER** | Isolated in analytics services; PostgreSQL migration work |
| **DB-TBL-001** | P3 | Orphan table candidates | **VERIFIED** | 0 tables meet all 10 removal criteria |

---

## Severity summary

| Level | Count |
|-------|-------|
| P0 | 0 |
| P1 | 0 |
| Blocking P2 | 0 |
| Accepted / deferred P2–P3 | 5 (all with explicit triggers) |

---

## Not in Phase 28.9 scope

| ID | Owner |
|----|-------|
| OPT-API-002 | 28.10 Backend/API Optimization |
| Rate limit test flakes | 28.10 / CI |
| AdvancedShippingTest flake | Shipping domain (unrelated) |
