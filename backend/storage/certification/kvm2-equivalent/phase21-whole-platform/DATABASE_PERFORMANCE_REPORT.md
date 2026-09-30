# Phase 21 — Database Performance Report

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Database & Performance Engineering  
**Scope:** MySQL 8.0 InnoDB engine, query execution plans, index efficiency, connection pooling, and lock contention  

---

## 1. Engine & Configuration Audit

* **DBMS Version:** MySQL 8.0.x Community Server (Official Docker)
* **Storage Engine:** InnoDB default
* **Fulltext Engine:** MySQL ngram bi-gram parser (`ngram_token_size = 2`)
* **Buffer Pool Size:** 256 MB (Optimized for 1 GB memory container constraint)
* **Connection Limit:** `max_connections = 150`

---

## 2. Key Query Execution Plans (EXPLAIN Analysis)

### A. Optimized Public Fulltext Search
```sql
EXPLAIN SELECT id, vendor_account_id, category_id, name, slug, sale_price, compare_price, promotion_ends_at, product_type, availability_mode, created_at
FROM products
WHERE MATCH(name, description) AGAINST ('+chair*' IN BOOLEAN MODE)
  AND status = 'active' AND deleted_at IS NULL
ORDER BY created_at DESC LIMIT 12;
```
* **Type:** `fulltext`
* **Key Used:** `products_search_fulltext`
* **Rows Examined:** 1
* **Extra:** `Using where; Ft_hints: no_ranking; Using filesort`
* **Execution Time:** ~13.5 ms end-to-end

### B. Decoupled Review Aggregation Batch Query
```sql
EXPLAIN SELECT product_id, COUNT(*) AS aggregate_count, AVG(rating) AS aggregate_avg
FROM product_reviews
WHERE product_id IN ('id-1', 'id-2', 'id-3', 'id-4', ...)
GROUP BY product_id;
```
* **Type:** `range`
* **Key Used:** `idx_product_reviews_product_id`
* **Rows Examined:** 12
* **Execution Time:** **0.29 ms**

### C. Public Category Listing
```sql
EXPLAIN SELECT * FROM categories WHERE is_active = 1 AND parent_id IS NULL ORDER BY sort_order ASC;
```
* **Type:** `ref`
* **Key Used:** `idx_categories_active_parent`
* **Rows Examined:** 8–20
* **Execution Time:** < 1 ms

---

## 3. Concurrency, Locks & Slow Query Telemetry

* **Slow Queries Recorded:** **0** across all 25–175 RPS traffic ladder runs.
* **Row Lock Waits:** **0** (`Innodb_row_lock_waits = 0`).
* **Deadlocks:** **0**.
* **Temporary Disk Tables:** **0** (`Created_tmp_disk_tables = 0`).
* **Connection Utilization:** Peak 18 active connections during 175 RPS ladder (well below the 150 connection ceiling).
* **Buffer Pool Hit Rate:** > 99.8%.
