# Performance Test Matrix

**Evidence standard:** MEASURED | PROJECTED | NOT VERIFIED

---

## Latency Budget (target vs measured)

| Endpoint class | Target p95 | Measured (Phase 28.16) | Environment |
|----------------|----------:|----------------------:|-------------|
| Public catalog read | < 250ms | **86–102ms** @ 10–25 RPS | Docker Octane 4w |
| Mixed workload | < 500ms | **442ms** @ 50 RPS | Docker Octane 4w |
| Homepage aggregate | < 250ms | NOT RE-MEASURED | — |
| Checkout / payment | < 1000ms | NOT MEASURED (k6) | — |
| Admin analytics | < 1000ms | NOT MEASURED | — |

---

## k6 Load Profiles

| Profile | Target RPS | Script | Status |
|---------|----------:|--------|--------|
| Smoke | 5 | `mixed-workload.js --env PROFILE=smoke` | MEASURED |
| Normal A | 10 | mixed rps10 | **MEASURED** p95 102ms |
| Normal B | 25 | mixed rps25 | **MEASURED** p95 86ms |
| Busy | 50 | mixed rps50 | **MEASURED** p95 442ms |
| Heavy | 100 | mixed rps100 | **MEASURED** saturated ~41 RPS |
| Stress | 150–200 | — | NOT VERIFIED |
| Spike | burst | — | NOT VERIFIED |
| Soak 15m | 10–25 | `soak15` | NOT RUN |
| Soak 60m | 10–25 | — | NOT RUN |

---

## Capacity Summary (Docker Octane, 4 workers, base seed)

| Scenario | RPS | p95 | Errors | Result |
|----------|----:|----:|-------:|--------|
| Normal | 10 | 102ms | 0% | PASS |
| Normal+ | 25 | 86ms | 0% | PASS |
| Busy | 50 | 442ms | 0% | PASS |
| Heavy | 100 target | 10200ms | high | **SATURATED** |
| 1M req/day (~12 RPS) | 12 | — | — | **VERIFIED** |
| 1M req/hour (~278 RPS) | 278 | — | — | **NOT VERIFIED** |

**Safe sustained RPS (mixed):** ~50 (MEASURED)

---

## Octane / Swoole Tests

| Test | Status |
|------|--------|
| Cold start | NOT MEASURED |
| Warm runtime | MEASURED (k6) |
| Worker lifecycle | NOT MEASURED |
| Memory soak 30m | NOT RUN |
| Request state leakage | FlushOctaneDevState added |
| bcadd / bcmath | FIXED + verified |

---

## Database Scale Tests

| Dataset | Status |
|---------|--------|
| Base seed (~100 products) | MEASURED |
| 10k products | IN PROGRESS |
| 100k products | NOT VERIFIED |
| 100k users | NOT VERIFIED |
| 100k orders | NOT VERIFIED |

---

## Homepage Fan-Out

| Metric | Before | After (28.16) |
|--------|-------:|--------------:|
| API calls on load | ~19 | 1 aggregate + deferred |
| LCP / INP | NOT MEASURED | NOT MEASURED |
| Payload size | NOT MEASURED | NOT MEASURED |

---

## Resource Monitoring (during load)

| Metric | Captured |
|--------|:--------:|
| CPU / RAM | partial (docker stats manual) |
| MySQL connections | NOT AUTOMATED |
| Redis hit ratio | NOT AUTOMATED |
| Queue depth | NOT AUTOMATED |
| Reverb connections | NOT TESTED |

---

## Failure Injection

| Scenario | Status |
|----------|--------|
| Redis unavailable | NOT TESTED |
| MySQL slow | NOT TESTED |
| Queue worker stopped | NOT TESTED |
| External payment timeout | partial (unit) |
| Reverb restart | NOT TESTED |

---

## CI Performance Gate

| Check | In CI |
|-------|:-----:|
| k6 analytics smoke | Yes |
| k6 mixed rps10 | No (add nightly) |
| PHPUnit perf regressions | No |
