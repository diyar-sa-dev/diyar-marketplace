# Cache Flush Audit — Final Report

**Rule:** Zero unexplained global cache flushes in application runtime code.

---

## Flush operations table

| Operation | Location | Scope | Safe? | Replacement | Status |
|-----------|----------|-------|-------|-------------|--------|
| `Cache::flush()` | `app/**` | — | — | — | **NONE IN APP** |
| `Cache::flush()` | `tests/Feature/Admin/SystemSettingServiceTest.php` | Test isolation | YES (PHPUnit only) | — | VERIFIED |
| `Cache::flush()` | `tests/Unit/.../NotificationCircuitBreakerTest.php` | Test isolation | YES | — | VERIFIED |
| `Cache::flush()` | `tests/Unit/.../NotificationUnreadCounterServiceTest.php` | Test isolation | YES | — | VERIFIED |
| `Cache::flush()` | `tests/Feature/Api/V1/Auth/RegistrationTest.php` | Test isolation | YES | — | VERIFIED |
| `BlogProjectCache::forgetAll()` | `app/Support/Cache/BlogProjectCache.php` | Version bump only | YES | `Cache::increment` on version keys | VERIFIED |
| `AdminPermissionService::forgetAll()` | `app/Services/Admin/AdminPermissionService.php` | Version bump | YES | `VersionedCache::bump` | FIXED (pass 1) |
| `php artisan cache:clear` | Laravel framework | **Global store** | OPS ONLY | Use `diyar:cache:invalidate {domain}` | DOCUMENTED |
| `diyar:cache:invalidate all` | `InvalidateDiyarCacheCommand` | Domain version bumps | YES | No flush | ADDED (pass 2) |

---

## Wildcard / global Redis deletion

| Pattern | Found in app? |
|---------|---------------|
| `Redis::keys()` | **NO** |
| `Redis::flushdb()` | **NO** |
| `KEYS *` | **NO** |
| `SCAN` + bulk delete | **NO** |

---

## Shared Redis DB risk

`config/database.php` separates:
- `REDIS_DB=0` — default (queues when `REDIS_QUEUE_CONNECTION=default`)
- `REDIS_CACHE_DB=1` — Laravel cache store

**Production recommendation:** Keep cache on DB 1; queue on DB 0. Sessions should use `database` or dedicated DB — documented in `.env.example`.

A global `Cache::flush()` would **only** affect cache DB when using redis cache driver — but **must never be called** from app code regardless.

---

## Verdict

**Cache Flush Safety: PASS** — zero runtime global flushes; safe domain invalidation CLI added.
