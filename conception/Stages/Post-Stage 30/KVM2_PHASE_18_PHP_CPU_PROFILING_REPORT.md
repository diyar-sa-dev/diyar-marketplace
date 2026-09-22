# KVM2 Phase 18 — PHP/Octane CPU Profiling Report

**Date:** 2026-09-22  
**Scope:** LOCAL KVM2-EQUIVALENT only · **Hostinger NOT VERIFIED** · **Git: NO COMMIT**

---

## Executive Summary

Phase 18 measured the **current Phase 17 optimized tree** (01b + 01c; no new optimizations). **Envelope validated** (2 Octane workers, app cpuset 0–1). **Critical mixed RPS** (rps125/150/200) was repeated **3×** with **0× 5xx** on all nine runs.

**Primary bottleneck class:** **PHP application CPU on Octane** (corroborated by Phase 15 container sampling: app **~67–94%** CPU during mixed rps150; Redis/MySQL not saturated).

**Top execution-path signal (workload decomposition, not SPX flames):** **`/catalog/search`** — in mixed rps150/rps200, k6 **`search_p95_ms`** repeatedly exceeds **`products_p95_ms`** and **`detail_p95_ms`** (e.g. rps200 search p95 **567–891 ms** vs detail **31–598 ms**). Isolated **search-only rps150** run captured separately under `phase18-php-cpu-profiling/search/`.

**SPX:** Extension **built and loaded** ephemerally in the app container; **no profile files** were written under `/tmp/spx-data` during Octane load without per-request SPX triggers — **function-level hotspot ranking remains incomplete**.

**Optimization performed:** **NONE — PROFILING ONLY**

**Status:** **COMPLETE WITH LIMITATIONS**

---

## Phase Objective

Answer: *What specific PHP/Octane path consumes CPU at the rps150 boundary?* using measurement first, not speculative code changes.

---

## Source-of-Truth Documents

- `KVM2_AUTHENTICATED_DETAIL_AND_OCTANE_CAPACITY_REPORT.md` (Phase 15 frozen envelope + sampler)
- `KVM2_PHASE_17_OCTANE_PHP_CPU_REPORT.md` + Phase 17.2 variance (`431 ms` = **VARIANCE**)
- `phase17-octane-php-cpu/variance-resolution/statistics/variance-summary.json`

**Not used as performance proof:** Phase 17.2 git-HEAD control paired runs (5xx-contaminated).

---

## Environment

See `phase18-php-cpu-profiling/environment/runtime-snapshot.json` — PHP **8.3.33**, app cpuset **0–1**, `OCTANE_WORKERS=2`, Docker **4 vCPU**, health **200**, `failed_jobs=0`.

---

## Dataset

~**12** public products (unchanged). **Do not infer large-catalog scalability.**

---

## Baseline Methodology

Harness: `scripts/performance/run-kvm2-phase18.ps1` + existing `kvm2-phase2-diagnostics.js` / `kvm2-phase15-diagnostics.js`.  
**Executed in Phase 18:** critical mixed **rps125/150/200 × 3**; isolated **search rps150 × 1**; Redis MONITOR probe for single guest search.  
**Not executed:** full VU grid for guest/auth detail, listing, and mixed realistic re-baseline (Face 2 P2).

---

## Repeatability Results — Mixed workload

| Profile | p95 min | p95 median | p95 max | p95 mean | stdev | 5xx (all runs) |
|---------|--------:|-----------:|--------:|---------:|------:|----------------|
| **rps125** | 53 ms | 87 ms | 269 ms | 136 ms | 116 ms | 0 |
| **rps150** | 86 ms | 191 ms | 195 ms | 157 ms | 62 ms | 0 |
| **rps200** | 574 ms | 732 ms | 867 ms | 724 ms | 147 ms | 0 |

Evidence: `phase18-php-cpu-profiling/rps{125,150,200}/statistics-*.json`

**rps150 mixed — endpoint trend p95 (ms)**

| Run | search | products | detail |
|----:|-------:|---------:|-------:|
| 1 | 163 | 72 | 15 |
| 2 | 260 | 81 | 32 |
| 3 | 96 | 87 | 23 |

At the capacity boundary, **search** is the most volatile and often dominant sub-metric.

---

## CPU Samples

Phase 18 sampler JSONL **not captured** (process path issue). **Reference:** Phase 15 `sampler-rps150.jsonl` — **diyar-kvm2-test-app-1** CPU **67–94%** under mixed rps150; Redis **low single-digit %**; MySQL **threads_running** modest.

---

## PHP Profiling Results (SPX)

| Step | Result |
|------|--------|
| Build php-spx in app container | **OK** |
| Load extension + restart Octane | **OK** (`php -m` shows spx) |
| search rps100 60s load | k6 **OK** |
| `/tmp/spx-data` reports | **Empty** (no auto-capture under Swoole/Octane without SPX HTTP trigger on requests) |
| Post-session | SPX ini **removed**; app restarted clean |

See `profiling/spx-search-rps100-session.json`, `profiling/methodology.md`.

---

## Hotspot Ranking (evidence-weighted)

| Rank | Component | CPU / impact evidence | Frequency | Confidence |
|------|-----------|----------------------|-----------|------------|
| 1 | **Octane / PHP application CPU** | Docker stats Phase 15 @ rps150 | every request | **High** |
| 2 | **Catalog search path** (`CatalogSearchService`, facets, cached product/service slices, serialization) | k6 `search_p95_ms` dominates mixed high-RPS runs; isolated search rps150 load | ~40% of mixed workload | **Medium–High** |
| 3 | **Product listing (`/products`)** | Elevated `products_p95_ms` at rps200 | ~25% mixed | **Medium** |
| 4 | **Product detail + overlay + engagement** | Lower p95 vs search in most rps150 runs; overlay tests pass | ~35% mixed | **Medium** (path cost; not top at rps150) |
| 5 | **Middleware / Sanctum / EnsureCleanAuthState** | Runs every request; no isolated % without SPX | every request | **Low–Medium** (needs SPX or middleware micro-bench) |
| 6 | **Analytics / ProductEngagementService** | Primarily detail-facing; not implicated in search-only load | detail hits | **Low** at search-heavy boundary |
| 7 | **Redis** | Not CPU-saturated; **1×** `diyar:catalog:version` GET per probed guest search (01b verified) | per search | **High** (not primary limiter) |
| 8 | **MySQL** | Phase 15 sampler: not dominant | cache misses | **Medium–Low** |

---

## Redis Analysis

`profiling/redis-search-single-request-probe.json`: **1** catalog version GET; facet/product/service cache GETs; no evidence of Redis CPU saturation at rps150 (Phase 15 sampler).

---

## MySQL Analysis

No Phase 18 change; Phase 15 showed moderate `threads_running` vs app CPU — **secondary** at current dataset.

---

## Analytics Analysis

Not on hot path for **search-only** rps150. Detail engagement remains async/deduped per prior phases — **not selected for optimization** without SPX proof of material synchronous CPU.

---

## Middleware Analysis

01c caches **ReflectionProperty** metadata only (immutable). No measured % of rps150 CPU without SPX.

---

## Serialization Analysis

Detail cache hit returns pre-serialized Redis body; search responses still require PHP array/JSON work — consistent with search ranking; **not micro-benchmarked**.

---

## Octane Safety

- Rejected pattern: global `once()` catalog version (Phase 17).
- Tests: `ProductDetailCacheTest`, `AuthSessionIsolationTest`, `LocaleIsolationTest` — **11/11 PASS**.

---

## Security Regression

| Area | Status |
|------|--------|
| Guest/public cache isolation | **PASS** (ProductDetailCacheTest) |
| Auth/session Octane isolation | **PASS** |
| Locale isolation | **PASS** |
| IDOR / full matrix | **NOT RUN** (beyond targeted tests) |

---

## Tests

| Suite | Result |
|-------|--------|
| Catalog filter (Feature) | **178 passed**, 5 skipped (local PHPUnit) |
| Detail cache + Octane isolation | **11/11 PASS** |
| npm run build | **NOT RUN** (no frontend changes) |
| Playwright | **NOT RUN** |

---

## Optimization Performed

**NO OPTIMIZATION — PROFILING ONLY**

---

## Face 2 Review

`phase18-php-cpu-profiling/face2/PHASE_18_FACE2.md` — P2: SPX incomplete, baseline matrix partial, variance; **no P0/P1** blockers for profiling-only close.

---

## Limitations

- Local Docker only; ~12 products; high p95 variance run-to-run.
- No certified SPX flame graph under Octane load.
- Full baseline VU matrix not re-run.

---

## Certification

**COMPLETE WITH LIMITATIONS** — Bottleneck **class** and **search-heavy path** supported by repeat k6 + Phase 15 CPU samples; **function-level** PHP hotspots require **SPX (or equivalent) with Octane-safe trigger strategy** or controlled FPM profiling harness.

---

## Next Engineering Decision

1. **Phase 18.1:** SPX (or tideways/pie) with explicit per-worker profiling plan for Swoole/Octane (HTTP `SPX_KEY` injection in k6, or short-lived FPM sidecar) — target **`CatalogSearchService::search` → facets / cache miss build** at **mixed rps150 steady state**.
2. **Do not** implement speculative PHP optimizations until SPX confirms inclusive CPU % for a named function.
3. **Phase 19** catalog cardinality experiments only after CPU path is function-resolved or accepted as search-bound with medium confidence.

---

## Evidence Index

```text
backend/storage/certification/kvm2-equivalent/phase18-php-cpu-profiling/
scripts/performance/run-kvm2-phase18.ps1
scripts/performance/run-kvm2-phase18-spx.ps1
scripts/performance/kvm2-phase18-redis-search-probe.ps1
backend/docker/spx.ini (local profiling only; not enabled in default image)
```
