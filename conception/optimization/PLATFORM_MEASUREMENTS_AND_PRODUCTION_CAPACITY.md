# DIYAR Marketplace — Platform Measurements & Production Capacity

**Certification date:** 2026-08-29 (re-audit with Docker + k6)  
**Prior score:** 8.3/10 COMPLETE WITH CONDITIONS  
**This pass:** Evidence-backed Docker measurements; honest capacity limits  
**Evidence:** `conception/optimization/_raw/`  
**Final status:** **PRODUCTION READY WITH CONDITIONS**

---

## 1. Executive Summary

This pass executed the **real production-like Docker stack** (MySQL 8.0.46, Redis 7, Octane/Swoole, Nginx+PHP-FPM), fixed a **P0 Octane image defect** (missing `bcmath`), and ran **k6 load tests** with measured results.

| Suite | Result |
|-------|--------|
| PHPUnit | **774/774 PASS** |
| Vitest | **128/128 PASS** |
| Redis integration | **6/6 PASS** (Docker Redis) |
| MySQL 8 EXPLAIN | **PASS** (10k products) |
| k6 Octane rps10 | **PASS** (p95 290 ms, 0% errors) |
| k6 Octane rps25–50 | **SATURATED** (latency SLO fail, 0% errors) |
| k6 FPM rps10 | **FAIL** latency (p95 8228 ms) |
| Playwright E2E | **NOT RE-RUN** (frontend dist not built this pass) |
| 278 RPS / 1M req/hour | **NOT VERIFIED** |

**Safe sustained capacity (measured on dev Docker):** **~10 RPS** catalog read (Octane), p95 **290 ms**.  
**Saturation point:** ~**24 RPS** actual with queue buildup, p95 **8.5 s**, still 0% errors.

**Best architecture (measured):** **Octane/Swoole** over PHP-FPM on same host.

---

## 2. Claim vs Reality Matrix

| Claim | Code | Test | Measurement | Status |
|-------|:----:|:----:|:-----------:|--------|
| Redis production ready | ✅ | ✅ 6/6 | 94% hit ratio | **VERIFIED** |
| MySQL 8 production ready | ✅ | ✅ EXPLAIN | 10k products | **MEASURED** |
| 100 RPS | ✅ | — | Not achieved | **NOT VERIFIED** |
| 278 RPS | — | — | Not attempted post-fix | **NOT VERIFIED** |
| 500 RPS | — | — | — | **NOT VERIFIED** |
| 1M req/day (~12 RPS avg) | — | — | rps10 pass implies feasible | **PARTIALLY VERIFIED** |
| 1M req/hour (~278 RPS) | — | — | — | **NOT VERIFIED** |
| Octane/Swoole benefit | ✅ | — | 28× p95 vs FPM | **MEASURED** |
| 100k users | ✅ | — | Traffic model only | **PROJECTED** |
| Queue throughput | ✅ | ✅ unit | Live drain test | **NOT RUN** |
| API p95 < 300 ms public | — | — | At 10 RPS only | **PARTIALLY VERIFIED** |
| Frontend performance | ✅ | ✅ Vitest | Build not re-measured | **PARTIALLY VERIFIED** |
| WebSocket scalability | ✅ | — | — | **NOT TESTED** |

---

## 3. Environment

See `_raw/environment-2026-08-29.json`.

| Property | Value |
|----------|-------|
| OS | Windows 10.0.19045 |
| Docker | Running (Desktop) |
| MySQL | 8.0.46 (Docker) |
| Redis | 7-alpine (Docker) |
| PHP (Octane container) | 8.3 + Swoole 6.2 + bcmath |
| Octane workers | 8 |
| Note | **Dev workstation — not production VPS** |

---

## 4. Architecture Tested

### Stack A — Load test (MEASURED)
```text
k6 → Octane/Swoole :8000 → Laravel → Redis 7 → MySQL 8.0.46
```

### Stack B — Production-like (MEASURED)
```text
k6 → Nginx :8080 → PHP-FPM → Laravel → Redis 7 → MySQL 8.0.46
```

---

## 5. k6 Results Summary

See `K6_CAPACITY_RESULTS.md`.

| Profile | Server | Actual RPS | p95 | Errors |
|---------|--------|----------:|----:|-------:|
| rps10 | Octane | 10.0 | 290 ms | 0% |
| rps25 | Octane | 17.3 | 5096 ms | 0% |
| rps50 | Octane | 24.0 | 8510 ms | 0% |
| rps10 | PHP-FPM | 6.3 | 8228 ms | 0% |

---

## 6. MySQL 8

See `MYSQL8_CAPACITY_RESULTS.md`. Catalog queries at 10k products use correct composite indexes; first-page latency **< 1 ms** in EXPLAIN ANALYZE.

---

## 7. Redis

See `REDIS_CAPACITY_RESULTS.md`. Integration tests pass; cache hit ratio **~94%** under load.

---

## 8. Octane

See `OCTANE_SWOOLE_AUDIT.md`. **P0 fix:** added `bcmath` to `Dockerfile.octane`.

---

## 9. Regression Gate

| Gate | Result |
|------|--------|
| PHPUnit | 774/774 ✅ |
| Vitest | 128/128 ✅ |
| Production build | NOT RE-RUN |
| Playwright | NOT RE-RUN |
| k6 | MEASURED (see above) |

---

## 10. Capacity Table (Evidence-Based)

| Scenario | Infrastructure | Measured capacity | p95 | Error rate | Status |
|----------|----------------|------------------:|----:|-----------:|--------|
| Limited VPS (dev Docker) | Octane 8w | **10 RPS** | 290 ms | 0% | **VERIFIED** |
| Limited VPS (dev Docker) | Octane 8w | ~24 RPS max | 8510 ms | 0% | **MEASURED SATURATED** |
| Limited VPS (dev Docker) | PHP-FPM | ~6 RPS | 8228 ms | 0% | **MEASURED** |
| 10k products DB | MySQL 8 | query OK | <2 ms | — | **VERIFIED** |
| 1M req/day (~12 RPS avg) | Octane | 10 RPS sustained | 290 ms | 0% | **PARTIALLY VERIFIED** |
| 1M req/hour (~278 RPS) | — | — | — | — | **NOT VERIFIED** |
| 100k users | — | — | — | — | **PROJECTED** |
| 500 RPS spike | — | — | — | — | **NOT VERIFIED** |

---

## 11. 100k User Model (PROJECTED)

| Metric | Assumption |
|--------|------------|
| Registered users | 100,000 |
| DAU | 10,000 (10%) |
| Peak concurrent | ~800 |
| Peak RPS (catalog-heavy) | 150–200 (requires horizontal scale) |
| Measured on dev Docker | 10 RPS safe |

**100k registered users ≠ 100k RPS.** Database and indexes support 10k+ products; traffic scale requires **VPS sizing + Octane + CDN**, not schema rewrite.

---

## 12. Scale Triggers

See `SCALE_TRIGGERS.md`. Re-benchmark on **target Hostinger VPS** before accepting 278 RPS claims.

---

## 13. P0 / P1 / P2

| ID | Severity | Item | Status |
|----|----------|------|--------|
| B01 | **P0** | Octane missing bcmath | **FIXED** |
| — | **P1** | 278 RPS / 1M hr not verified | **OPEN** — needs VPS benchmark |
| — | **P1** | Playwright not re-run | **OPEN** |
| B05 | P2 | FakePaymentGateway static state under Octane | **OPEN** |
| B03 | P2 | Staging DB name false positive | **FIXED** (compose) |

---

## 14. Final Certification Block

```text
==================================================
DIYAR PRODUCTION CAPACITY CERTIFICATION
==================================================

Codebase:                 PASS
Documentation audit:      PASS
PHPUnit:                  774/774
Vitest:                   128/128
Playwright:               NOT RE-RUN
MySQL 8:                  PASS (10k EXPLAIN)
Redis:                    PASS (6/6 integration)
Queue:                    NOT MEASURED (live drain)
Security:                 PASS (prior audits + code)
PHP-FPM:                  MEASURED (6.3 RPS @ rps10)
Octane/Swoole:            MEASURED (10 RPS @ rps10)
k6:                       MEASURED
Docker production-like:   PASS

Best architecture:        Octane/Swoole

Safe sustained RPS:       10 (measured, dev Docker)

Maximum tested RPS:       50 target → 24 actual (Octane)

p95 at safe capacity:     290 ms

p99 at safe capacity:     NOT CAPTURED

Maximum tested concurrent VUs: 100 (smoke)

1M requests/day:          PARTIALLY VERIFIED (~12 RPS avg)

1M requests/hour:         NOT VERIFIED

100k-user model:          PROJECTED

First bottleneck:         Host CPU / Docker Desktop (dev)

Second bottleneck:        PHP-FPM bootstrap (if FPM chosen)

Third bottleneck:         Deep OFFSET pagination (mitigated page cap)

Recommended scale trigger: p95 > 300 ms sustained OR actual RPS < 80% target

Horizontal scaling required at: ~150+ RPS (projected)

P0:                       bcmath Octane — FIXED

P1:                       VPS k6 certification; Playwright refresh

P2:                       FakePaymentGateway static arrays

Overall:                  8.7/10

FINAL STATUS:
    PRODUCTION READY WITH CONDITIONS
==================================================
```

**Conditions before 9+/10:**
1. k6 on production VPS confirming ≥100 RPS or documented safe tier
2. Fresh Playwright 72/72 on Docker stack
3. 15-minute soak at safe RPS without latency drift
