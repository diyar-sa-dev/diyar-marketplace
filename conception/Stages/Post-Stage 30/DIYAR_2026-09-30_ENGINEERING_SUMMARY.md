# DIYAR — Engineering Summary 2026-09-30

**Date:** 2026-09-30  
**Authority:** Senior Software Engineer + Software Architect + QA & Performance Review  
**Branch:** `diyar/dev` (Local `dev` tracking `diyar/dev`)  
**Scope:** Closure of Phase 20, Phase 20.1, Phase 20.2, and Stage 26.9 / Phase 20.5; Phase 21 Preparation  

---

## 1. Executive Summary

Today's engineering work was dedicated to rigorous measurement, bottleneck isolation, architectural optimization, and formal closure of **Phase 20** (Clean Runtime Contention, Dedicated Analytics Queue Experiment, Cardinality Scaling) and **Stage 26.9 / Phase 20.5** (Senior Search Optimization & Scalability Program).

All objectives were achieved without introducing Meilisearch, Elasticsearch, Docker search services, or external search infrastructure:
1. **Resolved 10K Search Degradation:** Identified that `MATCH(...) OR LIKE '%term%'` invalidated MySQL's ngram FULLTEXT index and caused full table scans with correlated review subqueries.
2. **Implemented Pure FULLTEXT + Batch Hydration:** Removed the redundant `OR LIKE` fallback, dropping rows examined from ~10,000 to 1 in the cited query plan, and replaced per-row correlated review subqueries with a single 0.29 ms batch hydration query.
3. **Verified Performance:** Search latency across English and Arabic queries dropped from **~410–427 ms** down to **13.6–21.1 ms** (19× to 30× faster, >95% latency reduction in the tested KVM2-equivalent environment).
4. **Architectural Cleanliness:** Introduced a minimal future-proof abstraction (`ProductSearchContract` / `ProductSearchService`) keeping MySQL as the single source of truth.
5. **Phase 21 Prepared & Deferred:** Created the Phase 21 whole-platform inventory and test scripts. Formal execution is strictly deferred until tomorrow.

---

## 2. Phase 20 — Clean Runtime Contention & Baseline

### Topology & Resource Constraints
* **Reverse Proxy:** Nginx on port `:8193`
* **Application Server:** Laravel Octane (FrankenPHP) with `OCTANE_WORKERS=2`
* **Core Pinning:** Application, MySQL 8, and Redis 7 pinned strictly to `cpuset: 0-1` (2 vCPUs)
* **Load Generator:** k6 pinned strictly to `cpuset: 2-3`
* **Pre-condition Gates:** Zero queue depth on `queues:default` and `queues:analytics`, zero `failed_jobs`

### Findings & Local Capacity Boundary
* **Sub-150 RPS Stability:** The platform operates with sub-15ms median latency and 0.00% error rate up to 150 RPS sustained load.
* **175–200 RPS Capacity Ceiling:** At 175–200 RPS, the 2-worker / 2-vCPU application boundary becomes the dominant saturation condition:
  - Octane worker CPU reaches ~90% average / 148% peak across both cores.
  - Tail latency increases (p95 rising to ~160ms).
  - Nginx waiting connections increase as requests wait in the socket listen backlog.
  - Zero HTTP 5xx or 429 errors occurred during the tested campaign.
* **Verdict:** Measured local capacity boundary of the 2-vCPU constraint; not an application correctness failure.

---

## 3. Phase 20.1 / 20.5 — Analytics Queue Isolation

### Controlled Experiment
* **Control:** `RecordSearchQueryAnalyticsJob` routed to `default` queue with a shared worker.
* **Treatment:** `RecordSearchQueryAnalyticsJob` routed to `analytics` queue with a dedicated worker.

### Empirical Result
* **Operational Isolation:** 100% background isolation achieved. `queues:default` depth remained at 0, preventing background telemetry from delaying customer order or payment events.
* **HTTP Latency Finding:** The dedicated analytics queue did **not** improve HTTP latency because both worker processes still competed for the same constrained CPU cores (`cpuset 0-1`).
* **Architectural Rule:** Dedicated analytics queue is an **operational isolation and stability mechanism**, not an HTTP latency optimization.

---

## 4. Phase 20.2 — Catalog Cardinality Scaling

Catalog cardinalities tested deterministically: **12**, **1,000**, and **10,000** products.

* **Product Listing (`/products?per_page=12`):** Stable across all cardinalities (~14–22 ms). Existing indexes support ordered listing efficiently without table scans.
* **Product Detail (`/products/{id}`):** Stable across all cardinalities (~13–18 ms).
* **Search Degradation at 10,000 Products:** Under the previous query builder implementation, broad search execution time degraded to ~380 ms in MySQL (410–427 ms end-to-end) due to the `OR LIKE` index invalidation and correlated scalar subqueries.

---

## 5. Stage 26.9 / Phase 20.5 — MySQL Search Optimization

### Architecture Implemented
```text
CatalogSearchController / ProductController
              ↓
    ProductSearchContract
              ↓
    ProductSearchService
              ↓
       ProductService
              ↓
  MySQL FULLTEXT (ngram)
```

1. **Pure Fulltext Query:**
   In `ProductService::applyFilters`, when a boolean search string exists, the query executes pure `MATCH(name, description) AGAINST (? IN BOOLEAN MODE)`. The `LIKE '%term%'` fallback is preserved only when boolean query extraction produces an empty string.
2. **Batched Review Hydration:**
   Removed `withCount(['reviews'])` and `withAvg('reviews', 'rating')` from the catalog pagination query. Added `ProductService::hydrateReviewAggregates(iterable $products)`, executing a single indexed batch query:
   ```sql
   SELECT product_id, COUNT(*) AS aggregate_count, AVG(rating) AS aggregate_avg
   FROM product_reviews WHERE product_id IN (...) GROUP BY product_id;
   ```
   Execution time: **0.29 ms** for 12 products.
3. **Lean Card Projection:**
   Preserved lean projection in `cardColumns()`. Large text fields (`description`, `materials`, `warranty`), secondary image galleries, and review comments remain strictly excluded from search and listing queries, reserved for the product detail endpoint.

---

## 6. Search Architecture Decision

```text
CURRENT DECISION:
  MySQL = Source of Truth & Active Search Engine
  Meilisearch = DEFERRED
  Elasticsearch = DEFERRED
```

### Why:
* The current optimized MySQL architecture satisfies the tested 10,000-product catalog workload with substantial measured improvement (13.6–21.1 ms median latency).
* Introducing Meilisearch, Elasticsearch, or a dedicated search microservice at this stage would introduce operational complexity, index synchronization overhead, and additional memory pressure on the VPS without current evidence requiring it.
* A dedicated search service remains deferred until real Hostinger deployment and real production-scale evidence demonstrate that MySQL search has reached an unacceptable architectural boundary.

---

## 7. Performance Evidence Comparison (10,000 Products)

Measurements captured in the controlled KVM2-equivalent test environment:

| Endpoint / Query | Baseline (10K) | Optimized (10K) | Measured Delta |
| :--- | :---: | :---: | :---: |
| English Search (`q=chair`) | 410.02 ms | 14.21 ms | **-395.8 ms (28.9× faster)** |
| English Search (`q=sofa`) | 410.63 ms | 21.11 ms | **-389.5 ms (19.5× faster)** |
| English Search (`q=table`) | 415.79 ms | 13.76 ms | **-402.0 ms (30.2× faster)** |
| English Prefix (`q=cha`) | 417.81 ms | 13.65 ms | **-404.2 ms (30.6× faster)** |
| Arabic Search (`q=طاولة`) | 415.22 ms | 13.99 ms | **-401.2 ms (29.7× faster)** |
| Arabic Search (`q=كرسي`) | 415.53 ms | 14.23 ms | **-401.3 ms (29.2× faster)** |
| Arabic Search (`q=كنب`) | 418.89 ms | 17.13 ms | **-401.8 ms (24.5× faster)** |
| Arabic Prefix (`q=طاو`) | 412.33 ms | 13.82 ms | **-398.5 ms (29.8× faster)** |
| Unified Search (`/catalog/search?q=chair`) | 419.06 ms | 18.84 ms | **-400.2 ms (22.2× faster)** |
| Rows Examined (cited EXPLAIN plan) | ~10,000 | 1 | **Plan-specific measured reduction** |
| Correlated Subqueries per Row | 2 | 0 | **1 batch query @ 0.29 ms** |
| Sustained 150 RPS Error Rate | — | **0.00%** | **Rock solid** |

*Note: These measurements apply to the tested KVM2-equivalent local envelope and tested dataset. They are not universal claims or Hostinger measurements.*

---

## 8. Infrastructure Status

```text
Local KVM2-Equivalent Envelope:  VERIFIED / CERTIFIED WITH LIMITATIONS
Hostinger Real VPS:              NOT VERIFIED (Scheduled for production release gates)
```

---

## 9. Automated Test Verification

* **Backend Catalog & Search Suite:** `tests/Feature/Api/V1/Catalog` and `tests/Feature/Api/V1/Search`
  * Tests: **171 passed** (793 assertions, 0 failures)
* **Backend Full Suite Certified State:**
  * Total: 1,108 tests (1,101 passed, 7 skipped due to explicit environment dependencies, 0 failed, 4,560 assertions)
* **Frontend Vitest Suite:**
  * Tests: **350 passed** (87/87 test files, 0 failures)
* **Production Build:**
  * `npm run build` passed cleanly (3,107 modules compiled)
* **Frontend WebGL Compatibility Fix:**
  * Guarded WebGL availability prior to dynamic Three.js loading in `ThreeRoomRenderer.ts` (Commit `4751d01`).

---

## 10. Commits Completed Today

All commits are recorded locally on branch `dev` (tracking `diyar/dev`):

1. `4751d01 fix(room-designer): guard webgl availability prior to three.js dynamic load`
2. `3e8327a test(phase20): record clean runtime contention queue isolation and cardinality evidence`
3. `1dda00a perf(search): optimize mysql catalog search query and review hydration`
4. `1054a9a docs(stage-26.9): certify mysql search optimization and scalability`
5. `ecd5949 perf(kvm2): establish whole-platform performance and capacity baseline`
6. `41396b3 docs(kvm2): certify whole-platform performance baseline`

---

## 11. Architectural Decisions Summary

1. **No Meilisearch Now:** Explicitly deferred.
2. **No Elasticsearch Now:** Explicitly deferred.
3. **No Hostinger Deployment Today:** Intentionally held for formal deployment stage.
4. **Phase 20 Closed:** Complete with limitations (2-vCPU capacity boundary documented).
5. **Stage 26.9 Closed:** Complete and certified within local tested scope.
6. **Phase 21 Status:** Prepared; execution deferred to tomorrow.

---

## 12. Next Step

```text
Tomorrow:
Phase 21 — Whole Platform Performance Measurement
```
Scope: Complete browser-to-backend user journeys, multi-module saturation testing, authenticated commerce flows, and full capacity attribution.
