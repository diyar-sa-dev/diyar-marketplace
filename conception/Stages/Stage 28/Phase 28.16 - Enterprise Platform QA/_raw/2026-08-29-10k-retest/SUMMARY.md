# 10k Dataset Capacity Retest

**Date:** 2026-08-29  
**Seed:** `PerformanceDatasetSeeder scale=100` — +9988 products, +1992 users, +10000 orders (~7.5 min)

## k6 (Docker profiles.js — 10 max VUs)

| Profile | Actual RPS | p50 | p95 | Errors |
|---------|----------:|----:|----:|-------:|
| rps10 | 15.55 | 320ms | **1186ms** | 0% |
| rps25 | 14.58 | 347ms | **1036ms** | 0% |
| rps50 | 15.20 | 349ms | **974ms** | 0% |

## Comparison vs base seed (mixed-workload.js, 4 Octane workers)

| Profile | Base p95 | 10k p95 | Delta |
|---------|----------:|--------:|------:|
| ~10 RPS | 102ms | 1186ms | **~12× slower** |
| ~25 RPS | 86ms | 1036ms | **~12× slower** |
| ~50 RPS | 442ms | 974ms | **~2× slower** |

**Note:** Docker k6 service runs `profiles.js` (10 VU cap), not `mixed-workload.js`. Re-run with host k6 or compose override for apples-to-apples mixed profile.

## Conclusion (MEASURED)

At **~10k products**, catalog latency degrades significantly under load. Safe sustained RPS on dev Docker is likely **~15 RPS** (not ~50 RPS at base seed). MySQL query/index tuning at scale is a scaling trigger.
