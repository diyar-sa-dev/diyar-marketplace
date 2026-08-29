# Redis Capacity Results — DIYAR Marketplace

**Date:** 2026-08-29  
**Instance:** Redis 7 Alpine (Docker)  
**Prefix:** `diyar-loadtest-`

---

## Integration Tests (VERIFIED)

```text
tests/Integration/Redis/RedisRuntimeIntegrationTest.php
Result: 6/6 PASS (915 ms)
Host: 127.0.0.1:6379, CACHE_STORE=redis, QUEUE_CONNECTION=redis
```

Covers: cache roundtrip, VersionedCache increment, StampedeSafeCache, rate limiter, queue push, lock acquisition.

---

## Runtime Stats (MEASURED — after k6 load)

| Metric | Value |
|--------|-------|
| keyspace_hits | 78,460 |
| keyspace_misses | 4,819 |
| Hit ratio | **~94.2%** |
| instantaneous_ops_per_sec | 0 (idle snapshot) |

---

## Failure Simulation

| Scenario | Status |
|----------|--------|
| Redis unavailable | NOT RUN (unit tests cover fallback paths) |
| Redis restart | NOT RUN |
| Memory pressure | NOT RUN |

---

## Verdict

| Claim | Status |
|-------|--------|
| Redis production-ready (driver wiring) | **VERIFIED** |
| Cache hit ratio under load | **MEASURED ~94%** |
| Redis failure graceful degradation | **PARTIALLY VERIFIED** (code + tests; live failover NOT RUN) |
