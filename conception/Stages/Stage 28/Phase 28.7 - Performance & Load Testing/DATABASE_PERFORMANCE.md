# Database Performance — Phase 28.7

**Date:** 2026-08-27  
**Engine:** MySQL **8.0.46**  
**Database:** `diyar_staging`  
**Dataset:** Medium (500 products, 5k analytics events)

Raw: `raw/_mysql8_explain_final.json`

---

## EXPLAIN ANALYZE snapshots

### orders_by_status_count

```sql
SELECT status, COUNT(*) AS c FROM orders GROUP BY status
```

| Plan | Detail |
|------|--------|
| Access | Covering index `orders_user_id_status_index` |
| Rows | 100 |
| Extra | Using temporary (small) |
| Analyze time | ~0.1 ms aggregate |

**Classification:** OBSERVATION — acceptable at current scale.

---

### analytics_events_recent (30d window)

```sql
SELECT event_type, COUNT(*) AS c FROM analytics_events
WHERE created_at >= ? GROUP BY event_type
```

| Plan | Detail |
|------|--------|
| Index | `analytics_events_event_type_created_at_index` |
| Rows examined | ~5,000 |
| Analyze time | ~1.9 ms |

**Classification:** OBSERVATION — index used; watch at 100k+ rows (OPT-DB-002).

---

### products_active_list ⚠️

```sql
SELECT id, name, sale_price FROM products
WHERE status = ? ORDER BY created_at DESC LIMIT 20
```

| Plan | Detail |
|------|--------|
| type | **ALL** (full table scan) |
| rows | 500 |
| Extra | **Using where; Using filesort** |
| Analyze time | ~0.31 ms @ 500 rows |

**Classification:** OPTIMIZATION CANDIDATE — **OPT-DB-001**

At 10k+ products, expect linear scan + sort cost growth.

---

## In-process service profiles

| Service | Duration | Query count | DB time |
|---------|----------|-------------|---------|
| `AdminAnalyticsService::funnel` | **437.9 ms** | 7 | 5.6 ms |
| `VendorAnalyticsService::overview` | **ERROR** | — | `bcsub()` missing (env) |

Admin funnel: wall time dominated by **PHP/application**, not SQL aggregate time.

---

## N+1 / query explosion

| Area | Phase 28.2/28.3 prior | Phase 28.7 |
|------|----------------------|------------|
| Catalog reviews | Mitigated | Not re-tested (products 500) |
| Checkout shipping | Bounded | Not load-tested |
| Analytics admin | Not measured | **7 queries** @ medium tier |
| Admin lists @ 10k | Not measured | Dataset gap |
| Chat / notifications | Not measured | No seed data |

---

## SQLite / MariaDB

No EXPLAIN evidence from this phase labeled as production performance.

---

## Optimization backlog (deferred)

| ID | Problem | Evidence | Phase |
|----|---------|----------|-------|
| OPT-DB-001 | Products list scan+filesort | EXPLAIN ALL @ 500 rows | 28.9+ |
| OPT-DB-002 | Analytics events aggregation | 5k rows OK; unbounded at scale | 28.9+ |
| OPT-DB-003 | Admin/vendor analytics at 10k+ orders | Not measured | 28.7 retry w/ large tier |
