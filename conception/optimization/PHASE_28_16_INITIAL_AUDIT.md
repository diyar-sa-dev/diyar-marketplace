# Phase 28.16 — Initial Audit

**Date:** 2026-08-29  
**Branch:** `dev` @ `badbb6e` (+ uncommitted Stage 28 / optimization work)  
**Prior certification:** 8.7/10 PRODUCTION READY WITH CONDITIONS

---

## Current Architecture

```text
React SPA → Nginx/CDN → Laravel API (PHP-FPM or Octane/Swoole)
                              ↓
                    Redis 7 (cache, queue, rate limits, sessions)
                              ↓
                         MySQL 8
                              ↓
              Queue workers + Reverb (WebSockets) + external APIs
```

**Measured stack (prior pass):** Docker Octane + MySQL 8.0.46 + Redis 7 on Windows dev host.

---

## Current Bottlenecks (MEASURED)

| ID | Bottleneck | Evidence | Status |
|----|------------|----------|--------|
| B01 | Octane image missing `bcmath` | 80% k6 errors | **FIXED** |
| B04 | Dev Docker CPU saturation >10 RPS | rps25 p95 5096 ms | **OPEN** — worker tuning + homepage aggregate |
| B05 | PHP-FPM 6.3 RPS vs Octane 10 RPS | k6 rps10 | **MEASURED** |
| B06 | Homepage 19 HTTP API calls | Frontend audit | **FIXING** — `/storefront/home` aggregate |
| B07 | Below-fold immediate mount | HomeBelowFold fires 11 requests pre-scroll | **FIXING** — IntersectionObserver defer |

---

## Known Risks

| Risk | Classification |
|------|----------------|
| 278 RPS / 1M req/hour | **NOT TESTED** |
| Reverb 500+ connections | **NOT TESTED** |
| Multi-node horizontal | **NOT TESTED** |
| Queue 10k+ job drain | **NOT TESTED** |
| Playwright E2E fresh | **NOT RUN** |
| FakePaymentGateway static state | **P2** — flush listener added |
| LogSmsProvider OTP static arrays | **P2** — flush listener added |

---

## Deferred Work (from Phase 28 + optimization)

- 15-minute soak test at safe RPS
- Worker count experiment (2/4/6/8)
- 50k/100k product EXPLAIN scales
- Cursor pagination for high-volume lists
- VPS-target k6 certification
- Observability metrics export (request latency histogram)

---

## False / Weak Assumptions

| Claim | Reality |
|-------|---------|
| "278 RPS feasible" | **PROJECTED** — dev Docker saturated ~24 RPS |
| "100k users supported" | **PROJECTED** — needs traffic model + VPS measure |
| "72/72 Playwright" | **STALE** — not re-run on Docker stack |
| "Redis production-ready" | **VERIFIED** (6/6 integration, 94% hit ratio under load) |
| "MySQL 8 production-ready" | **MEASURED** at 10k products only |

---

## Overengineering

- Duplicate product queries on homepage (5× `/products`) — **being consolidated**
- 6 parallel `/services` category calls — **moved to aggregate**
- 8 Octane workers on 4-core Docker Desktop — **reduced default to 4**

## Underengineering

- No homepage BFF endpoint (prior) — **added Phase 28.16**
- No Octane static-state flush — **added FlushOctaneDevState**
- MyFatoorah `ini_set` without restore — **fixed**
- Queue live throughput not measured — **still open**

---

## Testing Gaps

| Area | Status |
|------|--------|
| k6 mixed realistic traffic | **IN PROGRESS** |
| k6 soak 15 min | Pending |
| Octane worker matrix | Pending |
| Reverb load | **NOT TESTED** |
| Chaos (Redis/MySQL restart) | **NOT TESTED** |
| Multi-node LB | **NOT TESTED** |
| Security abuse (login flood) | Partial (rate limit tests in PHPUnit) |

---

## Observability Gaps

- No exported p50/p95/p99 metrics endpoint (health only)
- No queue depth metric in readiness
- FPM/Octane worker utilization not exposed

---

## Phase 28.16 Actions (this pass)

1. ✅ Octane dev-state flush listener
2. ✅ MyFatoorah ini_set restore
3. ✅ `GET /storefront/home` aggregate + cache hydration
4. ✅ Deferred below-fold homepage sections
5. ✅ Mixed k6 workload script
6. ✅ Octane worker count configurable (default 4)
7. ⏳ Re-benchmark after stack restart
8. ⏳ Fresh Playwright + full regression
9. ⏳ Final certification documents
