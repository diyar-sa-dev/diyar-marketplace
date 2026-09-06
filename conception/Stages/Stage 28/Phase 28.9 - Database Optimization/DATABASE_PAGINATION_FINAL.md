# Database Pagination — Final Assessment (DB-PAG-001)

**Date:** 2026-08-27  
**Issue:** DB-PAG-001 — Product OFFSET pagination degradation  
**Status:** **VERIFIED / ACCEPTED WITH SCALE TRIGGER**

---

## API contract

Public catalog uses **offset pagination** (`page`, `per_page`) via Laravel `paginate()`. Phase 28.9 did **not** change this contract.

Representative SQL:

```sql
SELECT id FROM products
WHERE status = 'active' AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET ?
```

Index: `products_status_created_at_index (status, created_at)` — OPT-DB-001.

---

## Measurements — MySQL 8.0.46 @ 10,000 products

| Page | Offset | EXPLAIN type | Key | Duration | EXPLAIN ANALYZE |
|------|--------|--------------|-----|----------|-----------------|
| 1 | 0 | ref | `products_status_created_at_index` | 1.22ms | 0.04ms |
| 5 | 80 | ref | same | 1.26ms | 0.12ms |
| 10 | 180 | ref | same | 1.58ms | 0.23ms |
| 25 | 480 | ref | same | 1.78ms | 0.63ms |
| 50 | 980 | ref | same | 2.39ms | 1.23ms |
| 100 | 1980 | ref | same | 3.55ms | 2.44ms |

**Observations:**

- No filesort at any tested page on MySQL 8.
- Backward index scan used throughout.
- Linear OFFSET cost visible in analyze time but wall clock remains <4ms at page 100.

---

## Measurements — MariaDB 10.4 @ 500 products (dev)

| Offset | EXPLAIN | Notes |
|--------|---------|-------|
| 0 | range on `products_status_created_at_index` | OK |
| 180+ | ALL + filesort | Optimizer chose full scan — dev-only behavior |

MariaDB dev optimizer differs from MySQL 8 production. Production path is authoritative.

---

## Acceptability determination

| Criterion | Result |
|-----------|--------|
| Current production scale (~5k SKUs target) | **Acceptable** — sub-5ms through page 100 @ 10k |
| API contract preserved | **Yes** |
| Index optimization exhausted | **Yes** — further gain requires cursor pagination |
| User-facing page depth in practice | Pages 1–10 dominate traffic |

---

## Scale trigger (future architecture)

Implement **cursor/keyset pagination** when **any** of:

1. Active catalog exceeds **50,000** SKUs, OR
2. p95 latency for `GET /api/v1/products?page=N` exceeds **100ms** in production APM, OR
3. Deep page requests (page >50) exceed **1%** of catalog API traffic

**Owner phase:** 28.10 Backend/API Optimization (API layer change — out of 28.9 scope).

---

## Orders pagination (reference)

Admin/customer order lists use `orders_created_at_index` and composite status indexes. At 10k orders, deep offset 500 completes in **1.24ms** — no action required.
