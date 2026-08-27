# Phase 28.3 — API Performance Smoke Baseline

**Date:** 2026-08-27  
**Rule:** Functional smoke only — **NOT load testing** (→ Phase 28.7)

---

## Measurements captured

| Source | Metric | Environment |
|--------|--------|-------------|
| Phase 28.1 health | `GET /api/v1/health` ~115 ms | MariaDB dev + Redis |
| Feature suite duration | 696 tests in **~72 s** | SQLite |
| MySQL 8 API subset | 41 tests in **~317 s** | MySQL 8 (RefreshDatabase cost) |
| CatalogQueryPerformanceTest | Query log enabled — 0 N+1 review queries | SQLite |
| CheckoutShippingQueryCountTest | Bounded query growth 1→10 items | SQLite |

---

## Query-count regression tests (API layer)

| Endpoint / workflow | Test | Finding |
|---------------------|------|---------|
| `GET /api/v1/products?per_page=8` | `CatalogQueryPerformanceTest` | No per-card review N+1 |
| `POST /api/v1/checkout/preview` | `CheckoutShippingQueryCountTest` | Sub-linear query scaling |

---

## NOT measured in 28.3

| Item | Status |
|------|--------|
| Per-endpoint p95 latency SLA | NOT MEASURED |
| Analytics API response time under seed load | NOT MEASURED |
| Admin list endpoints at scale | NOT MEASURED |
| Payload sizes for all list endpoints | NOT MEASURED |

---

## Optimization candidates (deferred)

| ID | Candidate | Phase |
|----|-----------|-------|
| OPT-API-001 | Profile analytics API on MySQL 8 with seed | 28.7 |
| OPT-API-002 | Admin list pagination at 10k+ rows | 28.7 |

---

## Smoke gate

```text
CAPTURED (partial)
```

Sufficient for regression baselines; insufficient for production SLO claims.
