# DIYAR — LOCAL KVM2-EQUIVALENT VALIDATION REPORT

**Date:** 2026-09-19  
**Scope:** Local Linux Docker only (`diyar-kvm2-test` on `:8193`). **Not** the Hostinger VPS (`195.200.14.40`).  
**Git:** `62cc1ad` (includes Day 29 search `df0e5e1` as ancestor). **No application code changes** during validation.  
**Evidence:** `backend/storage/certification/kvm2-equivalent/` (`campaign.json`, 23× `summary-*.json`, 46× `stats-*.csv`)

---

## A. Environment

```text
Host OS:           Windows 10 + Docker Desktop 29.1.3 (Linux containers)
Docker Compose:    5.0.1
Linux environment: REPRODUCED (container runtime)
CPU limit:         Per-service ceilings in docker-compose.kvm2-test.yml; host Docker VM not strictly capped to 2 vCPU (k6 saw ~11.68 GiB)
RAM limit:         ~6.5 GiB sum of container memory limits (documented in compose overlay)
Storage:           Docker volumes (APPROXIMATED vs VPS NVMe)
Laravel:           13.26.1
PHP:               8.3.33
Octane:            running (artisan octane:status)
Swoole:            yes
Octane workers:    2 (OCTANE_WORKERS=2, not changed during tests)
MySQL:             8.0.46 (innodb_buffer_pool 512M in mysql-kvm2.cnf)
Redis:             7.4.7 (maxmemory 512mb, prefix diyar-kvm2-test-)
Nginx:             1.27.5
Queues:            redis (critical + default workers running; healthcheck unhealthy cosmetic)
Reverb:            2 nodes healthy
DIYAR_LOADTEST_MODE: false (rate limits on)
Path:              k6 → nginx → Octane → MySQL/Redis/queues
```

---

## B. Environment Fidelity

| Dimension | Label |
|-----------|--------|
| CPU/RAM constraint (2 vCPU / 8 GB envelope) | **APPROXIMATED** (limits set; host Docker not verified at exactly 2 CPU / 8 GiB) |
| Linux + Docker | **REPRODUCED** |
| Production-like stack (Nginx/Octane/MySQL/Redis/queues/Reverb/scheduler) | **REPRODUCED** |
| Application architecture / Day 29 search code | **REPRODUCED** (git includes df0e5e1) |
| Disk I/O | **APPROXIMATED** |
| Network latency / Internet bandwidth | **NOT REPRODUCED** (localhost / bridge) |
| Hostinger virtualization | **NOT REPRODUCED** |
| Real VPS / DNS / CDN | **NOT REPRODUCED** |

---

## C. Baseline

| Endpoint (mixed sample) | p50 | p95 | p99 | Errors |
|-------------------------|-----|-----|-----|--------|
| `baseline` profile (5 VU, 45s) | 6.7 ms | 594.9 ms | 1071.5 ms | 0% |
| Search subset (`search_p95`) | — | 25.8 ms | — | 0% |

Health/readiness after campaign: **live OK**, **ready OK**, queue pending **0**, failed jobs **0**.

---

## D. Load Results (selected; full data in `aggregated-metrics.json`)

Stage duration: **3m** sustained (constant-VU / constant-arrival-rate). Soak: **10m** at 75 RPS target.

| Test | VUs | RPS (achieved) | p50 | p95 | p99 | 429 | 5xx | Err% | Result |
|------|-----|----------------|-----|-----|-----|-----|-----|------|--------|
| vu10 | 10 | 28.4 | 7.9 | 310.9 | 749.7 | 0 | 0 | 0 | VERIFIED |
| vu25 | 25 | 65.8 | 10.4 | 330.8 | 617.1 | 0 | 0 | 0 | VERIFIED |
| vu50 | 50 | 94.1 | 28.1 | 862.4 | 989.1 | 0 | 0 | 0 | ACCEPTABLE |
| vu100 | 100 | 101.0 | 232.9 | **2017.6** | 2141.4 | 0 | 0 | 0 | FAILED (p95 SLO) |
| vu250 | 250 | 97.6 | 877.3 | 5670.9 | 7238.0 | 0 | 0 | 0 | FAILED |
| vu500 | 500 | 147.8 | 1992.3 | 10967.6 | 12290.9 | 0 | 0 | 0 | FAILED |
| vu1000 | 1000 | 142.7 | 3766.4 | 7524.5 | 10046.5 | 0 | 0 | 0 | FAILED |
| rps50 | 66 | 56.0 | 16.3 | 443.2 | 748.9 | 0 | 0 | 0 | VERIFIED |
| rps100 | 200 | 95.8 | 474.8 | **2385.8** | 2657.1 | 0 | 0 | 0 | FAILED |
| rps150 | 280 | 117.4 | 1704.2 | 3764.7 | 4225.6 | 0 | 0 | 0 | FAILED |
| rps200 | 360 | 119.9 | 1224.1 | 7974.9 | 8845.9 | 0 | 0 | 0 | FAILED |
| rps250 | 450 | 139.7 | 1656.9 | 9726.3 | 10687.8 | 0 | 0 | 0 | FAILED |
| rps300–500 | 500–700 | 147–185 | 1980–2825 | 6341–11502 | — | 0 | 0 | 0 | FAILED |
| burst100 | 100 | 135.6 | 328.5 | 593.9 | 623.3 | 0 | 0 | 0 | ACCEPTABLE |
| burst250 | 250 | 162.5 | 851.6 | 1182.9 | 1243.4 | 0 | 0 | 0 | DEGRADED |
| burst500 | 500 | 147.1 | 2117.0 | 2980.5 | 3107.0 | 0 | 0 | 0 | FAILED |
| burst1000 | 1000 | 138.1 | 2747.7 | 6569.0 | 6729.3 | 0 | 0 | 0 | FAILED |
| search-focus (Day 29) | 40 | 145.1 | 8.0 | **38.5** | 143.1 | 0 | 0 | 0 | VERIFIED |
| soak75 (10m) | 205 | 83.4 | 67.9 | **1370.7** | 1911.5 | 0 | 0 | 0 | DEGRADED |

**CPU/RAM at peak (rps500, `stats-after-rps500.csv`):** app ~19% CPU, 161 MiB; MySQL ~2.3% CPU, 503 MiB; Redis ~0.8% CPU, 126 MiB; Nginx ~0% CPU.

---

## E. Saturation

| Point | Evidence |
|-------|----------|
| **First degradation (mixed storefront, p95 > 500 ms sustained intent)** | Between **vu50** (p95 862 ms) and **vu100** (p95 2018 ms); **rps50** still green (p95 443 ms). |
| **Major degradation (p95 > 2 s)** | **vu100**, **rps100** (achieved ~96 RPS, p95 2386 ms). |
| **Failure boundary (still 0% HTTP errors, latency collapse)** | **rps150+**, **vu250+**, bursts **500+** (multi-second p95, low effective RPS vs target). |
| **Search-only (Day 29 path)** | Remains **VERIFIED** to ~145 RPS at 40 VU (search p95 ~40 ms). |

---

## F. Bottleneck

```text
NOT PROVEN (single component)
```

**Observed correlation:** Under **mixed** workload, latency degrades while **MySQL and Nginx CPU stay low**; **Octane app** reaches ~19% Docker CPU at high RPS but is not pegged at 100%. **Redis** served cache/queues without evictions reported; **queue depth 0** after tests. Most consistent story: **application + 2 Octane workers** saturated on concurrent DB/cache work per mixed request (not raw CPU-bound), with **MySQL query latency** contributing under load — **not isolated** with A/B tuning (forbidden in this campaign).

---

## G. Recovery

After load (`stats-recovery-30s.csv`): app CPU ~3.6%, Redis memory dropped to ~4.4 MiB (idle), MySQL ~469 MiB, containers **healthy**, **no OOM/restart observed**, readiness **queue pending 0**.

---

## H. Correctness

| Check | Result |
|-------|--------|
| Authentication / session isolation | **NOT VERIFIED** — cookie login from host; `/auth/me` blocked by seeded **marketplace maintenance** gate; no cross-user leak observed |
| Data correctness (read-only mixed GETs) | **OBSERVED** — 0% 5xx/429 across campaign; no schema corruption checks beyond HTTP success |
| Cart (guest GET) | Exercised in mix; no isolation test |

**CRITICAL:** None triggered.

---

## I. Day 29 Search

Dedicated **`search-focus`** profile (40 VU, 3m): **145 RPS**, **search p95 ~40 ms**, **0% errors**.  
Mixed workload search p95 stays lower than overall p95 until high concurrency (e.g. vu100 search p95 ~683 ms vs overall 2018 ms).

**Windows REGRESSION REFERENCE** (2026-09-16, search-heavy `diyar-production` `:8093`, shorter stages): vu100 search p95 ~400 ms, rps100 search p95 ~207 ms — **not comparable 1:1** (mixed vs search-only, different compose project, host RAM envelope).

---

## J. Capacity

### Capacity table

| Capacity | Result |
|----------|--------|
| 10 users | **VERIFIED** |
| 25 users | **VERIFIED** |
| 50 users | **VERIFIED** (ACCEPTABLE p95 band) |
| 100 users | **FAILED** (p95 > 2 s mixed) |
| 250 users | **FAILED** |
| 500 users | **FAILED** |
| 1000 users | **FAILED** |
| 50 RPS | **VERIFIED** |
| 100 RPS | **FAILED** (target not met: ~96 RPS, p95 > 2 s) |
| 150 RPS | **FAILED** |
| 200 RPS | **FAILED** |
| 250 RPS | **FAILED** |
| 300 RPS | **FAILED** |
| 350 RPS | **FAILED** |
| 400 RPS | **FAILED** |
| 500 RPS | **FAILED** |

```text
KVM2-EQUIVALENT VERIFIED:
  Mixed storefront ~50–56 RPS sustained 3m (p95 < 500 ms)
  10–25 concurrent users mixed 3m (p95 < 500 ms)
  Search-focused ~145 RPS at 40 VU (search p95 ~40 ms)
  Burst 100 same-time requests (p95 ~594 ms, 0% errors)

KVM2-EQUIVALENT PROVISIONAL:
  ~50 concurrent mixed users (p95 ~862 ms — acceptable/monitor band)
  75 RPS × 10m endurance: 0% errors but p95 ~1.37 s (operate with latency monitoring)

SATURATION OBSERVED:
  Mixed workload p95 > 2 s from ~100 VU / ~96–100 RPS upward
  Throughput ceiling ~140–185 RPS achieved under high targets with multi-second p95 (no 5xx)

NOT VERIFIED:
  Auth/session under load; 30–60 min soak at 50 RPS with p95 < 500 ms; strict 2 CPU Docker Desktop cap; real Hostinger VPS
```

---

## K. Real VPS Limitations

Still requires **actual Hostinger** validation for: CPU steal/I/O, Internet RTT, TLS/CDN, production DNS, real rate-limit traffic mix, payment/notifications, and operator firewall.

---

## KVM2-EQUIVALENT LOCAL RESULT

```text
READY WITH LIMITATIONS
```

Safe for **early traffic** if operated around **≤ ~50 RPS mixed** or **≤ ~25 concurrent mixed users**, with **search-heavy** headroom higher when isolated. **Do not** plan **100 RPS mixed** or **100+ concurrent mixed** on **2 Octane workers** without infrastructure or architecture changes (out of scope for this test).

---

## Final question

> **Based on the constrained 2-vCPU / 8-GB Linux production-like environment, what traffic level does the current DIYAR build demonstrate that it can handle?**

```text
VERIFIED:
  ~50–56 RPS mixed (3m), p95 < 500 ms, 0% errors
  10–25 concurrent mixed users (3m), p95 < 500 ms, 0% errors
  Search API ~145 RPS (40 VU search-focus), search p95 ~40 ms, 0% errors

PROVISIONAL:
  ~50 concurrent mixed (p95 ~862 ms)
  75 RPS for 10 minutes with 0% errors but p95 ~1.37 s (endurance drift)

SATURATION OBSERVED:
  ~100 concurrent / ~96–100 RPS mixed: p95 > 2 s, still 0% 5xx/429

NOT VERIFIED:
  Real VPS; auth isolation; strict host 2 CPU enforcement; 60-minute green soak
```

**This is not `REAL VPS CERTIFIED`.**

---

## Artifacts

| File | Purpose |
|------|---------|
| `docker-compose.kvm2-test.yml` | Resource limits overlay |
| `docker-compose.kvm2-test.k6.yml` | k6 on compose network |
| `deploy/docker/kvm2-test.env.example` | Test secrets template |
| `scripts/performance/kvm2-equivalent-campaign.js` | Mixed workload + profiles |
| `scripts/performance/run-kvm2-equivalent-validation.ps1` | Orchestrator |
| `campaign.json` | 23 profile rollup |
| `aggregated-metrics.json` | Pass/fail classification |
| `environment-audit.json` | Stack versions |
| `infra-snapshot.json` | Queues + peak/recovery stats |
| `auth-isolation.json` | Auth check outcome |
