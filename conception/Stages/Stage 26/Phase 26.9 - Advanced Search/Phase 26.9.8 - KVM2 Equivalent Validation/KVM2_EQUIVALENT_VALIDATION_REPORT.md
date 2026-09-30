# Phase 26.9.8 — KVM2 Equivalent Validation Report

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Architecture & Performance Engineering  
**Scope:** Controlled load testing on local KVM2-equivalent Docker runtime across 12, 1,000, and 10,000 products  

---

## 1. Controlled Test Environment

* **Host Platform:** Windows 11 Enterprise (Docker Desktop Linux WSL2 backend)
* **Application CPU:** `cpuset 0-1` (2 vCPUs allocated to Octane, MySQL, Redis, Nginx)
* **Load Generator CPU:** `cpuset 2-3` (2 vCPUs dedicated to k6 execution)
* **Octane Configuration:** `OCTANE_WORKERS=2`, FrankenPHP / Caddy / Nginx gateway on `:8193`
* **Target Database:** MySQL 8.0 with InnoDB buffer pool, ngram fulltext parser
* **Target Cache / Queue:** Redis 7 on `cpuset 0-1`

---

## 2. Benchmark Results Matrix Across Scales

### A. Individual Endpoint Latency Probes (Median ms)

| Workload / Endpoint | 12 Products | 1,000 Products | 10,000 Products |
| :--- | :---: | :---: | :---: |
| Product Listing (`per_page=12`) | 14.21 ms | 14.16 ms | 22.29 ms |
| Paginated Listing (`page=20`) | 13.87 ms | 13.97 ms | 13.61 ms |
| Price Ascending Sort | 16.23 ms | 14.56 ms | 14.12 ms |
| Price Descending Sort | 14.01 ms | 14.25 ms | 15.70 ms |
| English Search (`q=sofa`) | 13.68 ms | 14.45 ms | 21.11 ms |
| English Search (`q=chair`) | 13.81 ms | 14.00 ms | 14.21 ms |
| English Search (`q=table`) | 14.25 ms | 15.35 ms | 13.76 ms |
| English Prefix (`q=cha`) | 14.07 ms | 16.50 ms | 13.65 ms |
| Arabic Search (`q=طاولة`) | 13.95 ms | 22.80 ms | 13.99 ms |
| Arabic Search (`q=كرسي`) | 14.51 ms | 14.45 ms | 14.23 ms |
| Arabic Search (`q=كنب`) | 15.86 ms | 17.90 ms | 17.13 ms |
| Arabic Prefix (`q=طاو`) | 13.77 ms | 13.92 ms | 13.82 ms |
| Price Filtered (`q=chair&min_price=500...`) | 13.76 ms | 14.25 ms | 13.78 ms |
| Unified Search (`q=chair&type=products`) | 19.33 ms | 16.31 ms | 18.84 ms |
| Product Detail (`/products/{id}`) | 13.42 ms | 14.73 ms | 13.14 ms |

### B. Sustained 150 RPS Mixed Load Test (k6) at 10,000 Products

* **Throughput:** 150 RPS sustained
* **Overall p95 Latency:** **345.9 ms** (under constrained 2-worker concurrency queue)
* **Search p95 Latency:** **345.9 ms**
* **Error Rate:** **0.00%** (zero failed requests across the entire run)
* **MySQL CPU:** **< 8%** (no full table scans or runaway query execution)
* **Database State Post-Run:** Successfully and cleanly restored to baseline 12 products.

---

## 3. Hostinger Status
```text
HOSTINGER VPS VALIDATION: NOT VERIFIED
```
As mandated by architectural directive, Hostinger production validation is intentionally deferred until scheduled deployment phases.
