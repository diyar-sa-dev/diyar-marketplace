# Phase 21 — Slow Endpoints Report

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Performance Engineering  
**Scope:** Latency ranking, classification, root cause hypotheses, and evidence  

---

## 1. Latency Ranking by Measured Median

Ranked strictly by empirical median response time from baseline probes:

| Rank | Endpoint | Median (ms) | Classification | Primary Contributing Factor | Evidence |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **1** | `GET /api/v1/services?per_page=12` | **19.52** | PAYLOAD / SERIALIZATION | Service cards serialize vendor badges and pricing structures | 8.4 KB response |
| **2** | `GET /` (Frontend Root) | **19.05** | INGRESS / STATIC | Nginx static file transfer + compression negotiation | 35.6 KB HTML |
| **3** | `GET /api/v1/health/ready` | **17.62** | DATABASE / REDIS | Realtime active round-trips to MySQL & Redis sequentially | PDO + Redis Ping |
| **4** | `GET /api/v1/products/{id}/reviews`| **17.56** | DATABASE | Range scan on `product_reviews` with user relation join | Foreign key lookups |
| **5** | `GET /api/v1/products/{id}` | **16.99** | DATABASE / SERIALIZATION | ProductDetailResource loads 6 relations (category, vendor, inventory, etc.)| 2.1 KB payload |
| **6** | `GET /api/v1/categories` | **16.32** | SERIALIZATION | Hierarchical tree serialization of 20 categories | 6.2 KB payload |
| **7** | `GET /api/v1/products?per_page=12` | **15.85** | DATABASE | Indexed scan + batch review aggregation hydration | 10.0 KB payload |
| **8** | `GET /api/v1/storefront/home` | **14.83** | SERIALIZATION | Aggregate JSON of featured rails, promos, and categories | 40.7 KB payload |
| **9** | `GET /api/v1/catalog/search` | **14.65** | REDIS / DB | Facet resolution + ProductSearchContract search | 0.2 KB response |
| **10**| `GET /api/v1/products?q=chair` | **13.50** | DATABASE (FULLTEXT) | Ngram index candidate scan | 0.1 KB response |

---

## 2. Classification Breakdown

* **None of the endpoints exceed 20 ms median latency.**
* **Zero P0 or P1 Slow Endpoints:** All tested endpoints exhibit sub-20ms median latency in the KVM2-equivalent envelope.
* **Payload Dominance:** Endpoints with >15ms median latency are correlated with larger JSON serialization payloads (`storefront/home` @ 40KB, `services` @ 8KB, `products` @ 10KB) rather than database query bottlenecks.
* **Octane Concurrency Limit:** At 175+ RPS, request queuing manifests at the Nginx-to-FrankenPHP socket when 2 workers are saturated with long-running or bursty connections.
