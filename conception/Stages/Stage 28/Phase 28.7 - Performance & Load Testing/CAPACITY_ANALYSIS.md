# Capacity Analysis — Phase 28.7

**Date:** 2026-08-27  
**Disclaimer:** All boundaries are **environment-specific** (Windows dev workstation, Docker Octane, medium dataset).

---

## Observed baselines

| Workload | VUs | RPS | p50 | p95 | Error % |
|----------|----:|----:|----:|----:|--------:|
| stage28 baseline | 10 | 23 | 42 ms | 629 ms | 0 |
| stage28 profile 100 | 100 | **178** | 87 ms | **248 ms** | 0 |
| Spike (peak 100) | 100 | 122 | 75 ms | 392 ms | 0 |
| Soak | 25 | 78 | 47 ms | 156 ms | 0 |

---

## Degradation thresholds (observed)

| Signal | Threshold observed | Seen in 28.7? |
|--------|-------------------|---------------|
| p95 sharp increase | >2× baseline @ same VU | No @ ≤100 VU |
| Error rate | >5% | No on working paths |
| DB connection saturation | Rising 5xx/timeouts | No |
| Queue cannot drain | pending_jobs growth | No |
| CPU saturation | Not instrumented | Unknown |

---

## Capacity boundaries

### Identified

> **~100 concurrent users** on **public browse workload** (search, categories, services, vendors) sustained **~178 req/s**, **p95 ~248 ms**, **0% errors** on local Octane + MySQL 8 + Redis with **500 products**.

### Not identified

| Boundary | Reason |
|----------|--------|
| Checkout peak capacity | Not tested |
| Admin @ 10k rows | Dataset + workload gap |
| 500+ VU | Not executed |
| Production VPS (Hostinger) | Not this environment |

---

## Bottleneck ranking (evidence-based)

| Rank | Component | Evidence |
|------|-----------|----------|
| 1 | **Test env — bcmath** | `/products` 500 blocks primary catalog path |
| 2 | **Application PHP** | Admin funnel 438 ms vs 5.6 ms SQL |
| 3 | **MySQL plan (future scale)** | products ALL+filesort @ 500 rows |
| 4 | Redis | Sub-ms — not limiting |
| 5 | Queue | No backlog observed |
| 6 | Network / frontend | Not HTTP bottleneck in API tests |

---

## Healthy vs failure matrix

| Load level | HTTP paths | Classification |
|------------|------------|----------------|
| 10 VU | stage28 mix | Healthy |
| 100 VU | stage28 mix | Healthy |
| 100 VU | profiles.js (incl. products) | **Failure** (95% errors — env) |
| 25 VU × 5 min | stage28 mix | Healthy (soak) |

---

## Production SLOs

**NOT CERTIFIED** — no formal SLAs defined in project docs.

---

## Recommended staging validation (post-28.8)

1. Fix Docker bcmath; rerun full `profiles.js` Profile 100
2. Seed large tier (or subset: 10k products)
3. 60 min soak @ 25–50 VU with OS metrics
4. Profile 500 VU on Hostinger-class VPS
