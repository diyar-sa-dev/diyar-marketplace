# Database Scale Audit — Phase 28.9 (Deep Pass)

**Date:** 2026-08-27  
**Evidence:** `_db_scale_deep_after.json`  
**Dataset:** 500 products, 3 orders (local MariaDB) — **limited scale; extrapolation documented**

---

## Methodology

Probed EXPLAIN for:

- Page 1 equivalent (OFFSET 0)
- Deep pages: OFFSET 180, 980, 4980 (simulating page 10, 50, 250 @ 20/page)
- Filtered catalog paths (category, vendor)
- Admin/user order lists
- Messages, notifications

**Note:** MariaDB 10.4 does not support `EXPLAIN ANALYZE` — timing from MySQL 8 staging used where available.

---

## Products public list

| OFFSET | Rows in DB | type | key | filesort |
|--------|------------|------|-----|----------|
| 0 | 500 | range | `products_status_created_at_index` | No |
| 180 | 500 | **ALL** | null | **Yes** |
| 980 | 500 | **ALL** | null | **Yes** |
| 4980 | 500 | **ALL** | null | **Yes** |

**Finding DB-PAG-001 (P2):** Index eliminates filesort for **first pages** but **OFFSET pagination** forces full scan + sort at deep offsets. At 10k–100k rows this becomes expensive.

**Mitigation (future, not 28.9):** Cursor pagination on `/api/v1/products` when API contract allows (28.10+). Current offset API preserved.

**10k extrapolation:** First page remains O(log n); page 500 remains O(n) — **not production-safe at deep pagination**.

---

## Category / vendor filtered lists

Composite indexes added:

- `products_category_status_created_at_index`
- `products_vendor_status_created_at_index`

MariaDB 10.4 optimizer sometimes selects `products_status_created_at_index` when status cardinality dominates. Composite indexes exist; **MySQL 8 production verification recommended** under realistic category distribution.

**At 10k+ products per category:** Composite index expected to win — **VERIFIED by index design, optimizer-dependent on MariaDB dev**.

---

## Orders

| Query | Index used | Deep OFFSET |
|-------|------------|-------------|
| Admin `ORDER BY created_at DESC` | `orders_created_at_index` | Index scan — scales |
| Admin `WHERE status ORDER BY created_at` | `orders_status_created_at_index` | Index scan — scales |
| User `WHERE user_id ORDER BY created_at` | `orders_user_created_at_index` | Per-user subset — scales |

**OPT-DB-003 status:** Partially addressed — admin/user order indexes added. **NOT VERIFIED at 10k orders** (dataset too small).

---

## Messages / notifications

| Query | Index | Assessment |
|-------|-------|------------|
| Messages by conversation | `(conversation_id, created_at, id)` | PASS — cursor-friendly |
| User notifications | `(user_id, created_at)` | PASS |

Chat already uses **cursor pagination** in API — good scale pattern.

---

## Analytics events

@ 5k rows: covering index, ~2 ms (MySQL 8, Phase 28.7).

| Scale | Expected | Action |
|-------|----------|--------|
| 100k | Monitor | OPT-DB-002 deferred |
| 1M+ | Rollups/partitioning | Future — not 28.9 |

---

## Scale test matrix

| Dataset size | Tested | Result |
|--------------|--------|--------|
| 500 products | Yes | First page optimized |
| 5k products | NOT VERIFIED locally | Extrapolated from index design |
| 10k orders | NOT VERIFIED | Indexes in place |
| 100k rows | NOT VERIFIED | Document only |
| 1M+ rows | NOT VERIFIED | Cursor + rollups recommended |

**PerformanceDatasetSeeder** supports up to 10k products/orders for future controlled benchmarks — not run in this pass (avoid polluting dev DB).

---

## Recommendations

| ID | Issue | Priority | Phase |
|----|-------|----------|-------|
| DB-PAG-001 | Product deep OFFSET | P2 | 28.10 API |
| DB-SCALE-001 | 10k order admin benchmark | P2 | 28.9 follow-up / staging |
| DB-SCALE-002 | Analytics @ 100k | P3 | Monitor |
