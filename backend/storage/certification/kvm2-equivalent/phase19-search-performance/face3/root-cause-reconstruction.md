# Face 3 — Root-cause reconstruction (updated)

## Observed facts

1. Warm in-process search: **~0.6 ms**, **0 SQL** (`search/decomposition.json`).
2. Serial nginx warm curl: **p95 ~89 ms** (`octane/concurrent-curl-probe.json`).
3. Parallel curl (16-wide): **p95 ~392 ms** — same URL, same cache warmth.
4. k6 search-only @ rps150 after long campaign: **p95 ~502 ms** (`baseline/baseline/summary-rps150-runiso-search.json`).
5. `Queue::size('default')` **40k+** and **+3125 / 30s** while worker active (`queue/depth-drain-sample.json`).
6. Phase 19 sequential ladder: rps125 runs 2–3 healthy; **later mixed runs degrade** (rps200 **p95 1.1–2.7 s**).
7. k6 **Insufficient VUs @ 320** on rps175 (`final/benchmark-validity.md`).

## Inferences (Face 3 independent)

| Inference | Discriminating evidence |
|-----------|---------------------------|
| Catalog SQL is not warm-path limiter for q | Decomposition + low MySQL Questions delta |
| Concurrency increases latency without changing SQL count | Parallel curl probe |
| Macro latency is mostly **waiting**, not **compute** | 0.6 ms → 89 ms → 392 ms ladder |
| Async analytics is **not free** | Queue backlog growth |
| Phase 19 rps175–200 vs 18.3 is **partially invalid** | Cumulative backlog + VU cap |

## Alternative explanations considered

| Alternative | Test | Result |
|-------------|------|--------|
| MySQL saturation | Decomposition / Questions | **Rejected** for warm q |
| Redis CPU maxed | No Phase 19 sampler | **Unproven** |
| k6-only artifact | Host parallel curl | **Rejected** — host curl shows same pattern |
| Broken search code | PHPUnit 13/13 | **Rejected** |

## Final conclusion (Face 3)

**Root cause class:** **worker queueing / Octane throughput** on a **2-worker / 2-CPU** envelope, with **queue backlog** as a **amplifier** during sustained search-heavy campaigns.

**Confidence:** **MEDIUM–HIGH** (waiting proven; CPU correlation **NOT MEASURED** in Phase 19).

**Optimization:** **None** until isolated experiments with **queue drain + warm-up + CPU sampler** baseline.
