# Database Before/After — Phase 28.9

**Optimization ID:** OPT-DB-001  
**Query:** Public product catalog list (default sort)  
**Environment:** MySQL 8.0.46, `diyar_staging`, 500 active products (PerformanceDatasetSeeder)

---

## Query under test

```sql
SELECT id, name, sale_price
FROM products
WHERE status = 'active' AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20
```

**Application path:** `ProductService::cardQuery()` → `publiclyVisible()` → default `-created_at` sort → `paginate()`.

---

## BEFORE (Phase 28.7)

**Source:** `Phase 28.7/raw/_mysql8_explain_final.json`

| Metric | Value |
|--------|-------|
| type | **ALL** (full table scan) |
| key | **NULL** |
| rows examined | 500 |
| Extra | Using where; **Using filesort** |
| EXPLAIN ANALYZE | Table scan 500 rows → Sort → Limit 20 |
| Actual time (analyze) | ~0.31 ms @ 500 rows |

**Root cause:** Existing indexes `(category_id, status)` and `(vendor_account_id, status)` do not support global active list ordered by `created_at`.

---

## CHANGE

```sql
CREATE INDEX products_status_created_at_index ON products (status, created_at);
```

Migration: `2026_08_27_120000_add_products_status_created_at_index.php`

---

## AFTER (Phase 28.9)

**Source:** `_db_explain_after.json`

| Metric | Value |
|--------|-------|
| type | **range** |
| key | **products_status_created_at_index** |
| rows examined | 500 (filtered to ~50 active non-deleted) |
| Extra | Using index condition; Using where; **Backward index scan** |
| EXPLAIN ANALYZE | Index range scan (reverse) → Filter deleted_at → Limit 20 |
| Actual time (analyze) | **~0.06–0.09 ms** |

---

## Improvement

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Access method | Table scan | Index range scan (reverse) | Eliminates full scan |
| Filesort | Yes | **No** | Eliminated |
| Analyze time @ 500 rows | ~0.31 ms | ~0.09 ms | **~71% faster** (micro-benchmark) |
| Scale @ 10k+ rows | O(n) scan | O(log n) index seek + 20 rows | **Major** at catalog growth |

**Note:** End-to-end HTTP `/products` not re-benchmarked in 28.9 (requires PHP-FPM load profile from 28.7/28.10). SQL plan improvement is proven; wall-time claim limited to EXPLAIN ANALYZE.

---

## Write overhead

- One additional secondary index on `products`.
- INSERT/UPDATE on `status` or `created_at` incurs minor index maintenance — acceptable for read-heavy catalog.

---

## Regression

- `ProductTest::test_public_can_list_active_products` — correctness preserved.
- `CatalogQueryPerformanceTest` — N+1 review aggregates unchanged.
- `ProductListIndexTest` — MySQL EXPLAIN assertion (skipped on SQLite CI).
