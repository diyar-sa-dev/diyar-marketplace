# Phase 26.9.0 — Baseline Measurement Report

**Date:** 2026-09-30  
**Environment:** Local KVM2-Equivalent Envelope (`cpuset 0-1`, `OCTANE_WORKERS=2`, MySQL 8.0, Redis 7 Alpine, Nginx :8193)  
**Hostinger Status:** NOT VERIFIED  
**Catalog Scale Under Test:** 10,000 Products (12 base + 9,988 deterministic synthetic generated via `perf:cardinality`)  

---

## 1. Baseline Measurements

### 1.1 Single-Request Latency Matrix (Local Probes)

| Endpoint / Query | Query Type | HTTP Code | Latency (ms) | Response Size (bytes) | Cache Mode |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `/products?per_page=12` | Listing (Page 1) | 200 | 13.76 | 10,715 | Redis Versioned Cache |
| `/products?per_page=12&page=20` | Listing (Mid page) | 200 | 13.61 | 10,669 | Redis Versioned Cache |
| `/products?per_page=12&sort=price` | Listing Sort ASC | 200 | 13.70 | 10,681 | Redis Versioned Cache |
| `/products?per_page=12&sort=-price` | Listing Sort DESC | 200 | 13.95 | 10,717 | Redis Versioned Cache |
| `/products?q=sofa` | English Search (Broad) | 200 | 13.68 | 17,341 | Redis Cached |
| `/products?q=chair` | English Search (Broad) | 200 | 13.68 | 17,803 | Redis Cached |
| `/products?q=table` | English Search (Broad) | 200 | 13.93 | 17,793 | Redis Cached |
| `/products?q=cha` | English Prefix Search | 200 | 14.02 | 17,803 | Redis Cached |
| `/products?q=طاولة` | Arabic Exact Search | 200 | 13.71 | 18,028 | Redis Cached |
| `/products?q=كرسي` | Arabic Exact Search | 200 | 21.51 | 17,807 | Redis Cached |
| `/products?q=كنب` | Arabic Exact Search | 200 | 13.62 | 17,353 | Redis Cached |
| `/products?q=طاو` | Arabic Partial Search | 200 | 17.76 | 18,028 | Redis Cached |
| `/products?q=chair&min_price=500...` | Filtered Search | 200 | 14.00 | 17,837 | Redis Cached |
| `/catalog/search?q=chair&type=products` | Unified Search | 200 | 15.84 | 19,196 | Redis Cached |
| `/catalog/search?q=طاولة&type=products` | Unified Search | 200 | 16.99 | 18,818 | Redis Cached |
| `/products/{sample_id}` | Product Detail | 200 | 13.38 | 2,344 | Redis Detail Cache |

---

## 2. Uncached MySQL Database Baseline (The Actual Bottleneck)

When cache is missed or under concurrent load (Phase 20 test results with 10K products), queries execute directly in MySQL.
Measured via MySQL `SHOW PROFILES` on the 10,000 product catalog:

| Query Variant | SQL Strategy | MySQL Execution Time | Rows Examined | Access Type | Filesort |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Current Baseline** | `MATCH(...) AGAINST(...) OR name LIKE '%term%'` + 2 Correlated Review Subqueries in SELECT | **370.5 ms** | 10,000 | `ALL` (Table Scan) | **YES** |
| **Pure FULLTEXT** | `MATCH(...) AGAINST(...)` + 2 Correlated Review Subqueries in SELECT | **73.1 ms** | ~100–500 | `fulltext` (`products_search_fulltext`) | **YES** |
| **FULLTEXT + Decoupled Aggregates** | `MATCH(...) AGAINST(...)` (Card fields only) | **34.7 ms** | ~100–500 | `fulltext` (`products_search_fulltext`) | **YES** |
| **Decoupled Review Aggregates Query** | Batch `WHERE product_id IN (...)` on paginated 12 IDs | **0.29 ms** | 12 | `ref` (`product_reviews_product_id_created_at_index`) | **NO** |

---

## 3. Baseline Verdict

- **Single Cached Request:** ~13–21 ms (Redis TTL cache mask).
- **Underlying MySQL Execution:** **370.5 ms** per search query under 10K products.
- **Root Cause Identified:**
  1. `OR products.name LIKE '%term%'` breaks the MySQL optimizer's ability to use the FULLTEXT index, causing a full table scan (`type: ALL`).
  2. Correlated subqueries `(SELECT count(*) FROM product_reviews ...)` and `(SELECT avg(rating) FROM product_reviews ...)` in the SELECT clause must be evaluated across candidate rows during filesort.
- **Status:** **BASELINE VERIFIED**
