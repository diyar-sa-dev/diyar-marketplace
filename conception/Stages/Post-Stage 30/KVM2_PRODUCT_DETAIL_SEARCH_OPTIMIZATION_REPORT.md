# DIYAR — KVM2 Product Detail + Search Optimization (Phase 14)

**Date:** 2026-09-21  
**Prior authority:** `KVM2_OPTIMIZATION_AND_SCALABILITY_REPORT.md` (Phases 3–13)  
**Evidence:** `backend/storage/certification/kvm2-equivalent/phase14-detail-search/`  
**Naming:** Operational Phase 14 under Post–Stage 30 (no Stage 31).  
**No git commit. Local Docker simulation only. Hostinger was not tested.**

Certification labels: **VERIFIED**, **VERIFIED WITH LIMITATIONS**, **NOT VERIFIED**, **BLOCKED**.

---

## Executive summary

```text
This is not Hostinger validation.

KVM2 environment:            VERIFIED WITH LIMITATIONS
Product detail:              VERIFIED WITH LIMITATIONS
Search (busy-box):           VERIFIED WITH LIMITATIONS
Mixed storefront:            VERIFIED WITH LIMITATIONS
Guest listing:               VERIFIED WITH LIMITATIONS
Queue / analytics:           VERIFIED
Security (PHPUnit):          VERIFIED WITH LIMITATIONS
Hostinger:                   NOT VERIFIED
Production:                  NOT VERIFIED

detail 25 VU p95:            939 ms → 30 ms
detail 25 VU RPS:            45.8 → 86.5
search 25 VU p95:            284 ms (contaminated prior) → 29.6 ms
listing 25 VU:               81.1 RPS / 104 ms → 86.4 RPS / 18.5 ms
mixed rps50:                 49.2 RPS / 343 ms p95 → 49.8 RPS / 12.7 ms p95
mixed rps100:                previously queued (p95 ~2.7 s) → 99.4 RPS / 23 ms p95
failed_jobs:                 0
5xx / unexpected 429:        0
Octane workers:              2 (unchanged)
```

Product detail was uncached while listing and search already used versioned Redis. One guest `GET /products/{id}` executed **26 SQL statements** when a related product existed — **15 of them `information_schema` table probes** from `ProductEngagementService`. Guest 60s stampede-safe cache (same pattern as listing), aggregate-first engagement reads, and narrower relation SELECTs removed that work from the warm path.

Search was **not rewritten**. Isolated search was already cached; the previous 284 ms p95 ran after rps100 with queue-critical at 74% CPU. After detail stopped dominating Octane, isolated search 25 VU is **29.6 ms p95**.

**This is not Hostinger validation.**

---

## Environment

Unchanged envelope vs Phases 1–13:

| Item | Value |
|------|--------|
| Docker VM | NCPU 4, ~7.76 GiB |
| Stack cpuset | 0–1 |
| k6 cpuset | 2–3 |
| Octane | **2 workers** |
| MySQL | 8.0, buffer pool 512 MiB, max_connections 100 |
| Redis | maxmemory 512 mb, allkeys-lru |
| HTTP | `127.0.0.1:8193` (`diyar-kvm2-test`) |
| Script | `scripts/performance/kvm2-phase2-diagnostics.js` via `run-kvm2-phase2.ps1 -SkipRecreate` |
| Reports | `backend/storage/certification/kvm2-equivalent/phase14-detail-search/` |

App + FPM queue images were rebuilt together so `RecordAnalyticsEventJob` cannot miss-unserialize. Nginx was recreated after the app container so upstream IPs stayed valid. `OCTANE_WORKERS=2` confirmed after recreate.

Queue healthchecks report **unhealthy** because the FPM image has no `pgrep`; `docker top` showed `queue:work` on `critical,default` and notifications queues. That is a healthcheck limitation, not a missing worker.

---

## Baseline (before this phase)

From Phases 3–13, same envelope, 2 workers:

| Surface | Result |
|---------|--------|
| Guest listing 25 VU | 81.1 RPS / p95 104 ms |
| Mixed rps50 | 49.24 RPS / p95 343 ms |
| Product detail 25 VU | 45.8 RPS / p95 **939 ms** |
| Isolated search 25 VU | 74.1 RPS / p95 284 ms (**contaminated** — after rps100) |
| Mixed vu10 search_p95 | 19 ms (quiet box) |

Single-request HTTP before code change (`GET /products/{id}`, Arabic Accept-Language):

| Product | Bytes | Time | Execute statements |
|---------|------:|-----:|-------------------:|
| No related, 0 images | 1696 | 68 ms cold / 33 ms warm | 16 (9 `information_schema`) |
| 1 related, 0 images | 2427 | 67 ms | **26 (15 `information_schema`)** |

Business SQL on the related-product request:

1. `SELECT products.*` + correlated likes/reviews count/avg  
2. `SELECT *` vendor_accounts, categories, product_colors, product_images, product_inventory  
3. Related `cardQuery` (bounded `LIMIT 8`)  
4. Related vendor/category column subsets, `primaryImage` ofMany, inventory  
5. Then 15 `information_schema.tables` EXISTS probes (`likesCount` / `reviewsCount` / `ratingAverage` × 3 tables, plus related cards)

Search (already cached): 37 ms first / 23 ms second; **7 executes across both** (warm is Redis).

Payload: no large media trees on this dataset (0 images; related ≤ 1). The bottleneck was **query count + PHP/Octane under concurrency**, not JSON size.

---

## Bottleneck analysis

Evidence, not guesses:

1. **Guest detail had no Redis cache** while `GET /products` and `GET /catalog/search` did. Listing went from 22.7 → 81 RPS after that pattern. Detail did not.
2. **`engagementTablesExist()` ran `Schema::hasTable` before using eager `withCount`/`withAvg`.** That is why 15 schema probes appear even when aggregates are already on the model.
3. **`findPublic` eager-loaded `SELECT *` on vendor/category/colors/images/inventory.** Detail Resource only needs a column subset.
4. **Related products** were already bounded (`latest()->limit(8)`) and used the slimmer card query. They amplified schema probes, not unbounded scans.
5. **Search SQL is not the busy-box limiter.** It is already stampede-cached. Isolated 284 ms was a dirty measurement.
6. Single-user detail was already ~30–70 ms. The 939 ms p95 is **queueing on 2 Octane workers** once each request does 16–26 MySQL round-trips.

No index was added. Dataset is small (~12 public products). EXPLAIN would not change the 15 schema probes.

---

## Changes

Every change answers the change-control questions.

### 1. Guest product-detail cache

**Files:** `CachedPublicProductDetailService.php` (new), `ProductController.php`, `CacheKeys.php`, `config/diyar.php` (`product_detail_seconds` = 60)

| Question | Answer |
|----------|--------|
| Bottleneck | Repeated findPublic + related + serialize under k6 (same product ID, guest). |
| Evidence | 26 SQL/request; listing cache already proved this class of fix. |
| Why this | Same `CATALOG_VERSION` + `StampedeSafeCache` + locale key as listing. Authenticated shows bypass the cache. |
| Correctness | 60s staleness of public fields (inventory, likes_count) — same as listing cards. Archive bumps catalog version → 404. |
| Security | Guest payload only. `user_liked` / `user_saved` / `is_own_store` / `sales_stats` cannot leak. Tests cover leak + archive. |
| Cache/state | Redis key `diyar:catalog:products:detail:v1:{version}:{locale}:{md5(id)}`. No static Octane cache. |
| Tests | `ProductDetailCacheTest`, `CatalogQueryPerformanceTest` cache-hit. |
| Performance | Isolated detail p95 939 → 30 ms. |

Analytics still runs on cache hit via `recordView(product_id, vendor_account_id)` + existing Redis dedupe. The Product model is not required on the warm path.

### 2. Engagement aggregates before schema probes

**File:** `ProductEngagementService.php`

`likesCount` / `reviewsCount` / `ratingAverage` now return eager `withCount`/`withAvg` attributes **before** `Schema::hasTable`. `engagementTablesExist()` is wrapped in `once()`, which Octane flushes (`Laravel\Octane\Listeners\FlushOnce`).

Cold detail with 0 related: schema probes **15 → 0**. Fallback count/avg queries remain if aggregates were not loaded.

### 3. Narrower detail eager loads

**File:** `ProductService::detailEagerLoads()`

`vendorAccount:id,business_name,slug`, `category:id,name,slug`, `colors:id,product_id,name,hex_code`, `images:id,product_id,media_file_id,sort_order`, `images.mediaFile:id,path`, inventory quantity columns.

API fields unchanged. Product row itself remains `SELECT *` (description, return policy, dimensions).

### 4. Related-product hard cap

**File:** `ProductService::relatedProducts()` — `limit = min($limit, 8)`.

Already defaulted to 8. Cap is now enforced. PHPUnit: 12 siblings → 8 cards.

### 5. Search

**No search engine / index / query rewrite.** Added a cache-hit query-budget test. Corrected `ProductTest::test_search_endpoint_returns_matching_products` to `data.products.items` (the live `CatalogSearchController` contract). That test was asserting a stale envelope; behavior was not changed.

---

## Tests

| Suite | Command | Result |
|-------|---------|--------|
| Catalog feature | `php vendor/bin/phpunit tests/Feature/Api/V1/Catalog` | **152 passed** |
| Cache + analytics | `CacheOptimizationTest`, `CacheDeepAuditTest`, `ProductViewAnalyticsTest`, `HttpCachePolicyTest` | **22 passed** |
| Vitest (product-related) | `catalogProductToSnapshot`, `addCatalogProductToSession`, `ProductShareSheet`, `vendorProductValidation` | **20 passed** |
| Build | `npm run build` | **PASS** (vite 28.4 s) |
| k6 | `run-kvm2-phase2.ps1 -SkipRecreate` | **15/15 profiles, 0% 5xx, 0 429** |

Not run: full Playwright, Hostinger, 4-worker retry.

---

## Benchmarks

Same script, 90 s stages, rate limits ON, 2 workers, cpuset 0–1 vs k6 2–3.

Isolated 25 VU (authoritative comparison):

| Workload | Before (Phase 3–13) | After (Phase 14) |
|----------|---------------------|------------------|
| detail p50 / p95 / p99 | 160 / **939** / 1467 ms | 5.3 / **30.4** / 207 ms |
| detail RPS | 45.8 | **86.5** |
| search p95 | 284 ms (dirty) | **29.6 ms** |
| search RPS | 74.1 | 85.3 |
| products p95 | 104 ms | **18.5 ms** |
| products RPS | 81.1 | 86.4 |

Mixed storefront:

| Load | Before RPS / p95 | After RPS / p95 |
|------|------------------|-----------------|
| vu5 | 17.4 / 22.5 ms | 17.3 / 20.3 ms |
| vu10 | 34.4 / 38.2 ms | 33.9 / 21.0 ms |
| vu25 | 80.8 / **147 ms** | 85.9 / **34.1 ms** |
| vu50 | 143 / 346 ms | 164 / **97.5 ms** |
| rps25 | 24.9 / 252 ms | 24.9 / **13.7 ms** |
| **rps50** | **49.2 / 343 ms** | **49.8 / 12.7 ms** |
| rps75 | 68.7 / **2823 ms** | **74.6 / 22.1 ms** |
| rps100 | 89.7 / **2719 ms** | **99.4 / 23.3 ms** |
| rps125 | 116 / 2283 ms | 124 / 74 ms |
| rps150 | 126 / 3475 ms | 149 / 340 ms |
| rps200 | 167 / 3264 ms | 196 / 677 ms |

Errors: **0% 5xx, 0 429** on every profile.

k6 isolated detail/listing/search is **warm-dominated** after the first miss (one product ID, 60 s TTL). Cold path is the SQL profile: 7 business executes, 0 schema probes, then Redis. That is the same methodology as the listing campaign.

---

## Database

Post-deploy confirm (cold + warm, 0 related):

- Execute total for **both** requests: **7**
- `information_schema`: **0**
- Warm JSON: 22 ms, 2145 bytes
- Relation SELECTs use column subsets (verified in general_log)

MySQL CPU during isolated detail 25 VU: peak **11.5%** of one VM CPU (was listing-bound at 111% before Phase 3; detail is not MySQL-bound now).

No new index.

---

## Redis

| Item | Value |
|------|--------|
| Detail TTL | 60 s, versioned, locale + id |
| Invalidation | `CatalogCacheInvalidator` bumps `diyar:catalog:version` |
| Stampede | `StampedeSafeCache` lock |
| evicted_keys | **0** (after campaign) |
| Isolated detail Redis CPU peak | 26% |
| Isolated search Redis CPU peak | 51% (expected — cached search) |

Authenticated detail is not cached.

---

## Octane

- Workers: **2** (not increased).
- No request-scoped static product cache.
- `once()` for schema existence is flushed per request by Octane.
- Cached payload lives in Redis, not worker memory.
- App CPU peak: detail isolation 54%; vu50 mixed 117% of one VM CPU (both stack CPUs busy). Remaining limiter at ≥150 mixed RPS is Octane + Redis, not MySQL.

---

## Security

PHPUnit (not a pentest):

- Guest cache does not leak `user_saved` / `user_liked` / `is_own_store` / `sales_stats`
- Archive → catalog version bump → guest **404** (cached unpublished body not served)
- `ProductIdorTest` vendor isolation
- `CatalogSearchSecurityTest` public search + visibility
- No rate-limit / visibility / auth middleware removed
- No API fields removed

**STATUS: VERIFIED WITH LIMITATIONS** (automated tests only).

---

## Frontend

`useProduct(id)` still calls `GET /products/{id}`. Related products remain in that payload (`related_products`). Extra page-load calls that k6 does **not** issue:

- `useVendor(slug)` — store follow/profile
- `ProductReviewsSection` → `GET /products/{id}/reviews`

No frontend staleTime increase. No payload fields dropped, so no frontend contract change. React Query default `staleTime: 0` still refetches on remount (correct for likes/wishlist after login).

---

## Queue

| Check | Before campaign | After campaign |
|-------|-----------------|----------------|
| `failed_jobs` | 0 | **0** |
| `analytics_events` (`product_viewed`) | 6 121 | **22 695** |
| `queues:default` / `critical` depth | 0 | **0** |
| Job class on FPM queue image | yes | yes |

Workers were rebuilt with the current FPM image **before** k6. The Phase 3–13 10 224 failed-job incident (Octane rebuilt, queues stale) was not reproduced.

Queue-critical Docker health is **unhealthy** (`pgrep` missing). Process table showed `queue:work redis --queue=critical,default`. Treat healthcheck as **NOT VERIFIED** as a signal; treat job processing as **VERIFIED**.

---

## Face 2 — adversarial review

Re-read of the patch after Face 1:

| Challenge | Outcome |
|-----------|---------|
| Personalized cache leak | Rejected: authenticated bypass + leak tests. |
| Serving archived products | Rejected: version bump on archive + 404 test. |
| Octane `once()` leak | Rejected: `FlushOnce`; value is schema existence, not user/locale. |
| Analytics dropped on cache hit | Rejected: `recordView` still runs; events grew; PHPUnit job on second guest GET. |
| Related unbounded | Rejected: hard cap 8. |
| Search rewrite hidden in this PR | None. Test assertion only. |
| Warm-cache-only k6 | Limitation accepted and documented. Cold SQL + listing-equivalent methodology. |
| Mixed regression | None. rps50 p95 343 → 13 ms. Listing 104 → 18.5 ms. |
| 4 workers | Not done. No evidence collected this phase that 4 workers help now. |

Optimization **accepted**.

---

## Limitations

- Local KVM2-equivalent only. **Not Hostinger.**
- Catalog dataset ~12 public products; related cardinality in Docker is low. Cap of 8 is tested in PHPUnit, not in k6.
- Isolated k6 detail/search/listing hammer one cache key after the first miss.
- Authenticated product detail is still uncached (correct).
- Queue Docker healthcheck does not match FPM image tools.
- Playwright / real-device / 25K / production deploy: **NOT VERIFIED**.

---

## Capacity interpretation

On this **2-vCPU local simulation**, guest storefront HTTP is now Redis/Octane-bound. Mixed **100 arrival RPS** completed at **99.4 actual RPS / 23 ms p95** with 0 errors. Mixed **150 RPS** still meets arrival but p95 is 340 ms. That is a local scheduler result, not a Hostinger SLA.

Do **not** read this as “Hostinger supports 100 RPS.”

---

## Recommendation

**Do not add Hostinger vCPU yet.** Optimization is not exhausted for authenticated detail, and Hostinger is untested.

Evidence-backed next step (pick one, measure):

1. **Authenticated product-detail** — per-user fields must stay out of the global cache; consider overlaying `user_liked` / `user_saved` on a public cached body if profiling shows vendor/customer detail as the next limiter.  
2. **Optional 4-worker trial** on the same 2-CPU pin, now that the HTTP path is mostly Redis GET. Previous 4-worker trial lost because detail was still heavy. Do not enable 4 workers without repeating vu25 mixed.  
3. **Hostinger** only as a separate campaign with production-like data volume.

---

## Final classification

| Target | Status |
|--------|--------|
| Product detail (guest, local KVM2) | **VERIFIED WITH LIMITATIONS** |
| Search under concurrency | **VERIFIED WITH LIMITATIONS** |
| Mixed storefront vs ~50 RPS / 343 ms | **VERIFIED WITH LIMITATIONS** (improved) |
| Guest listing vs ~81 RPS / 104 ms | **VERIFIED WITH LIMITATIONS** (preserved/improved) |
| Queue durability this campaign | **VERIFIED** (`failed_jobs = 0`) |
| Security (automated) | **VERIFIED WITH LIMITATIONS** |
| KVM2 local simulation | **VERIFIED WITH LIMITATIONS** |
| Hostinger | **NOT VERIFIED** |
| Production ready | **NOT VERIFIED** |
