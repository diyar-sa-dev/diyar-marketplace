# Redis Benchmark — Phase 28.11 Finalization

**Environment:** Docker Redis 7.4.7 @ `127.0.0.1:6379`, Laravel host PHP 8.4, `CACHE_STORE=redis`  
**Evidence:** `_raw/deep-pass/redis_benchmark_host.json`

---

## Results (50 iterations)

| Operation | p50 (median) | p95 | max |
|-----------|--------------|-----|-----|
| Redis PING (warm) | 0.53 ms | 0.77 ms | 0.80 ms |
| Raw SET/GET/DEL | 1.60 ms | 3.56 ms | 3.93 ms |
| Laravel cache roundtrip | 1.71 ms | 2.68 ms | 7.93 ms |
| Queue size query | 0.59 ms | 1.56 ms | 6.07 ms |

First ping after bootstrap: **9.5 ms** (includes connection setup).

---

## Container network (API → redis DNS)

| Operation | Latency |
|-----------|---------|
| Redis PING | 2.86 ms |
| Laravel cache roundtrip | 1.12 ms |

Evidence: `_raw/deep-pass/redis_verify_container.json` (from finalize run)

---

## Comparison to Phase 28.7

Phase 28.7 reported Redis cache p95 ~1.35 ms at load-test scale. Local Docker measurements are consistent (sub-3 ms p95 for cache roundtrips).

Redis is **not** the application latency bottleneck at current scale (API p95 ~248 ms dominated by PHP + MySQL).

---

## OPT-REDIS-001 status

**RESOLVED** — Redis latency verified on live Docker Redis 7 with Laravel runtime. Re-verify at 500+ VU remains a load-test exercise (Phase 28.7 already passed at 100 VU).
