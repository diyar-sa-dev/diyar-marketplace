# Phase 18.1 — Face 1 engineering log

**Date:** 2026-09-22

## SPX capture

| Test | Result |
|------|--------|
| Octane HTTP + SPX cookies/query | **FAIL** — no `/tmp/spx-data` |
| HTTP kernel CLI + SPX start/stop after warm | **PASS** |
| Artifacts | `profiling/spx/fp-*.txt`, `search-kernel-report.json` |

## Saturation

Reused Phase 18 **3×** mixed rps125/150/200 (0× 5xx). Ladder rps175+ **not re-run** (PowerShell `Rates` array invocation error).

## Function-level findings

1. **Search + `q=sofa`:** ~**401ms** profiled wall; **~367ms** exclusive in MySQL connection closures tied to **`SearchQueryEvent::create`** (analytics).
2. **Search without `q`:** ~**20ms** — Redis/validation; catalog path warm and cheap.
3. **Products list:** ~**18ms** — Redis-bound.
4. Mixed k6 uses non-empty `q` on search requests → analytics path exercised.

## Optimization

**NONE** — evidence supports a **future** hypothesis (async/batched search analytics), not implemented in 18.1.
