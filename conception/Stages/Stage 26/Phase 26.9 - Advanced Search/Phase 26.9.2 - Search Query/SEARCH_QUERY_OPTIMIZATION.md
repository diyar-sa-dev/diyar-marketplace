# Phase 26.9.2 — Search Query Optimization Report

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Architecture & Performance Engineering  
**Scope:** Elimination of index invalidation and query bottleneck in MySQL search  

---

## 1. Executive Summary

In Phase 20, product search exhibited acceptable performance at 12 and 1,000 products, but degraded severely at 10,000 products (~410–427 ms median latency).

Our audit in Phase 26.9.1 revealed that `ProductService::applyFilters` contained:
```sql
MATCH(products.name, products.description) AGAINST (? IN BOOLEAN MODE)
OR products.name LIKE '%term%'
```

In MySQL 8, combining `MATCH(...)` with an `OR LIKE` condition disables index access via the FULLTEXT index `products_search_fulltext (name, description) WITH PARSER ngram`. MySQL is forced to execute a full table scan (`type: ALL`, `rows: 10000`, `key: NULL`), examining every single row and evaluating correlated subqueries on each candidate.

By isolating the MySQL FULLTEXT ngram engine and removing the redundant `OR LIKE` fallback when a valid search token exists, the query utilizes the `products_search_fulltext` index directly.

---

## 2. Before vs. After Latency Probes (10,000 Catalog)

Measurements captured on identical KVM2-equivalent Docker runtime (`cpuset 0-1`, Octane 2 workers, Nginx :8193):

| Endpoint / Search Query | Baseline 10K (ms) | Optimized 10K (ms) | Delta (ms) | Speedup Factor |
| :--- | :---: | :---: | :---: | :---: |
| `/products?q=chair` (English) | 410.02 | 14.21 | -395.81 | **28.9×** (96.5% drop) |
| `/products?q=sofa` (English) | 410.63 | 21.11 | -389.52 | **19.5×** (94.9% drop) |
| `/products?q=table` (English) | 415.79 | 13.76 | -402.03 | **30.2×** (96.7% drop) |
| `/products?q=cha` (English Prefix) | 417.81 | 13.65 | -404.16 | **30.6×** (96.7% drop) |
| `/products?q=طاولة` (Arabic Table) | 415.22 | 13.99 | -401.23 | **29.7×** (96.6% drop) |
| `/products?q=كرسي` (Arabic Chair) | 415.53 | 14.23 | -401.30 | **29.2×** (96.6% drop) |
| `/products?q=كنب` (Arabic Sofa) | 418.89 | 17.13 | -401.76 | **24.5×** (95.9% drop) |
| `/products?q=طاو` (Arabic Prefix) | 412.33 | 13.82 | -398.51 | **29.8×** (96.6% drop) |
| `/products?q=chair&min_price=500&max_price=2000` | 407.72 | 13.78 | -393.94 | **29.6×** (96.6% drop) |
| `/catalog/search?q=chair&type=products` | 419.06 | 18.84 | -400.22 | **22.2×** (95.5% drop) |
| `/catalog/search?q=طاولة&type=products` | 427.50 | 15.12 | -412.38 | **28.3×** (96.5% drop) |

---

## 3. Linguistic Correctness & Ngram Verification

1. **English full and prefix terms:** `chair`, `cha*` match correctly via ngram tokens.
2. **Arabic full and prefix terms:** `طاولة`, `طاو*` match correctly via ngram tokens without missing results.
3. **Empty/Special-character input:** If boolean token extraction produces empty string (e.g. non-word characters `***`), the query safely falls back to `where(name, 'like', '%...%')`.
4. **Result Counts:** Identical product result sets were returned across all probe endpoints before and after optimization.
