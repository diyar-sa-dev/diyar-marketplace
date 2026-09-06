# Phase 28.11 — Redis / Cache / Queue Optimization Strategy

**Date:** 2026-08-27  
**Baseline commit:** `92638a9ef5e5dcce27ca56a3ededdf3d40163bed`  
**Builds on:** Phase 28.7 (load), 28.9 (DB), 28.10 (API)

---

## Objective

Establish a clear performance hierarchy without duplicating 28.9 SQL work or 28.10 API query fixes:

```
Browser (TanStack Query)
  → CDN / HTTP cache (Phase 28.13)
  → Laravel API
  → Redis (cache, locks, rate limits)
  → Optimized MySQL 8
  → Queue workers (async notifications, webhooks, audit, chat archive)
```

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Cache key standardization (catalog, admin permissions) | Redis Cluster / Kafka |
| Stampede protection for hot public caches | CDN / HTTP cache headers (28.13) |
| Targeted invalidation (no global flush) | Frontend bundle optimization (28.12) |
| Queue uniqueness for payment webhooks | CSP hardening (28.6 / deferred) |
| TanStack Query staleTime tuning (public catalog) | Database schema changes |
| Inventory scripts + concurrency tests | Microservices split |

---

## Prior findings cross-reference

| ID | Phase | 28.11 action |
|----|-------|--------------|
| KI-028-053 | 28.3/28.10 | **VERIFIED** — public assistant + throttle; no response caching |
| KI-028-054 | 28.3/28.10 | **RESOLVED** — rate limit tests pass (28.10) |
| KI-028-037/057 | 28.3/28.10 | **RESOLVED** — assistant feature tests (28.10) |
| OPT-DB-001..007 | 28.9 | Complement only — catalog facets still hit DB on miss |
| OPT-API-005 | 28.10 | Named `assistant-chat` limiter — retained |
| OPT-REDIS-001 | 28.7/28.8 | Re-verify at 500+ VU — **DEFERRED** (no Redis on dev host) |
| OPT-QUEUE-001 | 28.7/28.8 | Worker throughput benchmark — **DEFERRED** |

---

## Implementation summary

1. **`StampedeSafeCache`** — reusable single-flight helper (mirrors `AnalyticsCache` pattern).
2. **`CacheKeys` + `VersionedCache`** — deterministic `diyar:*` keys with version bumps.
3. **Catalog search** — facets + suggestions use stampede-safe cache + config TTLs.
4. **Admin permissions** — `forgetAll()` bumps version instead of `Cache::flush()`.
5. **Catalog invalidation** — product create/update/archive + admin activate/deactivate/archive bump catalog version.
6. **Payment webhooks** — `ProcessPaymentWebhookJob` implements `ShouldBeUnique`.
7. **Frontend** — `useVendor`, `useProvider`, `useSearchProducts` staleTime aligned with global defaults.

---

## Environment matrix

| Environment | Cache | Queue | Redis |
|-------------|-------|-------|-------|
| PHPUnit | `array` | `sync` | Not required |
| Local dev | `redis` or `file` | `sync` or `redis` | Optional |
| Staging / Hostinger | `redis` | `redis` | Required when `DIYAR_ENFORCE_REDIS_IN_PRODUCTION=true` |

---

## Testing strategy

- `CacheOptimizationTest` — version bump, stampede-safe remember, admin flush isolation.
- Regression: `CatalogSearch*`, `RateLimiting`, `AdminFoundation` (28 passed).
- Redis live verify: **NOT VERIFIED** on this host (connection refused); script output in `_raw/`.

---

## Next phase

**28.12 — Frontend Performance Optimization** (not started; requires authorization after 28.11 review).
