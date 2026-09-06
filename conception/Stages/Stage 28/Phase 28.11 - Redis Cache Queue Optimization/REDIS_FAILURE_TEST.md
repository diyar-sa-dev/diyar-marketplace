# Redis Failure Behavior

---

## Design principle

Optional application caches must **degrade to direct computation**, not fail the request.

---

## Implementation (pass 2)

| Component | Redis unavailable behavior |
|-----------|---------------------------|
| `StampedeSafeCache::remember` | try/catch → execute callback directly |
| `AnalyticsCache::remember` | try/catch on get + lock failure → callback |
| `VersionedCache::version` | Returns `0` on failure |
| `VersionedCache::bump` | No-op return current version on failure |

---

## Mandatory Redis features (production)

| Feature | Required? | Fallback |
|---------|-----------|----------|
| Cache store | Configurable | `database` / `file` in dev |
| Queue | Configurable | `sync` in dev |
| Rate limiting | Uses cache driver | Falls back with cache driver |
| Sessions | `database` default in `.env.example` | Not Redis-dependent |

`DIYAR_ENFORCE_REDIS_IN_PRODUCTION=true` blocks misconfigured production deploy without Redis.

---

## Live test status

| Test | Result |
|------|--------|
| `stage28-redis-verify.php` on dev host | **FAIL** — connection refused |
| Code-path fallback | Verified via try/catch implementation |
| Full request with Redis down | **NOT VERIFIED** locally |

---

## Queue with Redis down

Jobs dispatch to sync driver in PHPUnit. With `QUEUE_CONNECTION=redis` and Redis down, dispatch fails — expected; workers must be monitored.

---

## Verdict

**Redis Failure (application cache paths): PASS (by design)**  
**Live Redis outage soak: NOT VERIFIED**
