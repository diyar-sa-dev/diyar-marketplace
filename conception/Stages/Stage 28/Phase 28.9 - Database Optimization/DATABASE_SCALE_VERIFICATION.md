# Database Scale Verification — Phase 28.9 Final

**Date:** 2026-08-27  
**Environment:** MySQL 8.0.46, `diyar_staging`, Docker port 3307  
**Script:** `backend/scripts/stage29-db-closure-verify.php`  
**Evidence:** `_db_closure_verify_mysql8.json`

---

## Dataset

| Table | Rows seeded | Method |
|-------|-------------|--------|
| `products` | 10,000 | `PerformanceDatasetSeeder` scale=100 |
| `orders` | 10,000 | Incremental bulk insert |
| `analytics_events` | 150,000 | Bulk event seed (exceeds 100k target) |
| `users` | ~2,000 | Base seed + performance seed |

**Note:** API container was stopped during bootstrap to prevent concurrent migration race on staging DB.

---

## OPT-DB verification @ scale

| ID | EXPLAIN type | Key | EXPLAIN ANALYZE | Wall time |
|----|--------------|-----|-----------------|-----------|
| OPT-DB-001 | ref | `products_status_created_at_index` | 0.065ms | 1.37ms |
| OPT-DB-004 | ref | `products_category_status_created_at_index` | 0.073ms | 1.35ms |
| OPT-DB-005 | ref | `products_vendor_status_created_at_index` | 0.050ms | 1.32ms |
| OPT-DB-006 | ref | `orders_user_created_at_index` | 0.012ms | 1.15ms |
| OPT-DB-007 | ref | `orders_status_created_at_index` | 0.022ms | 1.20ms |
| OPT-DB-007b | index | `orders_created_at_index` | 0.020ms | 1.25ms |

**Result:** 6/6 PASS — no filesort on any optimization query.

---

## Analytics (OPT-DB-002) @ 150k events

```sql
SELECT event_type, COUNT(*) AS c
FROM analytics_events
WHERE created_at >= ?
GROUP BY event_type
```

| Metric | Value |
|--------|-------|
| EXPLAIN type | index |
| Key | `analytics_events_event_type_created_at_index` |
| Rows examined (estimate) | 146,184 |
| Duration | 44.98ms |
| EXPLAIN ANALYZE | 58.1ms |

**Verdict:** PASS for current production scale. Partitioning/materialized views not required.

---

## Admin orders (OPT-DB-003) @ 10k orders

| Query | Key | Duration |
|-------|-----|----------|
| `ORDER BY created_at DESC LIMIT 20` | `orders_created_at_index` | 1.21ms |
| `WHERE status = ? ORDER BY created_at DESC LIMIT 20` | `orders_status_created_at_index` | 1.37ms |
| Deep offset 500 | `orders_created_at_index` | 1.24ms |

**Verdict:** PASS — admin list paths remain index-bound at 10k orders.

---

## MariaDB dev comparison (500 products)

Earlier deep pass on MariaDB 10.4 (`_db_explain_deep_after.json`) showed OFFSET 180+ degrading to ALL+filesort. MySQL 8 production engine maintains backward index scan through page 100 @ 10k products. This is an **optimizer difference**, not a missing index — same `products_status_created_at_index` is used.

---

## Future scale triggers

| Trigger | Action | Phase |
|---------|--------|-------|
| Catalog >50k active SKUs | Evaluate cursor/keyset pagination | 28.10 |
| Analytics >1M events/month | Evaluate date partitioning or rollup tables | 28.14+ |
| Admin lists >100k rows | Evaluate filtered composite indexes per admin filter matrix | 28.10 |
