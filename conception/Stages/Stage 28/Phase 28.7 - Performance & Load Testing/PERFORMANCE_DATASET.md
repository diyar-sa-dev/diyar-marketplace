# Performance Dataset — Phase 28.7

**Date:** 2026-08-27  
**Seeder:** `PerformanceDatasetSeeder`  
**Env var:** `DIYAR_PERF_DATASET_SCALE=1|10|100`

---

## Tiers

| Tier | Scale | Status | Notes |
|------|-------|--------|-------|
| Small | 1× | Via `migrate:fresh --seed` | Default DatabaseSeeder |
| **Medium** | **10×** | **SEEDED** | Primary measurement tier |
| Large | 100× | **NOT EXECUTED** | Time/resource constrained; target deferred |

Bootstrap command (Docker):

```powershell
docker compose -f docker-compose.loadtest.yml run --rm --no-deps `
  -e DB_HOST=mysql -e DB_DATABASE=diyar_staging -e DB_USERNAME=root -e DB_PASSWORD=staging_root `
  -e DIYAR_PERF_DATASET_SCALE=10 -v "${PWD}/backend:/var/www/html" `
  --entrypoint php api /var/www/html/scripts/stage28-performance-mysql8-bootstrap.php
```

`migrate:fresh --seed` duration: **~333 s** inside Docker.

---

## Medium tier counts (MySQL 8 — `diyar_staging`)

Captured: `raw/_dataset_inventory_mysql8.json`

| Table | Count |
|-------|------:|
| users | 200 |
| products | 500 |
| orders | 100 |
| order_items | 300 |
| vendor_orders | 100 |
| analytics_events | 5,000 |
| user_notifications | 1,000 |
| product_reviews | 0 |
| conversations / messages | 0 |
| payments | 0 |
| carts | 0 |
| services | 4 (from base seed) |
| b2b_companies | 7 (from base seed) |

---

## Gap vs Phase 28.7 targets

| Target | Achieved | Gap |
|--------|----------|-----|
| 10k+ products | 500 | Large tier not run |
| 10k+ users | 200 | Large tier not run |
| 10k+ orders | 100 | Large tier not run |
| 100k+ order items | 300 | Large tier not run |
| Large chat dataset | 0 | Seeder does not generate chat |
| Large review dataset | 0 | Not generated |

**Classification:** Medium tier sufficient for **relative** query-plan and Octane scaling evidence; **insufficient** for admin-list-at-10k-row claims.

---

## Seeder behavior (measurement-only)

Bulk inserts for: products, users, addresses, orders, vendor_orders, order_items, analytics_events, user_notifications, product_inventory.

Fixes applied during 28.7 (instrumentation bugs only):

- Table name `product_inventory` (not `product_inventories`)
- Address `type` field required
- `OrderStatus::Completed` (not `Delivered`)

---

## SQLite / MariaDB

| Engine | Used for 28.7 production claims? |
|--------|----------------------------------|
| SQLite | **No** |
| MariaDB XAMPP | **No** — dev only |
| MySQL 8 Docker | **Yes** |
