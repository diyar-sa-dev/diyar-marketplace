# Master Final Gap Register — Phase 28.17

**Date:** 2026-08-29  
**Auditor:** Principal engineering closure pass  
**Rule:** Code + executable tests + runtime measurements = truth.

---

## Executive Summary

| Severity | Open | Closed this phase |
|----------|-----:|------------------:|
| P0 | 0 | 1 |
| P1 | 2 | 1 |
| P2 | 5 | 2 |
| P3/P4 | 8 | — |

**Verdict driver:** Measured Octane+MySQL8+Redis capacity on local Docker caps at **~50 RPS actual** with **p95 > 800 ms** at target 50 RPS. **278 RPS / 1M req·hour remains NOT VERIFIED.** Live Reverb WebSocket E2E remains **NOT TESTABLE** in current compose.

---

## P0 — Critical (0 open)

| ID | Location | Problem | Status |
|----|----------|---------|--------|
| G28.17-P0-001 | `docker-compose.loadtest.yml` healthcheck | Shell expanded `$c` → PHP parse error; container reported **unhealthy** while serving traffic | **CLOSED** — CMD array form health probe; container **healthy** after rebuild |

---

## P1 — High (2 open)

| ID | Location | Problem | Root cause | Evidence | Fix | Status |
|----|----------|---------|------------|----------|-----|--------|
| G28.17-P1-001 | Capacity | **278 RPS / 1M req·hour** claimed in optimization docs | Never measured; dev Docker saturates ~50 RPS | k6 rps75/rps100: actual ~50 RPS, p95 4–5 s | Requires production/staging hardware tier + multi-node k6; update all docs to **NOT VERIFIED** | **OPEN** |
| G28.17-P1-002 | Performance | p95 latency exceeds 300 ms budget above ~25 RPS sustained | Octane 4 workers + Windows Docker CPU + mixed workload | rps50: p95 **825 ms** (0% errors); rps25: p95 **118 ms** | Tune workers on target VPS; CDN cache for static; optional read replicas at scale | **OPEN** |

### Closed P1

| ID | Problem | Resolution |
|----|---------|------------|
| G28.17-P1-003 | Docker API falsely unhealthy | Fixed healthcheck (see P0-001) |

---

## P2 — Medium (5 open)

| ID | Class | Problem | Status |
|----|-------|---------|--------|
| G28.17-P2-001 | WEBSOCKET | No Reverb service in compose; live WS delivery **NOT TESTABLE** | **OPEN** — channel auth tested via HTTP integration |
| G28.17-P2-002 | TEST-COVERAGE | Playwright full E2E not re-run in 28.17 evidence pass | **OPEN** |
| G28.17-P2-003 | TEST-COVERAGE | 15-min soak started 2026-08-29; pending completion | **IN PROGRESS** |
| G28.17-P2-004 | DATABASE | 50k/100k product EXPLAIN at scale not run on this pass | **OPEN** — 10k optimizations exist from 28.16 |
| G28.17-P2-005 | FRONTEND | Homepage LCP/INP Lighthouse not captured | **OPEN** |

### Closed P2

| ID | Resolution |
|----|------------|
| G28.16-G7 | Redis integration in CI |
| G28.16-G3 | Queue worker integration test |

---

## Measured Capacity (2026-08-29, Docker loadtest stack)

**Stack:** Octane/Swoole 4 workers, MySQL 8, Redis 7, base `DatabaseSeeder` (not 10k).

| Profile | Target RPS | Actual RPS | p50 ms | p95 ms | Error rate | Classification |
|---------|----------:|----------:|-------:|-------:|-----------:|----------------|
| rps10 | 10 | 10.0 | 42 | **91** | 0% | **MEASURED — PASS** |
| rps25 | 25 | 25.0 | — | **118** | 0% | **MEASURED — PASS** |
| rps50 | 50 | 49.7 | — | **825** | 0% | **MEASURED — DEGRADED** (threshold fail) |
| rps75 | 75 | 50.1 | — | **4329** | 0% | **MEASURED — SATURATED** |
| rps100 | 100 | 51.2 | — | **5281** | 0% | **MEASURED — SATURATED** |

**Safe sustained RPS (p95 < 300 ms, errors < 1%):** **~25 RPS**  
**Warning RPS (functional, elevated latency):** **25–50 RPS**  
**Saturation RPS (actual throughput plateaus):** **~50 RPS** on this host  
**278 RPS:** **NOT VERIFIED**

---

## Test Gate Results (2026-08-29)

| Gate | Result | Evidence |
|------|--------|----------|
| PHPUnit | **784/784 PASS** | `_raw/2026-08-29/phpunit-pass.json` |
| Vitest | **128/128 PASS** | typecheck + vitest run |
| Typecheck | **PASS** | `npm run typecheck` |
| Lint | **PASS** | `npm run lint` |
| Build | **PASS** | `npm run build` 21.8s |
| Redis integration | PASS (when Redis up) | optional CI job |
| Queue integration | 12 pass, 1 skip | QueueWorkerIntegrationTest |
| Broadcast auth | PASS | BroadcastChannelAuthorizationTest |
| Docker Octane healthy | **PASS** (post-fix) | `docker inspect` → healthy |
| k6 mixed load | PASS @10/25; FAIL thresholds @50+ | `_raw/` k6 summaries |
| Playwright E2E | **NOT RUN** this pass | — |
| Reverb live WS | **NOT TESTABLE** | no Reverb in compose |
| Soak 15 min | **IN PROGRESS** | `_raw/2026-08-29-soak15.txt` |

---

## Overengineering Audit (summary)

| Finding | Action |
|---------|--------|
| Duplicate homepage API fan-out | **Already simplified** — `/storefront/home` aggregate (28.16) |
| `Cache::flush()` | **Not found** in application code paths |
| Excessive middleware | Security/cache middleware justified; no removal |
| k6 `profiles.js` vs `mixed-workload.js` | Compose uses **mixed-workload.js** (correct) |

---

## Deferred / Environmental (not repository blockers)

| Item | Label |
|------|-------|
| Multi-node Reverb + LB | ENVIRONMENTAL |
| VPS production hardware validation | ENVIRONMENTAL |
| Cloudflare WAF volumetric DDoS | ENVIRONMENTAL |
| 100k registered user load model at full scale | ENVIRONMENTAL |

---

## Certification Impact

Phase 28.17 **cannot** declare `COMPLETE — PRODUCTION READY` with `CONDITIONS: NONE` and score **≥ 9.5/10** until:

1. Capacity target validated on **production-like hardware** OR docs/score revised to measured ~25 RPS safe / ~50 saturation on dev Docker
2. Playwright E2E re-run with evidence
3. Live Reverb test harness added OR explicitly scoped out of 28.17 with Phase 29 plan
4. 15-min soak completes without drift

See [FINAL_ENTERPRISE_CERTIFICATION.md](./FINAL_ENTERPRISE_CERTIFICATION.md).
