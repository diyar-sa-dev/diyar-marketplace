# Phase 3–4 implementation evidence (pre-k6)

**Date:** 2026-09-21  
**Scope:** application optimizations for GET `/api/v1/products` and `product_viewed` analytics.  
**k6 retest:** `phase3-12/` campaign in progress. Hostinger: **NOT VERIFIED**.

## Profile (before code change)

Authoritative Phase 1–2:

| Path | 25 VU | p95 |
|------|------:|----:|
| Search `GET /catalog/search` | 85.8 RPS | 34 ms |
| `GET /products` | 22.7 RPS | 1738 ms |
| Product detail | 34.7 RPS | 861 ms |

Code inspection:

1. Search already caches anonymous `listPublic` via `StampedeSafeCache` + `CATALOG_VERSION` (60s TTL). Listing did **not**.
2. `listPublic` called `paginate(..., ['*'])`, forcing `SELECT *` (description, materials, return policy) even when `ProductCardResource` does not use those fields.
3. Cards eager-loaded **all** `images.mediaFile`.
4. `ProductController::show` called `AnalyticsEventRecorder::record()` on the HTTP thread. Slow log: `analytics_events` INSERT 1.0–1.7 s under 2-vCPU contention.

## Changes

### Listing

- `CachedPublicProductListService`: anonymous listings cached like search (`product_list_seconds` default 60). Authenticated listings uncached (`user_saved`, `is_own_store`).
- Cache key: `CacheKeys::catalogProductList(filters, catalogVersion, locale)`. Invalidation: existing `CatalogCacheInvalidator` version bump.
- Card SELECT trimmed to card fields. Eager load: `primaryImage.mediaFile` (`ofMany min sort_order`), vendor/category/inventory column subsets.
- Pagination stays offset (`total` / `last_page` are part of the public API). No cursor switch.

### Analytics

- `RecordAnalyticsEventJob` on queue `default` (processed by `queue-critical` worker: `critical,default`).
- Payload is primitives only (Octane-safe). Timestamp captured at request time.
- Redis `Cache::add` dedupe remains synchronous (cheap). INSERT is async.
- PHPUnit `QUEUE_CONNECTION=sync` still persists the row for existing tests.

### CPU

- `LoyaltyRuleService::calculatePoints` uses `once()` so settings are resolved once per request, not per card.

## PHPUnit

```
tests/Feature/Api/V1/Catalog/ + ProductViewAnalytics + CacheOptimization + CacheDeepAudit
156 passed (excluded pre-existing ProductTest::test_search_endpoint_returns_matching_products
which asserts data.items; catalog search payload is data.products.items)
```

New tests:

- anonymous second GET `/products` does not re-query `products` / inventory / images
- guest cache does not leak `user_saved` / `is_own_store`
- catalog version bump invalidates listing
- product show dispatches `RecordAnalyticsEventJob` and does not insert when the queue is faked

## Face B (code)

| Attack | Answer |
|--------|--------|
| Stale inventory/price? | Same 60s TTL + version bump as search. Stock-only `adjust()` does **not** bump (would thrash on checkout reserves). Documented limitation. |
| Auth leak into shared cache? | Authenticated path bypasses cache. Tested. |
| Octane leakage? | Job has no Request/Eloquent capture. `once()` is request-scoped in Laravel. |
| Queue backup? | Must measure during k6. `queue-critical` listens to `default`. |
| Did we only move the bottleneck? | k6 will say. Hypothesis: listing p95 approaches search after cache warm. |
