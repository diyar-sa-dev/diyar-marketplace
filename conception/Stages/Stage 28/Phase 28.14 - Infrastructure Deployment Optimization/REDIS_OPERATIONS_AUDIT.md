# Redis Operations Audit — Phase 28.14

## Workloads

| Use | Criticality | Failure behavior |
|-----|-------------|------------------|
| Application cache (28.11) | Degraded perf | DB fallback / cache miss |
| Queue jobs | Critical | Jobs stall; failed_jobs table |
| Sessions (if redis) | Auth impact | Re-login required |
| Rate limiting | Security | Must not use loadtest in prod |

## Configuration

- Prefix: `REDIS_PREFIX` per environment (staging must include `staging`)
- Production: `allkeys-lru` with `maxmemory` cap recommended
- Persistence: AOF for queue durability optional; cache can be ephemeral

## Failure modes

| Scenario | Expected behavior |
|----------|-------------------|
| Redis down | Health → `degraded`; cache misses; queue fails gracefully |
| Redis restart | Workers reconnect; no financial data loss (MySQL authoritative) |
| Memory eviction | Cache keys evicted; catalog VersionedCache rebuilds |

## Health probes

`PlatformHealthService::probeCache()` + `probeQueue()` in `/api/v1/health/ready`.

## 28.14 production guard

`DIYAR_LOADTEST_MODE=false` enforced — prevents unlimited rate limiters in production.
