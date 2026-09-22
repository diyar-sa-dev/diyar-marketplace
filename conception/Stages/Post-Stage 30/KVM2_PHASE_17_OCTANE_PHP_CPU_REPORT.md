# DIYAR — KVM2 Phase 17: Octane / PHP CPU Optimization

**Date:** 2026-09-22  
**Frozen baseline:** Phase 15 — `KVM2_AUTHENTICATED_DETAIL_AND_OCTANE_CAPACITY_REPORT.md`  
**Evidence:** `backend/storage/certification/kvm2-equivalent/phase17-octane-php-cpu/`  
**Hostinger:** NOT VERIFIED  
**Git:** NO COMMIT  

---

## 1. Executive summary

Phase 17 validated the Phase 15 hypothesis (**Octane/PHP CPU** dominates at high mixed RPS) via code inspection and a **small, safe optimization pass**. A global `once()` catalog-version cache was **rejected** after tests proved invalidation risk. **Accepted:** (1) single catalog version read per guest `search()` call, (2) cached reflection metadata in `EnsureCleanAuthState`.

HTTP re-measurement (**optimization-01**) shows **mixed results**: **rps100 p95 improved** (71 → 41 ms vs Phase 15), but **rps125/rps150 regressed** in the same session (variance / scheduler — **not certified as sustained regression**). **No material change** to the Phase 15 capacity boundary recommendation: **~100 RPS mixed sustainable**, degradation **125–200 RPS**, **2 Octane workers**.

**Phase 17 status:** **COMPLETE WITH LIMITATIONS**

---

## 2. Scope

Software-only CPU efficiency on the **same** KVM2-equivalent envelope (2 app CPUs, 2 Octane workers). No vCPU, no 4-worker default, no Redis/MySQL scaling.

---

## 3. Phase 15 frozen baseline (unchanged)

See mission table — authoritative numbers remain in Phase 15 report. Phase 17 does **not** modify Phase 15 files.

Phase 17 **baseline reference copies:** `phase17-octane-php-cpu/baseline/workers-2/` (from Phase 15 campaign).

---

## 4–5. Environment verification

| Item | Value |
|------|--------|
| Docker Linux engine | Verified 2026-09-22 |
| App cpuset | 0–1 |
| k6 cpuset | 2–3 |
| OCTANE_WORKERS | 2 |
| Catalog size | ~12 public products |
| failed_jobs post-run | 0 |

---

## 6. CPU profiling methodology

See `phase17-octane-php-cpu/profiling/methodology.md`.

**Findings:**

- Guest product detail: cached array → JSON; CPU on warm path = middleware + Redis GET + analytics dedupe + auth overlay SQL.
- Mixed workload search (`type=all`): **three** separate `VersionedCache::version()` Redis GETs per request (facets + products + services).
- `EnsureCleanAuthState`: **ReflectionObject walk every Octane request** to clear session property.
- Phase 15 sampler at rps150: **app ~74–86% CPU**, Redis ~8–13% CPU, MySQL low — **PHP/Octane first**, not Redis/MySQL.

---

## 7–9. Optimization hypotheses & changes

### Optimization 01a — REJECTED

**Hypothesis:** `VersionedCache::versionOnce()` using Laravel `once()` reduces Redis GETs.  
**Outcome:** **REJECTED** — `ProductDetailCacheTest` failed (stale version within test request). Even with Octane `FlushOnce`, global `once()` on version is a footgun for invalidation semantics.

### Optimization 01b — ACCEPTED

**Hypothesis:** Pass one `$catalogVersion` through `CatalogSearchService::search()` → facets/products/services.  
**Change:** `CatalogSearchService.php` — single version read per search; optional `$catalogVersion` on `facets()` / private cache helpers.  
**Effect:** Up to **−2 Redis GETs** per guest search with `type=all` (~20% of mix-realistic).

### Optimization 01c — ACCEPTED

**Hypothesis:** Reflection setup in auth middleware dominates micro-cost at high RPS.  
**Change:** `EnsureCleanAuthState.php` — static cached `ReflectionProperty` (metadata only, Octane-safe).  
**Security:** Unchanged auth reset semantics.

---

## 10–11. Test results

| Suite | Result |
|-------|--------|
| ProductDetailCacheTest + query perf | Pass |
| Catalog API | **153/153** |
| npm run build | Pass (Phase 17 window) |

---

## 12–16. Benchmark results (optimization-01)

**Label:** PHASE 17 optimization-01 (2026-09-22T09:05–09:13Z)  
**Evidence:** `phase17-octane-php-cpu/optimization-01/workers-2/summary-*.json`

| Profile | Phase 15 p95 | Phase 17 opt-01 p95 | Phase 15 RPS | Phase 17 RPS |
|---------|-------------:|--------------------:|-------------:|-------------:|
| detail-guest | 10 ms | 13 ms | 89 | 88 |
| detail-auth | 59 ms | 80 ms | 83 | 81 |
| mix-realistic | 39 ms | 46 ms | 86 | 84 |
| rps100 | 71 ms | **41 ms** | 99 | 100 |
| rps125 | 68 ms | 156 ms | 124 | 124 |
| rps150 | 132 ms | 431 ms | 149 | 149 |

**Interpretation:** **INCONCLUSIVE** for claiming overall CPU victory. rps100 improvement is plausible (search-heavy mix benefits). rps150 **single-run regression** may be Docker scheduler noise (Phase 15 rps100 also had p99 outlier). **Repeat rps125/rps150** before any capacity claim change.

---

## 17. Queue

`failed_jobs = 0` after optimization-01 run.

---

## 18. Security regression

No change to cache keys, overlay, or auth. PHPUnit isolation tests pass. **Browser login/logout:** NOT VERIFIED.

---

## 19. Octane safety review

- **Rejected** global request `once()` on catalog version.
- **Accepted** static reflection metadata (no user state).
- **Accepted** search-local version threading (request-scoped variable).

---

## 20. Face 2 adversarial review

| ID | Severity | Finding |
|----|----------|---------|
| F2-01 | P1 | rps150 opt-01 run **431 ms p95** vs Phase 15 **132 ms** — do not certify improvement without repeat. |
| F2-02 | P2 | Phase 17 baseline = Phase 15 copy, not same-day pre-code re-run (code delta small). |
| F2-03 | P2 | ~12 products — CPU findings may not transfer to large catalogs (Phase 19). |
| F2-04 | P3 | detail-auth +21 ms p95 in opt-01 — within noise at 25 VU. |

**P0:** none.

---

## 21. Remaining limitations

Local Docker only. Small catalog. High run-to-run variance at rps125+. No Xdebug/SPX flame graphs in this phase (inspection + sampler only).

---

## 22. Phase 17 certification

| Area | Status |
|------|--------|
| CPU bottleneck validated | **VERIFIED WITH LIMITATIONS** |
| Optimization 01 (search + middleware) | **VERIFIED WITH LIMITATIONS** |
| Material throughput gain | **PARTIALLY VERIFIED** (rps100 only) |
| rps150 boundary improved | **NOT VERIFIED** |
| Octane workers default | **VERIFIED** — remain **2** |
| Hostinger | **NOT VERIFIED** |

---

## 23. Recommended next phase

1. **Repeat** Phase 17 baseline + opt-01 matrix (paired runs, 3× rps150) to reduce variance.  
2. If Octane CPU still dominates: **deeper Phase 17.2** — SPX profiling on `rps150`, analytics dedupe cost, middleware micro-benchmarks.  
3. **Phase 19** when question shifts to catalog cardinality.

---

## Phase 17.2 — Variance resolution (2026-09-22)

**Status:** **COMPLETE WITH LIMITATIONS** (optimized 3× replicates; paired rps150 attempted with caveats below).

### Method

Same envelope (`OCTANE_WORKERS=2`, cpuset 0–1). **No new optimizations.** Three consecutive k6 runs per profile with **optimization-01 code frozen**.

Evidence: `phase17-octane-php-cpu/variance-resolution/optimization/summary-*-run*.json`

### Optimized replicates — p95 (ms)

| Profile | Run 1 | Run 2 | Run 3 | Min | Median | Max | Mean |
|---------|------:|------:|------:|----:|-------:|----:|-----:|
| rps100 | 12.6 | 10.3 | 12.7 | 10.3 | 12.6 | 12.7 | **11.9** |
| rps125 | 106.6 | 57.5 | 70.6 | 57.5 | 70.6 | 106.6 | **78.2** |
| rps150 | 154.0 | **28.3** | 127.1 | 28.3 | 127.1 | 154.0 | **103.1** |

### Comparison to frozen references

| Profile | Phase 15 (single) | Opt-01 single (2026-09-22T09) | 17.2 replicate mean |
|---------|------------------:|------------------------------:|--------------------:|
| rps100 | 71 ms | 41 ms | **~12 ms** |
| rps125 | 68 ms | 156 ms | **~78 ms** |
| rps150 | 132 ms | **431 ms** | **~103 ms** |

### Paired rps150 — pre-opt01 (git `HEAD`) vs optimized (2026-09-22)

Alternating rebuilds: control **218 / 300 / 31 ms** p95 vs optimized **66 / 53 / 158 ms**. **Not authoritative for opt01 attribution:** control copies came from **`git HEAD`**, while certification runs use **uncommitted Phase 15+ tree**; all three control runs had **~5.8k–6.3k HTTP 5xx** (~43–47% failed) vs **0** on optimized. Evidence: `variance-resolution/paired/summary-rps150-run*.json`.

### Regression verdict

**VARIANCE** — The **431 ms** rps150 from optimization-01’s single run **does not repeat** under identical optimized code (replicates **28–154 ms**). The same code shows **>5× spread** on rps150, consistent with **Docker/scheduler/tail latency variance**, not a stable regression from 01b/01c. The original **156 ms / 431 ms** pair from the first opt-01 campaign fits that pattern.

### Optimization disposition (17.2)

| Change | Verdict |
|--------|---------|
| 01b — search catalog version threading | **ACCEPTED** |
| 01c — cached reflection metadata in `EnsureCleanAuthState` | **ACCEPTED** |
| 01a — global `once()` on version | **REJECTED** (unchanged) |

**Do not claim** rps150 capacity improved vs Phase 15 until paired pre-opt01 runs complete. **Do not claim** optimization caused the 431 ms spike.

### Face 2 (17.2)

| ID | Severity | Note |
|----|----------|------|
| F2-17.2-01 | P2 | Paired pre-opt01 used git HEAD + 5xx-heavy control runs — not single-variable opt01 proof. |
| F2-17.2-02 | P2 | p99 tails still spiky (e.g. rps125 run3 p99 841 ms) — report p95 only with repeat. |

### Phase 17 overall status (updated)

**COMPLETE WITH LIMITATIONS** — CPU boundary understood; micro-optimizations accepted; high-load p95 remains **variable** on Docker. Next measured work: **SPX profiling at rps150** or **Phase 19** catalog scale — not speculative PHP changes.

---

## 24. Evidence index

```text
phase17-octane-php-cpu/baseline/workers-2/summary-*.json
phase17-octane-php-cpu/optimization-01/workers-2/summary-*.json
phase17-octane-php-cpu/profiling/methodology.md
phase17-octane-php-cpu/variance-resolution/statistics/variance-summary.json
phase17-octane-php-cpu/variance-resolution/optimization/summary-*-run*.json
phase15-authenticated-octane/workers-2/sampler-rps150.jsonl  (CPU reference)
scripts/performance/run-kvm2-phase17.ps1
scripts/performance/run-kvm2-phase17-variance.ps1
```

---

**This is local KVM2-equivalent simulation only. Hostinger remains NOT VERIFIED.**
