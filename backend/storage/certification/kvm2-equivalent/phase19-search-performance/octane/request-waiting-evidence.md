# Request waiting vs PHP execution — Phase 19

## Discriminating test: concurrent curl (nginx → Octane)

Source: `octane/concurrent-curl-probe.json` (after 40 warm requests)

| Mode | p50 ms | p95 ms | max ms |
|------|-------:|-------:|-------:|
| Serial (n=30) | 31.9 | 89.4 | 90.9 |
| Parallel 8 (n=64) | 75.2 | 194.4 | 433.7 |
| Parallel 16 (n=128) | 126.8 | 391.8 | 451.9 |

**Inference:** With the **same warm cache**, increasing **concurrency** multiplies tail latency. Serial p95 **~89 ms** already exceeds in-process warm **~0.6 ms** — the gap is **not** explained by SQL or catalog computation alone.

**Classification:** **Request waiting / worker contention** on the Octane path is **demonstrated** (confidence **HIGH** for this probe).

**Unmeasured portion:** Exact split between nginx upstream queue, Octane accept queue, and PHP execution without in-request instrumentation remains **UNMEasured**.

## CLI vs HTTP

| Path | Warm q=sofa |
|------|-------------|
| In-process `CatalogSearchService` | ~0.6 ms, 0 SQL |
| Serial nginx curl p95 | ~89 ms |
| k6 search-only @ rps150 (Phase 18.3) | ~143 ms p95 |

The **0.6 ms → 89 ms** step is **HTTP stack + Octane + middleware + dispatch**, not catalog SQL.

The **89 ms → 143 ms+** step under constant-arrival load is **concurrency + system load**, consistent with worker saturation model.
