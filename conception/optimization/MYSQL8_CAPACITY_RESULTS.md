# MySQL 8 Capacity Results — DIYAR Marketplace

**Date:** 2026-08-29  
**Engine:** MySQL **8.0.46** (Docker `mysql:8.0`)  
**Script:** `backend/scripts/stage29-db-scale-explain.php`  
**Label:** `docker-10k`

---

## Dataset

| Table | Rows |
|-------|-----:|
| products | 10,000 |
| orders | 0 (seeder orders in separate pass) |
| PerformanceDatasetSeeder | +9,988 products, +1,992 users, +10,000 orders |

---

## EXPLAIN ANALYZE Highlights (MEASURED)

| Query | Index used | EXPLAIN ANALYZE (approx) | Status |
|-------|------------|-------------------------|--------|
| products_public_offset_0 | `products_status_created_at_index` | ~0.09 ms for 20 rows | PASS |
| products_public_offset_180 | same | ~0.32 ms | PASS |
| products_public_offset_980 | same | ~1.33 ms | PASS |
| products_public_offset_4980 | same | ~5.5 ms (5000 rows examined) | PASS — deep offset cost visible |
| products_category_list | `products_category_status_created_at_index` | ~0.05 ms | PASS |
| products_vendor_list | `products_vendor_status_created_at_index` | ~0.08 ms | PASS |
| orders_admin_offset_0 | `orders_created_at_index` covering | ~0.009 ms | PASS |
| messages_conversation | `messages_conversation_id_created_at_id_index` | ~0.005 ms | PASS |

---

## Observations

1. **Index coverage is production-grade** for catalog list, category, vendor, and order admin paths at 10k products.
2. **Deep OFFSET** (page 250+) examines thousands of rows — mitigated in API by `PaginationBounds` max page 200 (ENT-PAG-001).
3. MariaDB 10.4 local measurements from prior pass are **superseded** by MySQL 8 Docker evidence.
4. 50k / 100k / 250k product scales: **NOT RUN** (time); 10k is **MEASURED**.

---

## Connection Budget

| Item | Value | Status |
|------|-------|--------|
| Octane workers | 8 | configured |
| Max connections (default) | 151 | MySQL 8 default |
| Measured peak connections under k6 | NOT INSTRUMENTED | PROJECTED safe at ≤10 RPS |

Raw output: captured via `docker exec diyar-marketplace-api-1 php scripts/stage29-db-scale-explain.php`
