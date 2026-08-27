# API Load Results — Phase 28.7

**Date:** 2026-08-27  
**Tool:** k6 via Docker on `diyar-marketplace_default` network  
**Target:** `http://diyar-perf-api-28:8000/api/v1`

---

## Scripts

| Script | Purpose | Result |
|--------|---------|--------|
| `profiles.js` | Legacy catalog hot path | **FAIL** — 95% errors (products 500) |
| `stage28-workload.js` | Verified endpoint mix | **PASS** — primary 28.7 evidence |
| `analytics.js` | Authenticated analytics | **NOT RUN** — depends on demo users + bcmath |

---

## stage28-workload mix

| Traffic share | Endpoint |
|---------------|----------|
| 35% | `GET /catalog/search?q=sofa…` |
| 15% | `GET /categories` |
| 15% | `GET /services?per_page=12` |
| 10% | `GET /vendors` |
| 10% | `GET /health` |
| 15% | `GET /catalog/search?q=chair…` |

Sleep: 200 ms between iterations.

---

## Profile results

### Baseline (peak 10 VU, 55 s)

| Metric | Value |
|--------|-------|
| RPS | 23.39 |
| p50 | 41.99 ms |
| p95 | 628.90 ms |
| Error rate | 0% |
| Iterations | 1,287 |

### Profile 100 (peak 100 VU, 2 min)

| Metric | Value |
|--------|-------|
| RPS | **177.94** |
| p50 | **87.12 ms** |
| p95 | **247.79 ms** |
| Error rate | **0%** |
| Iterations | 21,563 |

Raw: `raw/_k6_stage28_profile100.txt`

---

## Endpoints NOT load-tested

| Endpoint / area | Reason |
|-----------------|--------|
| `GET /products` | 500 — bcmath (PERF-028-001) |
| Cart / checkout | Session + bcmath dependency |
| Orders CRUD | Controlled data + not instrumented |
| Payments / webhooks | Excluded — no real gateway |
| Admin lists @ 10k rows | Dataset tier not reached |
| Assistant public API | KI-028-053 — no abuse testing |
| Authenticated analytics HTTP | Blocked by vendor bcsub in Docker |

---

## Degradation classification

| Profile | Classification |
|---------|----------------|
| 10 VU baseline | **Healthy** |
| 100 VU | **Healthy** (p95 < 250 ms, 0% errors) |

---

## Optimization candidates (deferred)

| ID | Finding |
|----|---------|
| OPT-API-001 | Restore `/products` path after bcmath in Docker image |
| OPT-API-002 | Profile checkout preview query scaling at medium/large tier |
| OPT-API-003 | HTTP analytics endpoints under authenticated k6 |
