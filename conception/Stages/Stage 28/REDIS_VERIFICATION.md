# Stage 28 — Redis Verification

**Date:** 2026-08-27T07:39 UTC  
**Environment:** Local dev (Windows host → Docker Redis 7.4.7 on WSL2)  
**Laravel app:** `APP_ENV=local`, commit `92638a9`  
**Overall result:** **PASS**

---

## 1. Configuration verified

| Setting | Expected | Actual (`php artisan about`) |
|---------|----------|--------------------------------|
| `CACHE_STORE` | redis | **redis** |
| `QUEUE_CONNECTION` | redis | **redis** |
| `SESSION_DRIVER` | database | **database** (sessions **not** on Redis — per Stage 28 scope) |
| `REDIS_CLIENT` | phpredis | **phpredis** |
| `REDIS_HOST` | 127.0.0.1 | **127.0.0.1** |
| `REDIS_PORT` | 6379 | **6379** |

Source: `backend/.env` lines 36–56.

---

## 2. Infrastructure checks

| Check | Result | Evidence |
|-------|--------|----------|
| Redis installed | **PASS** | Docker image `redis:7-alpine` |
| Redis running | **PASS** | Container `diyar-marketplace-redis-1` — Up (healthy) |
| Port accessible | **PASS** | Laravel connects to `127.0.0.1:6379` |
| PHP Redis extension | **PASS** | `extension_loaded('redis')` = true, version **6.1.0** |
| Redis server version | **7.4.7** | `INFO server` via Laravel Redis connection |

---

## 3. Laravel → Redis operations

**Script:** `backend/scripts/stage28-redis-verify.php`  
**Exit code:** `0`

```json
{
  "checks": {
    "redis_ping": { "ok": true, "latency_ms": 456.4 },
    "redis_raw_set_get_delete_ttl": { "ok": true, "latency_ms": 5.59, "ttl_seconds": 10 },
    "laravel_cache_redis": { "ok": true, "latency_ms": 5.06 },
    "laravel_queue_redis_connection": { "ok": true, "latency_ms": 1.09, "queue_size": 0 }
  },
  "overall": "PASS"
}
```

Operations verified:

```text
SET → GET → DELETE → SETEX → TTL   (raw Redis)
Cache::put → Cache::get → forget   (Laravel cache store)
Queue::connection()->size()        (Laravel queue Redis driver)
```

**Note:** First `redis_ping` latency (456ms) includes Laravel bootstrap + cold connection; subsequent ops 1–6ms.

---

## 4. Queue worker verification

**Script:** `backend/scripts/stage28-queue-verify.php`  
**Exit code:** `0`

```json
{
  "checks": {
    "dispatch": { "ok": true, "latency_ms": 677.82 },
    "worker_once": {
      "ok": true,
      "exit_code": 0,
      "latency_ms": 377.56,
      "queue_size_before": 1,
      "processed_marker": "processed"
    }
  },
  "failed_jobs_table": { "count": 0 },
  "overall": "PASS"
}
```

Flow verified:

```text
Laravel dispatch (closure job) → Redis queue
  → php artisan queue:work redis --once --stop-when-empty
  → Job executed → Cache marker written
```

Failed jobs: **0** rows in `failed_jobs` table at time of test.

---

## 5. Application health endpoint

**Status:** NOT VERIFIED in this pass (API server curl failed from PowerShell alias; `composer dev` may not expose port during script run).

Existing implementation: `GET /api/v1/health` uses `PlatformHealthService::probeCache()` and `probeQueue()` — same probe pattern as verification script.

**Recommendation for Phase 28.1:** capture health JSON in baseline with API server running.

---

## 6. Warnings / notes

| Item | Detail |
|------|--------|
| PHP sodium extension | Startup warning on local Windows PHP — unrelated to Redis |
| CI PHPUnit | Uses `CACHE_STORE=array`, `QUEUE_CONNECTION=sync` — Redis not exercised in default test suite |
| Session driver | Correctly remains **database** — no change made |
| Cache invalidation | Functional test only (single key); domain invalidation → Phase 28.11 |

---

## 7. Verification conclusion

Redis is **correctly configured and operational** for:

- Laravel cache (`redis` store)
- Laravel queue (`redis` connection)
- Raw Redis commands (SET/GET/DEL/TTL)

Queue worker processing confirmed with `queue:work --once`.

**Proceed to Phase 28.1:** Yes — Redis gate cleared.
