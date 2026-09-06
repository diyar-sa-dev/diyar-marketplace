# K6 Capacity Results — DIYAR Marketplace

**Date:** 2026-08-29  
**Tool:** Grafana k6 (Docker `grafana/k6:latest`)  
**Workload:** `scripts/performance/rps-profiles.js` — mixed catalog read (health 10%, products 50%, search 30%, categories 10%)

---

## Environment

| Item | Value |
|------|-------|
| Host | Windows 10 dev workstation (Docker Desktop) |
| Octane stack | `docker-compose.loadtest.yml` — Octane 8 workers, MySQL 8.0.46, Redis 7 |
| FPM stack | `docker-compose.production-like.yml` — Nginx :8080 → PHP-FPM |
| Dataset (Octane) | 10,000 products (PerformanceDatasetSeeder scale=100) |
| Dataset (FPM) | Base DatabaseSeeder (~12 products) |

---

## Octane + Swoole Results (MEASURED)

| Profile | Target RPS | Actual RPS | p50 | p95 | Error rate | SLO (p95<300 public) | Status |
|---------|------------|------------|-----|-----|------------|----------------------|--------|
| smoke (100 VU ramp) | — | 14.3 | — | 7090 ms | 0% | FAIL | MEASURED |
| rps10 | 10 | **10.0** | 164 ms | **290 ms** | 0% | **PASS** | **VERIFIED** |
| rps25 | 25 | 17.3 | 2990 ms | 5096 ms | 0% | FAIL | SATURATED |
| rps50 | 50 | 24.0 | 4869 ms | 8510 ms | 0% | FAIL | SATURATED |
| rps100 | 100 | — | — | — | — | — | NOT RUN (prior run invalid — bcmath) |
| rps150+ | — | — | — | — | — | — | NOT RUN |
| rps278 (1M/hr) | 278 | — | — | — | — | — | **NOT VERIFIED** |
| soak100 (15m) | 100 | — | — | — | — | — | **NOT RUN** |

Raw JSON: `_raw/k6-octane-rps10-2026-08-29.json`, `rps25`, `rps50`

---

## PHP-FPM Results (MEASURED)

| Profile | Target RPS | Actual RPS | p50 | p95 | Error rate | Status |
|---------|------------|------------|-----|-----|------------|--------|
| rps10 | 10 | **6.3** | 3249 ms | 8228 ms | 0% | LATENCY FAIL |

Raw JSON: `_raw/k6-fpm-rps10-2026-08-29.json`

---

## Octane vs FPM Comparison (rps10 target)

| Metric | PHP-FPM | Octane/Swoole | Improvement |
|--------|--------:|--------------:|------------:|
| Actual RPS | 6.3 | 10.0 | +58% throughput |
| p50 | 3249 ms | 164 ms | ~20× |
| p95 | 8228 ms | 290 ms | ~28× |
| Errors | 0% | 0% | — |

**Recommendation:** Use **Octane/Swoole** for throughput on resource-constrained VPS when ops team can manage persistent workers.

---

## Profiles NOT Verified

| Claim | Status | Reason |
|-------|--------|--------|
| 100 RPS sustained | NOT VERIFIED | Host saturated at ~24 RPS |
| 278 RPS (1M req/hour) | NOT VERIFIED | Hardware limit |
| 500 RPS spike | NOT VERIFIED | Not attempted |
| 25K VUs | NOT VERIFIED | Out of scope for dev workstation |
| 100 RPS × 15 min soak | NOT RUN | Blocked by saturation |

---

## Methodology Notes

- `constant-arrival-rate` executor — when server cannot keep pace, VUs increase and latency queues; error rate stayed 0% indicating correctness under overload, not capacity headroom.
- Prior k6 runs showing **80% errors** were caused by missing `bcmath` in Octane image (fixed) — those results are **INVALID** and superseded.
