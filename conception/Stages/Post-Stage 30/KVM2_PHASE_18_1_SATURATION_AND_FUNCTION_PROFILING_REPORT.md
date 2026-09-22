# KVM2 Phase 18.1 — Saturation & Function Profiling Report

**Date:** 2026-09-22 · **LOCAL KVM2-EQUIVALENT** · **Hostinger NOT VERIFIED** · **Git: NO COMMIT**

---

## Executive Summary

Phase 18.1 validated **SPX capture via warm Laravel HTTP kernel** (not Octane HTTP), extended saturation interpretation from Phase 18, and obtained **function-level evidence** that **refutes `CatalogSearchService::facets()` as the primary warm-path CPU consumer** while **implicating synchronous search analytics DB writes** for typical k6 search traffic (non-empty `q`).

**Primary resource at mixed high RPS:** **PHP/Octane application CPU** on cpuset 0–1 (Phase 15 sampler corroboration).

**Primary function hotspot (q-bearing catalog search, warm kernel SPX):** **`SearchAnalyticsRecorder::record` → `SearchQueryEvent::create`** (~**367ms / 401ms** profiled wall time).

**Warm catalog search without `q`:** ~**20ms** (Redis + validation).

**Optimization:** **NONE**

**Status:** **COMPLETE WITH LIMITATIONS**

---

## Phase Objective

Drive toward controlled saturation, obtain defensible function-level PHP evidence, isolate search vs alternatives — **no speculative application changes**.

---

## SPX Method & Capture Validation

| Path | Result |
|------|--------|
| Nginx → Octane + SPX HTTP trigger | **NOT CAPTURED** (`/tmp/spx-data` empty) |
| CLI bootstrap + HTTP kernel + `spx_profiler_start/stop` after 10 warm iterations | **CAPTURED** |

Evidence: `phase18-1-saturation-profiling/profiling/triggers/spx-validation.json`

Scripts: `scripts/performance/kvm2-spx.ps1`, `kvm2-spx-validate.ps1`, `kvm2-spx-kernel-profile-warm.php` (under `backend/storage/certification/`).

SPX **disabled** after runs (`kvm2-spx.ps1 -Action disable`).

---

## Saturation Ladder (mixed workload)

| RPS target | p95 (Phase 18, 3×) | Notes |
|----------:|---------------------:|-------|
| 125 | 53 / 87 / 269 ms | 0× 5xx |
| 150 | 86 / 191 / 195 ms | search_p95 often highest sub-metric |
| 200 | 574 / 732 / 867 ms | search_p95 ~566–891 ms |

**First pressure:** rps125–150 (variable p95 + rising app CPU in Phase 15).  
**Degradation:** rps200 mixed latency.  
**Hard collapse:** **not observed** (0× 5xx through rps200).

`statistics/saturation-summary.json`

---

## Function-Level Hotspots (SPX warm flat profiles)

| Profile | Wall time | Dominant exclusive cost |
|---------|----------:|-------------------------|
| Search + `q=sofa` | **401ms** | MySQL / `SearchQueryEvent` insert (~367ms) |
| Search, no `q` | **20ms** | Redis commands (~1.6ms top line) |
| `/products?per_page=12` | **18ms** | Redis |
| `/health/live` | **21ms** | Pipeline/middleware |

`profiling/spx/hotspot-summary.json`, `fp-search-warm.txt`, `fp-search-noquery-warm.txt`

**Search decomposition:** Middleware + validation + Redis catalog cache dominate **no-query** path. **With query**, **`app()->terminating()` analytics** dominates measured window (see `CatalogSearchController`).

---

## Root Cause (evidence-weighted)

| Layer | Conclusion | Confidence |
|-------|------------|------------|
| Infrastructure | App CPU limiter at high mixed RPS | **High** (container stats) |
| Endpoint class | Search heaviest in mixed k6 sub-metrics | **Medium–High** |
| `CatalogSearchService::facets()` | **Not primary** on warm cache | **Medium** (SPX) |
| Search analytics sync INSERT | **Primary** for q-bearing search in SPX | **Medium–High** (kernel); **Medium** (Octane parity) |

---

## Optimization

**NONE**

**Future hypothesis (not implemented):** queue/async search analytics (similar to product_viewed async pattern) — requires separate optimization phase with tests + 3× regression.

---

## Security / Tests

No application logic changed. Prior Phase 18 isolation tests remain valid. SPX ini not left enabled.

---

## Face 2

`face2/PHASE_18_1_FACE2.md` — P2: kernel-vs-Octane SPX, incomplete RPS ladder extension; **no P0/P1**.

---

## Next Decision

1. **18.2 (optional):** SPX or segment timing **inside Octane worker** (request-triggered) to confirm analytics cost under Swoole.
2. **Optimization phase:** If confirmed, one change — async search analytics — with full regression matrix.
3. **Phase 19** catalog cardinality only after search-path CPU is closed or explicitly accepted.

---

## Evidence Index

```text
backend/storage/certification/kvm2-equivalent/phase18-1-saturation-profiling/
scripts/performance/run-kvm2-phase181.ps1
scripts/performance/kvm2-spx.ps1
backend/docker/spx.ini (local profiling only)
```
