# Deep Cache Audit — Phase 28.11 Second Pass

**Date:** 2026-08-27  
**Scope:** Full backend cache/Redis/queue re-verification against live code

---

## Executive summary

The second pass found and fixed **three production-critical cache issues** missed in the first pass:

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| OPT-CACHE-010 | **P0** | Admin permission cache key used `(int) $user->id` on UUID users → all admins shared key `...:0:...` | Use `(string) $user->id` in `CacheKeys::adminPermissions` |
| OPT-CACHE-011 | **P1** | Catalog/admin invalidation ran **inside** DB transactions (rollback race) | `invalidateSearchCachesAfterCommit()` / `forgetAllAfterCommit()` |
| OPT-CACHE-012 | **P2** | `VersionedCache::bump` was non-atomic read-modify-write | `Cache::increment()` |

Additional hardening: Redis failure fallback in `StampedeSafeCache` + `AnalyticsCache`, safe CLI `diyar:cache:invalidate`, `.env.example` Redis DB separation docs.

---

## Application code cache operations (verified)

| Pattern | App count | Tests only |
|---------|-----------|------------|
| `Cache::flush()` | **0** | 6 files |
| `Redis::keys/flushdb` | **0** | — |
| `Cache::lock()` | 12+ | Console + chat + analytics + stampede |
| Version bumps | 6 domains | catalog, admin, analytics, shipping, blog, b2b |

---

## Cache classification

| Class | Examples | Shared? |
|-------|----------|---------|
| PUBLIC | Catalog facets, suggestions, categories | Yes |
| AUTHENTICATED | Cart (no Redis), wishlist rate keys | Per user/IP |
| USER-SPECIFIC | Notifications unread, chat unread, OTP | Per UUID user |
| TENANT-SPECIFIC | Vendor analytics scope, affiliate dashboard | Per vendor/profile ID |
| ADMIN | Admin permissions, platform analytics | Per admin user / platform |
| SENSITIVE | OTP, idempotency, payment dedupe | Short TTL, single use |

---

## Stampede protection coverage

| Service | Protected | Notes |
|---------|-----------|-------|
| `CatalogSearchService` | Yes | `StampedeSafeCache` |
| `CatalogSearchSuggestionService` | Yes | `StampedeSafeCache` |
| `AnalyticsCache` | Yes | Lock + Redis fallback added |
| `AffiliateDashboardService` | No | Low concurrency; 120s TTL |
| `ZoneResolver` | No | Cheap query; 600s TTL |

---

## Large payload audit

No entire Eloquent models cached in Redis for hot paths. `CachesQueryResults` stores JSON attribute arrays only. Analytics/affiliate dashboards cache computed array DTOs (bounded by date range + scope).

---

## Evidence

- `_raw/deep-pass/_phpunit_cache_deep.txt` — 9/9 cache tests PASS
- `_raw/redis_cache_inventory.json` — from first pass
- `backend/scripts/stage2811-redis-cache-inventory.php`
