# Performance Issues & Optimization Backlog — Phase 28.7

**Date:** 2026-08-27  
**Rule:** Issues documented — **not fixed** in this phase.

---

## Performance issues

| ID | P | Category | Summary | Evidence |
|----|---|----------|---------|----------|
| PERF-028-001 | **P1** | TEST ENVIRONMENT LIMIT | Octane Docker PHP missing **bcmath** → `GET /products` **500** (`bcadd`), vendor analytics `bcsub` fails | Docker logs; baseline 100% 500 on `/products` |
| PERF-028-002 | **P2** | TEST ENVIRONMENT LIMIT | MySQL compose creds (`loadtest`) ≠ persistent volume (`staging_root`/`diyar_staging`) | API exit on default compose up; queue-verify auth fail |
| PERF-028-003 | **P2** | TEST ENVIRONMENT LIMIT | Host `artisan serve` binds :8000 — conflicts with Docker Octane | Wrong stack traces (Windows paths) before local serve stopped |
| PERF-028-004 | **P2** | OBSERVATION | Large dataset tier (100×) not seeded — admin-at-scale not measured | Dataset inventory |
| PERF-028-005 | **P2** | CAPACITY LIMIT | Default k6 `profiles.js` unusable until PERF-028-001 fixed | 95% error rate on baseline |
| PERF-028-006 | **P3** | OBSERVATION | 60 min soak not run — only 5 min @ 25 VU | SOAK_TEST_RESULTS |
| PERF-028-007 | **P3** | OBSERVATION | Web Vitals (LCP/INP) not captured in 28.7 | FRONTEND_PERFORMANCE |
| PERF-028-008 | **P3** | OBSERVATION | Assistant endpoint not load-profiled (per KI-028-053 — no abuse) | Strategy scope |

**Prior KIs not reclassified:** KI-028-018, KI-028-053, KI-028-054, etc.

---

## Confirmed performance-related defects (environment)

| ID | Defect | Production impact if deployed same image |
|----|--------|------------------------------------------|
| PERF-028-001 | Missing bcmath in `Dockerfile.octane` | **High** — catalog product listing broken |

*Fix deferred to infrastructure phase — not applied in 28.7.*

---

## Optimization backlog (DO NOT IMPLEMENT)

### OPT-DB

| ID | Problem | Evidence | Impact | Likely cause | Solution | Risk | Phase |
|----|---------|----------|--------|--------------|----------|------|-------|
| OPT-DB-001 | Products active list full scan + filesort | EXPLAIN ALL @ 500 rows | Grows O(n) with catalog | No composite index on `(status, created_at)` | Add index in optimization phase | Low lock time if online DDL | 28.9+ |
| OPT-DB-002 | Analytics events 30d aggregation | 5k rows, 1.9 ms analyze | At 100k+ events | Index selectivity | Partition or summary tables | Medium | 28.9+ |
| OPT-DB-003 | Admin list queries @ 10k+ rows | Not measured | Unknown | Unknown | Profile after large seed | — | 28.7 retry |

### OPT-API

| ID | Problem | Evidence | Impact | Likely cause | Solution | Risk | Phase |
|----|---------|----------|--------|--------------|----------|------|-------|
| OPT-API-001 | Products endpoint broken in Docker | 500 bcadd | Catalog down | Missing ext | Enable bcmath in image | Low | 28.9 infra |
| OPT-API-002 | Admin funnel wall time >> SQL time | 438 ms / 5.6 ms SQL | Dashboard slow at scale | PHP aggregation | Profile + cache warm paths | Medium | 28.10+ |
| OPT-API-003 | Checkout preview at cart sizes 1/5/10/20 | Not measured | Unknown | — | k6 authenticated workflow | — | 28.7 retry |
| OPT-API-004 | Analytics HTTP under load | vendor bcsub blocked | Vendor dashboard | bcmath + query | Fix env + k6 analytics.js | — | 28.7 retry |

### OPT-REDIS

| ID | Problem | Evidence | Impact | Likely cause | Solution | Risk | Phase |
|----|---------|----------|--------|--------------|----------|------|-------|
| OPT-REDIS-001 | None at current scale | p95 1.35 ms cache | — | — | Re-verify at 500+ VU | — | 28.9+ |

### OPT-QUEUE

| ID | Problem | Evidence | Impact | Likely cause | Solution | Risk | Phase |
|----|---------|----------|--------|--------------|----------|------|-------|
| OPT-QUEUE-001 | Worker throughput unknown | No jobs/min metric | Unknown under notify burst | Not measured | Dispatch benchmark | — | 28.9+ |

### OPT-FE

| ID | Problem | Evidence | Impact | Likely cause | Solution | Risk | Phase |
|----|---------|----------|--------|--------------|----------|------|-------|
| OPT-FE-001 | Main JS 499 KB | dist | Cold load transfer | Monolithic chunks | Code split (later) | Medium | 28.10+ |
| OPT-FE-002 | CartesianChart 325 KB | dist | Analytics route weight | Chart bundle | Lazy load refinement | Low | 28.10+ |

### OPT-INFRA

| ID | Problem | Evidence | Impact | Likely cause | Solution | Risk | Phase |
|----|---------|----------|--------|--------------|----------|------|-------|
| OPT-INFRA-001 | Docker MySQL credential drift | PERF-028-002 | CI/loadtest friction | Volume persistence | Document or reset volume | Low | 28.9 |
| OPT-INFRA-002 | bcmath in Octane image | PERF-028-001 | API 500 | Dockerfile gap | `docker-php-ext-install bcmath` | Low | 28.9 |

---

## Severity summary

| Priority | Count |
|----------|------:|
| P1 | 1 |
| P2 | 4 |
| P3 | 3 |

---

## Next steps

1. **Phase 28.8** — consolidate with functional/security backlogs
2. **Do not optimize** until 28.9+ authorization
3. First infra fix candidate: **OPT-INFRA-002** (bcmath) — enables full catalog load path remeasurement
