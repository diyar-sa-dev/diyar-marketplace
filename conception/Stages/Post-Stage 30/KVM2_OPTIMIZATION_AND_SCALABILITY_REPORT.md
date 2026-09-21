# DIYAR — KVM2 Optimization and Scalability (Operational Phases 3–13)

**Date:** 2026-09-21  
**Baseline authority:** `KVM2_CAPACITY_AND_BOTTLENECK_PHASE_1_2_REPORT.md`  
**Evidence:** `backend/storage/certification/kvm2-equivalent/phase3-12/`, `phase7-workers4/`  
**Naming:** Operational Phases 3–13 under Post–Stage 30 (no Stage 31).  
**No git commit. Local Docker simulation only. Hostinger was not tested.**

Certification labels: **VERIFIED**, **VERIFIED WITH LIMITATIONS**, **NOT VERIFIED**, **BLOCKED**.

---

## Executive summary

```text
KVM2 environment:            VERIFIED WITH LIMITATIONS
Application optimization:    VERIFIED WITH LIMITATIONS
Latency:                     VERIFIED WITH LIMITATIONS
Capacity:                    VERIFIED WITH LIMITATIONS
Scalability:                 VERIFIED WITH LIMITATIONS
Hostinger:                   NOT VERIFIED
Production:                  NOT VERIFIED

baseline mixed sustainable:  ~25 RPS, p95 ~440 ms
optimized mixed sustainable: ~50 RPS, p95 ~343 ms   (rps50 met the arrival target)
first degradation:           rps75 mixed — p95 2.8 s (was vu25 / p95 1.1 s)
saturation:                  ~69–90 mixed RPS with p95 > 2 s
primary remaining limiter:   Octane CPU on 2 vCPU + product-detail / search under high arrival
listing bottleneck:          broken for anonymous GET /products (cache + slimmer card query)
analytics INSERT on HTTP:    removed from the request path (queue)

Next action:                 OPTIMIZE FURTHER
                             (product detail + high-RPS search), then retest.
                             Do not scale the VPS yet.
```

Anonymous `GET /products` was slow because **search already cached `listPublic` and listing did not**. After a 60s versioned guest cache and a slimmer card SELECT, 25 VU products-only went from **22.7 RPS / p95 1738 ms** to **81.1 RPS / p95 104 ms**. MySQL CPU on that profile fell from **~111% of one vCPU to ~12%**.

`product_viewed` writes were moved to `RecordAnalyticsEventJob` on queue `default`. First k6 campaign recorded **10 224 failed jobs** because Octane was rebuilt and **queue workers still ran the old FPM image** (class missing on unserialize). After rebuilding `queue-critical`/`queue-default`, **failed_jobs = 0** and analytics rows continued to grow. HTTP latency numbers from the first optimized campaign remain valid; queue durability was **not** valid until that rebuild.

Four Octane workers on the same two stack CPUs did **not** beat two workers at vu25 mixed (p95 **215 ms** vs **147 ms**). Keep **2 workers** on this envelope.

---

## Before / after capacity (local KVM2-equivalent only)

| Metric | Phase 1–2 baseline | After optimization | Change |
| --- | ---: | ---: | --- |
| Sustainable mixed RPS (p95 &lt; 500 ms) | ~25 (rps25: 24.78, p95 440 ms) | ~50 (rps50: 49.24, p95 343 ms) | higher useful RPS |
| First degradation | vu25 mixed p95 1074 ms | rps75 mixed p95 2823 ms | later |
| Saturation RPS | ~47–49 mixed, p95 &gt; 2 s | ~69–90 mixed, p95 &gt; 2 s | higher, still not useful |
| Mixed p95 at sustainable | 440 ms @ 25 RPS | 343 ms @ 50 RPS | better p95 at 2× RPS |
| Product-list p95 (25 VU) | 1738 ms | 104 ms | −94% |
| Product-list RPS (25 VU) | 22.7 | 81.1 | ×3.6 |
| Product-detail p95 (25 VU) | 861 ms | 939 ms | no improvement |
| Search p95 (25 VU isolated) | 34 ms | 284 ms | worse (see Face B) |
| MySQL CPU (products isolation, peak) | 111% | 12% | listing no longer DB-bound |
| App CPU (products isolation, peak) | 78% | 95% | now app/Redis |
| Threads_running peak | 4 | 5 | still not connection-bound |
| Redis evictions | 0 | 0 | healthy |
| Queue depth after campaign | 0 | 0 | healthy after FPM rebuild |
| Failed jobs during first optimized campaign | n/a | 10 224 analytics jobs | **fixed** by rebuilding queue images |
| Failed jobs after queue rebuild | n/a | 0 | recovered |
| 5xx | 0% | 0% | same |
| 429 | 0 | 0 | same |

Do **not** read this as “Hostinger supports 50 RPS.”

---

## A. Environment

Unchanged envelope vs Phase 1–2:

| Item | Value |
|------|--------|
| Docker VM | NCPU 4, ~7.76 GiB |
| Stack cpuset | 0–1 |
| k6 cpuset | 2–3 |
| Octane (default) | 2 workers (restored after the 4-worker trial) |
| MySQL | 8.0, buffer pool 512 MiB, max_connections 100 |
| Redis | maxmemory 512 mb, allkeys-lru |
| HTTP | `127.0.0.1:8193` |

Harness fixes (not application behavior):

- k6 `REPORT_DIR` so summaries do not overwrite `phase1-2/`
- `RebuildApp` now builds **app + queue-critical + queue-default** (Octane and FPM are different images)
- Phase 1–2 `summary-*.json` were overwritten by the first optimized run; restored from the Phase 1–2 markdown report into `phase1-2/RESTORED_FROM_REPORT.json`

---

## B. What changed in the application

### Phase 3 — `GET /products`

1. **Guest listing cache** (`CachedPublicProductListService`): same `CATALOG_VERSION` + `StampedeSafeCache` pattern as catalog search. TTL 60s (`diyar.catalog.cache.product_list_seconds`). Authenticated requests are **not** cached (`user_saved`, `is_own_store`).
2. **Card query payload:** SELECT only card columns; eager-load `primaryImage.mediaFile` (`ofMany min sort_order`), plus column subsets for vendor/category/inventory. `paginate(..., ['*'])` had been forcing `SELECT *`.
3. **Loyalty `once()`** so settings are not resolved per card.
4. Offset pagination **kept** (`total` / `last_page` are part of the public API). No index added (listing stopped being MySQL-bound once cached).

### Phase 4 — analytics

`ProductViewAnalyticsService` dispatches `RecordAnalyticsEventJob` with primitives only (Octane-safe). Redis `Cache::add` dedupe stays on the request. Payload still includes event type, product id, user/session, vendor, locale, source=`product_detail`, request-time timestamp.

### PHPUnit

`tests/Feature/Api/V1/Catalog/` + analytics + cache audits: **156 passed**. New tests cover guest cache hit (no product SQL), no `user_saved` leak, version-bump invalidation, and job dispatch without a blocking INSERT.

---

## C. Workload

Same script `kvm2-phase2-diagnostics.js`, 90s stages, rate limits ON, mixed storefront + isolated search/products/detail.

Rebuild of the Octane image was required (code is copied into the image, not bind-mounted).

---

## D. Capacity curve (optimized, 2 workers)

| Load | Actual RPS | p50 ms | p95 ms | p99 ms | Errors |
| ---: | ---------: | -----: | -----: | -----: | -----: |
| health 10 VU | 34.04 | 9.4 | 26.3 | 71.1 | 0 |
| 5 VU mixed | 17.35 | 6.5 | 22.5 | 63.8 | 0 |
| 10 VU mixed | 34.37 | 6.9 | 38.2 | 93.2 | 0 |
| 25 VU mixed | 80.81 | 8.6 | **146.8** | 292.2 | 0 |
| 50 VU mixed | 143.02 | 18.9 | 345.7 | 659.0 | 0 |
| 25 RPS | 24.85 | 10.6 | 251.5 | 769.9 | 0 |
| **50 RPS** | **49.24** | 8.9 | **342.7** | 1507.5 | 0 |
| 75 RPS | 68.72 | 12.6 | **2822.7** | 4435.7 | 0 |
| 100 RPS | 89.73 | 54.7 | 2718.7 | 4620.7 | 0 |
| search 25 VU | 74.06 | 21.0 | 284.3 | 565.9 | 0 |
| products 25 VU | 81.09 | 8.8 | **103.7** | 499.9 | 0 |
| detail 25 VU | 45.82 | 159.6 | 938.9 | 1467.0 | 0 |
| 125 RPS | 115.86 | 593.4 | 2283.4 | 3379.4 | 0 |
| 150 RPS | 126.00 | 524.2 | 3474.7 | 4453.4 | 0 |
| 200 RPS | 167.47 | 991.8 | 3263.4 | 3977.0 | 0 |

Arrival tests **meet** 25 and 50 RPS. They **miss** 75+ (queueing).

---

## E. Resource curve (during load, peak docker CPU% of one VM CPU)

| Load | App | MySQL | Redis | Queue-critical | Nginx |
| ---: | --: | ----: | ----: | -------------: | ----: |
| vu10 | 35 | 32 | 9 | 18 | 3 |
| vu25 | 81 | 49 | 11 | 48 | 4 |
| vu50 | 89 | 68 | 20 | 71 | 5 |
| rps50 | 60 | 35 | 10 | 16 | 4 |
| rps75 | 98 | 60 | 53 | 32 | 6 |
| products | 95 | **12** | 53 | 5 | 6 |
| search | 103 | 9 | 23 | 74 | 7 |
| detail | 95 | 67 | 78 | 27 | 3 |
| rps200 | **152** | 20 | 31 | 10 | 47 |

Redis `evicted_keys` stayed **0**. `Threads_connected` peak **4**. App RSS stayed ~150–170 MiB / 1536 MiB.

---

## F. Bottleneck analysis

### Listing was the application bottleneck — **accepted, then removed for guests**

| | |
|--|--|
| Hypothesis | Anonymous `GET /products` repeats `listPublic` while search caches it. |
| Evidence | Isolation p95 1738 ms vs search 34 ms; code path uncached; after cache, products p95 104 ms and MySQL CPU 12%. |
| Counter-evidence | Authenticated listing still uncached (by design). Stock can be up to 60s stale, same as search. |
| Confirmation | Same k6 products-only profile on the same envelope. |
| Confidence | HIGH |

### Synchronous analytics INSERT — **accepted as HTTP-path cost; queue must share the FPM image**

| | |
|--|--|
| Hypothesis | Moving INSERT off `show` reduces detail latency. |
| Evidence | Job dispatch + PHPUnit; after FPM rebuild, failed_jobs 0 and `analytics_events` grew 5012 → 6119 during a 90s mixed vu25. |
| Counter-evidence | Detail isolation p95 **861 → 939 ms** (no win). `findPublic` + `relatedProducts` still hit MySQL (detail MySQL CPU 67%). First campaign lost 10 224 jobs because queue workers lacked the class. |
| Conclusion | HTTP no longer blocks on InnoDB commit. Detail is still query-bound. Queue image must ship with the job. |
| Confidence | HIGH on architecture; LOW that it improved detail p95 |

### Extra Octane workers help on 2 vCPU — **rejected at vu25**

| | |
|--|--|
| Evidence | 2 workers vu25 mixed: 80.8 RPS, p95 147 ms. 4 workers: 78.0 RPS, p95 215 ms. |
| Conclusion | Keep 2 workers. rps75/rps3-worker sweep **NOT VERIFIED** (script only completed vu25 at 4 workers). |
| Confidence | MEDIUM-HIGH at vu25; incomplete for higher arrival |

### High-RPS mixed limiter is now search/detail/Octane, not listing

At rps75, products_p95 stayed **22 ms** while search_p95 was **2808 ms** and detail_p95 **3762 ms**. App CPU ~98%. Listing cache held; the mixed p95 is the uncached/expensive remainder.

Isolated search p95 284 ms is **worse** than Phase 1–2 (34 ms). That profile ran immediately after rps100 with queue-critical still at **74% CPU** — contaminated. Mixed vu10 search_p95 was **19 ms**, so search is still fast when the box is quiet. Treat isolated-search 284 ms as **NOT a clean regression measurement**.

---

## G. Stress / GREEN–YELLOW–RED (local simulation)

Thresholds used here (UX, not a product SLO): mixed p95 500 ms = leave GREEN; p95 2000 ms = RED.

```text
GREEN:   up to ~50 mixed RPS (rps50 p95 343 ms; vu25 p95 147 ms)
YELLOW:  vu50 mixed (143 RPS, p95 346 ms, p99 659 ms) — stable HTTP, resources rising
RED:     rps75+ mixed (p95 2.8 s+), Octane approaching 1.0–1.5 of two vCPUs
```

Assumed marketplace mix (no production analytics): ~40% search, ~30% listing, ~20% detail, remainder health/filters. **Assumption, not measured traffic.**

---

## H. Queue / Redis (Phase 5)

| After first optimized campaign (FPM workers stale) | After FPM rebuild |
| --- | --- |
| `LLEN queues:default` 0 | 0 |
| failed_jobs **10 224** `RecordAnalyticsEventJob` incomplete class | **0** |
| analytics `product_viewed` rows 5012 | 6119 after extra vu25 |

Exception (stale workers): `The script tried to access a property on an incomplete object ... RecordAnalyticsEventJob`.

---

## I. Frontend / SEO / security

**Frontend:** `queryClient` default `staleTime` 60s, `refetchOnWindowFocus: false`. `useProducts` vs `useCategoryProducts` are different routes (all-products browse vs category), not a double fetch on one screen. No frontend code change this pass.

**SEO:** product/category/search already set title, description, canonical, og tags via `usePageSeo`. No Product JSON-LD added (would not have fixed the listing bottleneck).

**Security:** guest cache contains only public card JSON (`user_saved` false, `is_own_store` false). Authenticated listing bypasses cache. PHPUnit proves no leak. Shared cache does not include admin/order/private inventory beyond the public stock fields already on the card (60s TTL, same as search).

---

## J. Face B review

| Attack | Answer |
|--------|--------|
| Did we only inflate RPS with worse p95? | No. Sustainable mixed p95 improved **and** RPS doubled. rps75 is still a latency collapse — not claimed as capacity. |
| Did we move the bottleneck? | Yes — listing is cheap; detail + high-RPS search + Octane CPU remain. |
| Did MySQL CPU drop? | Yes on products isolation (111% → 12%). Detail still uses MySQL. |
| Stale catalog? | 60s + version bump; stock-only adjustments do not bump (checkout would thrash). Same contract as search. |
| Queue hide failures? | First run **did**. Documented and fixed. Later failed_jobs = 0. |
| 4 workers incomplete? | Only vu25 ran (PowerShell `-Profiles` array passing). Enough to reject 4 workers at that load. |
| Search isolated p95 worse? | Contaminated by post-rps100 queue CPU. Quiet mixed search p95 ~19–26 ms. |
| Hostinger? | **NOT VERIFIED.** |

---

## K. Optimization recommendations (not implemented beyond Phases 3–4)

### P0 — must fix before claiming KVM2 fitness

1. **Product detail path** (`findPublic` + `relatedProducts` + serialization). Still ~0.9 s p95 at 25 VU.
2. **Ship FPM queue image with app deploys** so analytics jobs cannot unserialize-fail. Harness now builds both.
3. **High-RPS search** once the machine is already busy (facets/cache stampede) — measure on a quiet isolated search rerun.

### P1 — should fix before scaling

4. Keep **2 Octane workers** on a 2 vCPU envelope.
5. Inventory-aware cache invalidation **without** bumping on every reservation.
6. `mysql-kvm2.cnf` still ignored on NTFS; argv override remains.

### P2

7. JSON-LD Product schema (SEO, not capacity).
8. Card `MediaUploadService::url()` disk `exists()` on cache miss.

### P3 — future scaling

9. Hostinger trial with the same k6 + sampler. **Forbidden to cite this file as Hostinger RPS.**
10. Horizontal app nodes only after detail is cheaper and 2 vCPU Octane is still pegged.

---

## L. QA handoff

```powershell
# Optimized stack (rebuild Octane AND FPM queue images)
.\scripts\performance\run-kvm2-phase2.ps1 -RebuildApp `
  -ReportsDir backend/storage/certification/kvm2-equivalent/phase3-12

# Expect: products 25 VU p95 << 500 ms; rps50 actual ~50, p95 < 500 ms;
#         failed_jobs = 0 after the run; cpuset 0-1; OCTANE_WORKERS=2
```

---

## M. Software engineering handoff

| What was slow | Why | Evidence | What next |
| --- | --- | --- | --- |
| `GET /products` | Uncached `listPublic` + `SELECT *` + all images | Isolation 1738 ms; after cache 104 ms, MySQL 12% | Authenticated listing still uncached |
| `product_viewed` INSERT | Sync InnoDB commit on `show` | Slow log 1.0–1.7 s; now a `default` queue job | Detail still expensive without the INSERT |
| `GET /products/{id}` | `findPublic` + related cards | Isolation p95 ~939 ms, MySQL 67% | Profile SQL of show + related |
| Mixed rps75+ | Octane CPU + search/detail | App ~98–152%, products_p95 22 ms | Do not scale first |

---

## N. Final certification

```text
KVM2 environment:            VERIFIED WITH LIMITATIONS
Application optimization:    VERIFIED WITH LIMITATIONS
Latency:                     VERIFIED WITH LIMITATIONS
Capacity:                    VERIFIED WITH LIMITATIONS
Scalability:                 VERIFIED WITH LIMITATIONS  (2 workers preferred; no Hostinger)
Hostinger:                   NOT VERIFIED
Production:                  NOT VERIFIED
```

**Evidence-backed next action: `OPTIMIZE FURTHER`**

Then retest the same envelope. Scale vertically only if Octane remains CPU-bound after detail/search work. Do not scale horizontally yet.
