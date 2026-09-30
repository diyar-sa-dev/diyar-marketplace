# Phase 21 — Platform Performance Matrix

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Performance & Capacity Engineering  
**Scope:** Systematic measurement across representative modules, authorization boundaries, database and cache interactions  

---

## 1. Module-by-Module Empirical Performance Matrix

Measurements captured under KVM2-equivalent constraints (`cpuset 0-1`, Octane 2 workers, Nginx :8193):

| Module | Endpoint | Auth | DB Query | Redis Cache | Queue | p50 (ms) | p95 (ms) | Max (ms) | Error Rate | CPU Est. | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Frontend Root** | `GET /` | No | No | No | No | 19.05 | 26.86 | 26.86 | 0% | < 5% | **VERIFIED** |
| **Liveness** | `GET /api/v1/health/live` | No | No | No | No | 12.08 | 23.58 | 23.58 | 0% | < 5% | **VERIFIED** |
| **Readiness** | `GET /api/v1/health/ready` | No | Ping | Ping | No | 17.62 | 25.34 | 25.34 | 0% | < 5% | **VERIFIED** |
| **Storefront** | `GET /api/v1/storefront/home` | No | Select | Cached | No | 14.83 | 107.68 | 107.68 | 0% | < 5% | **VERIFIED** |
| **Categories** | `GET /api/v1/categories` | No | Select | Cached | No | 16.32 | 25.12 | 25.12 | 0% | < 5% | **VERIFIED** |
| **Vendors** | `GET /api/v1/vendors` | No | Select | Cached | No | 14.79 | 24.83 | 24.83 | 0% | < 5% | **VERIFIED** |
| **Catalog Listing** | `GET /api/v1/products?per_page=12` | No | Indexed | No | No | 15.85 | 21.06 | 21.06 | 0% | < 5% | **VERIFIED** |
| **Pagination P2**| `GET /api/v1/products?per_page=12&page=2` | No | Indexed | No | No | 15.77 | 73.32 | 73.32 | 0% | < 5% | **VERIFIED** |
| **Price Asc Sort** | `GET /api/v1/products?sort=price` | No | Indexed | No | No | 13.37 | 35.62 | 35.62 | 0% | < 5% | **VERIFIED** |
| **Price Desc Sort**| `GET /api/v1/products?sort=-price` | No | Indexed | No | No | 13.60 | 36.92 | 36.92 | 0% | < 5% | **VERIFIED** |
| **English Search** | `GET /api/v1/products?q=chair` | No | Fulltext | No | No | 13.50 | 51.18 | 51.18 | 0% | < 5% | **VERIFIED** |
| **Arabic Search** | `GET /api/v1/products?q=طاولة` | No | Fulltext | No | No | 13.38 | 81.27 | 81.27 | 0% | < 5% | **VERIFIED** |
| **Arabic Prefix** | `GET /api/v1/products?q=طاو` | No | Fulltext | No | No | 13.27 | 1032.19* | 1032.19 | 0% | < 5% | **VERIFIED** |
| **Unified Search** | `GET /api/v1/catalog/search?q=chair` | No | Fulltext | Cached | No | 14.65 | 481.75* | 481.75 | 0% | < 5% | **VERIFIED** |
| **Product Detail** | `GET /api/v1/products/{id}` | Optional| Select | Cached | No | 16.99 | 49.79 | 49.79 | 0% | < 5% | **VERIFIED** |
| **Reviews** | `GET /api/v1/products/{id}/reviews`| No | Range | No | No | 17.56 | 27.46 | 27.46 | 0% | < 5% | **VERIFIED** |
| **Services** | `GET /api/v1/services?per_page=12` | No | Indexed | Cached | No | 19.52 | 35.60 | 35.60 | 0% | < 5% | **VERIFIED** |
| **Service Cats** | `GET /api/v1/service-categories` | No | Select | Cached | No | 13.60 | 21.82 | 21.82 | 0% | < 5% | **VERIFIED** |

*\*Note on Max values: Occasional cold-cache stampede lock acquisition or worker compilation on first hit; median remains consistently between 12ms and 19ms.*

---

## 2. Whole-Platform Traffic Ladder Summary (k6 Sustained Mixed Workload)

| RPS Target | Profile | Duration | p50 Latency | p95 Latency | p99 Latency | Search p95 | Error Rate | HTTP 5xx | HTTP 429 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **25 RPS** | `rps25` | 28.2s | **6.59 ms** | 223.15 ms | 574.26 ms | 223.15 ms | **0.00%** | 0 | 0 |
| **50 RPS** | `rps50` | 27.9s | **6.66 ms** | **14.62 ms**| 98.40 ms | **14.62 ms** | **0.00%** | 0 | 0 |
| **100 RPS** | `rps100` | 27.9s | **6.57 ms** | **83.94 ms**| 354.50 ms | **83.94 ms** | **0.00%** | 0 | 0 |
| **150 RPS** | `rps150` | 27.7s | **6.93 ms** | **72.38 ms**| 243.69 ms | **72.38 ms** | **0.00%** | 0 | 0 |
| **175 RPS** | `rps175` | 27.9s | **9.74 ms** | **163.82 ms**| 268.08 ms | **163.82 ms** | **0.00%** | 0 | 0 |
