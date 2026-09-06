# Redis / Cache Audit

**Evidence:** `_raw/redis_cache_inventory.json`, `_raw/redis_verify.json`

---

## Redis usage roles

| Role | Store | Production driver | Notes |
|------|-------|-------------------|-------|
| Application cache | `CACHE_STORE=redis` | Laravel Cache | Prefix `diyar-cache-` |
| Queue backend | `QUEUE_CONNECTION=redis` | Laravel Queue | Multiple named queues |
| Rate limiting | Cache store | `RateLimiter` | Uses cache driver keys |
| Session | `SESSION_DRIVER` | file/redis (env) | Not forced to Redis in code |
| Broadcast | Reverb | WebSocket | Separate from cache Redis usage |
| Locks | Cache store | `Cache::lock` | Analytics, catalog stampede |

---

## Architecture assessment

**PASS (design)** — Redis is used for appropriate runtime coordination (cache, queues, limits, locks). No blind caching of user-specific commerce state at the HTTP layer.

**PARTIAL (live verification)** — Local dev host had Redis unavailable during this pass; ping/latency benchmarks are NOT VERIFIED here. Phase 28.7 reported p95 ~1.35 ms for cache ops on staging.

---

## Hot paths

| Path | Cache | Stampede | Invalidation |
|------|-------|----------|--------------|
| Catalog search facets | 300s TTL | **FIXED** (28.11) | Version bump on product mutations |
| Catalog suggestions | 45s TTL | **FIXED** (28.11) | Same catalog version |
| Analytics dashboards | 60–900s | Yes (`AnalyticsCache`) | Event-driven scope invalidation |
| Admin permissions | 3600s | No (cheap) | Version bump on role changes |
| Notification unread | 300s | N/A | DB reconcile + counter service |
| Chat summary/unread | 120–300s | Partial | Message/read listeners |
| Shipping zones | 600s | No | `ShippingConfigCache` version |
| Affiliate dashboard | 120s | No | Profile-scoped version key |
| B2B / Blog CMS | Versioned | No | Admin publish hooks |

---

## Memory safety

| Risk | Severity | Mitigation |
|------|----------|------------|
| Unbounded catalog facet keys | P3 | TTL 300s + version invalidation |
| Analytics large payloads | P3 | Scoped keys + TTL caps in config |
| Orphaned keys after version bump | P4 | TTL expiry; no `KEYS *` flush |
| Session growth | P3 | Session driver env-controlled |
| Queue payload size | P2 | Jobs pass IDs not full models where possible |

---

## Duplicated / inconsistent keys (pre-28.11)

| Old key | New key | Status |
|---------|---------|--------|
| `catalog.search.facets.{md5}` | `diyar:catalog:search:facets:v1:{version}:{md5}` | Migrated |
| `catalog.search.suggestions.*` | `diyar:catalog:search:suggestions:v1:{version}:*` | Migrated |
| `admin.permissions.v3.{userId}` | `diyar:admin:permissions:v4:{userId}:{version}` | Migrated |

Legacy keys expire naturally via TTL.

---

## Production config checklist

- `CACHE_STORE=redis`
- `QUEUE_CONNECTION=redis`
- `REDIS_HOST` / `REDIS_PORT` reachable from PHP-FPM and workers
- Supervisor/systemd workers for: `default`, `notifications`, `notifications-high`, `notifications-low`, `critical`, `chat`, `chat-low`
- `DIYAR_ENFORCE_REDIS_IN_PRODUCTION=true` on Hostinger
