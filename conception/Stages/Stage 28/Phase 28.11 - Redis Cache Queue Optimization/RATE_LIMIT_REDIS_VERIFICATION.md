# Rate Limit Redis Verification

**Date:** 2026-08-27

---

## Backend rate limiters

Named limiters in `AppServiceProvider` use Laravel `RateLimiter` (Redis-backed when `CACHE_STORE=redis`).

| Limiter | Limit | Verified |
|---------|-------|----------|
| `auth` | 20/min | PHPUnit `RateLimitingTest` |
| `assistant-chat` | 30/min | PHPUnit + finalize script |
| `catalog-search` | 60/min | Route middleware |
| `webhooks` | 120/min | Route middleware |

---

## Verification evidence

| Test | Result |
|------|--------|
| `RateLimitingTest` (full filter) | **PASS** (included in 13-test cache/rate suite) |
| `stage2811-redis-finalize.php` rate_limiter check | **PASS** — 3 hits then block |
| `RedisRuntimeIntegrationTest::test_rate_limiter_on_redis_backend` | **PASS** |

---

## Cross-reference

| Issue | Status |
|-------|--------|
| KI-028-054 | **RESOLVED** (28.10 + re-verified 28.11) |
| KI-028-053 | **VERIFIED** — public assistant + throttle, no response cache |

---

## Verdict

**Rate Limiting Redis: PASS**
