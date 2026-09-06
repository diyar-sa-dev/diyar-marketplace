# Performance Baseline — Phase 28.7

**Date:** 2026-08-27  
**Stack:** Octane + MySQL 8.0.46 + Redis 7  
**Dataset:** Medium (500 products)

---

## Idle / health (pre-load)

| Metric | Value |
|--------|-------|
| Health latency (compose network) | **11 ms** |
| Health status | ok |
| Redis memory | 1.43M |
| Redis connected clients (idle) | 16 |
| Queue pending (health) | 0 |
| Failed jobs (health) | 0 |

---

## Single-request latency (10 iterations)

Source: `raw/_api_baseline_octane_mysql8.json`  
Base URL: `http://127.0.0.1:8000/api/v1`

| Endpoint | p50 | p95 | max | HTTP | Avg payload |
|----------|-----|-----|-----|------|-------------|
| `/health` | 14 ms | 20 ms | 25 ms | 200 | 894 B |
| `/categories` | 8 ms | 22 ms | 23 ms | 200 | 5.9 KB |
| `/services?per_page=12` | 9 ms | 30 ms | 51 ms | 200 | 8.4 KB |
| `/vendors` | 6 ms | 21 ms | 21 ms | 200 | 1.1 KB |
| `/products?per_page=12` | 20 ms | 33 ms | 85 ms | **500** | 33 B |
| `/catalog/search?q=كنب…` | 31 ms | 95 ms | 388 ms | **500** | 33 B |

**Note:** `/products` and Arabic catalog search return **500** due to missing **bcmath** (`bcadd`) in Docker PHP — not intrinsic query slowness.

Working search (`q=sofa`): HTTP 200, empty product hits, facets populated.

---

## k6 baseline (10 VU, 55 s)

### Default `profiles.js` (includes `/products`)

| Metric | Value |
|--------|-------|
| RPS | 70.2 |
| p50 | 15 ms |
| p95 | 24 ms |
| Error rate | **95.11%** |

**Invalid for capacity claims** — dominated by `/products` 500s.

### `stage28-workload.js` (verified paths)

| Metric | Value |
|--------|-------|
| RPS | **23.4** |
| p50 | **42 ms** |
| p95 | **629 ms** |
| Error rate | **0%** |

Raw: `raw/_k6_stage28_baseline.txt`

---

## Comparison: Stage 22 (reference)

| Profile | Stack | RPS | p95 | Errors |
|---------|-------|-----|-----|--------|
| Stage 22 Profile 100 | Octane + MySQL (fresh loadtest DB) | 75.1 | 1312 ms | 0% |
| Stage 28.7 Profile 100 | Octane + MySQL 8 medium dataset | **177.9** | **248 ms** | 0% |

Different workload mix (stage28 excludes `/products`) and dataset state — **not directly comparable** as regression, but shows Octane headroom on working paths.

---

## Prior phase smoke (not production evidence)

| Source | Note |
|--------|------|
| Phase 28.3 API smoke | Functional only |
| Phase 28.4 frontend bundles | Size baseline |
| SQLite PHPUnit timings | **Not production performance** |
