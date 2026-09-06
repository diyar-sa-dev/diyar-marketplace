# Phase 28.11 — Redis Architecture

**Date:** 2026-08-27  
**Redis version (Docker):** 7.4.7 (redis:7-alpine)

---

## Topology

```
┌─────────────────┐     ┌──────────────────┐
│  Laravel API    │────▶│ Redis DB 0       │  queues, locks, rate limits (default connection)
│  (PHP-FPM/Octane)│     │  prefix: *-database- │
└────────┬────────┘     └──────────────────┘
         │
         │              ┌──────────────────┐
         └─────────────▶│ Redis DB 1       │  Laravel cache store (`REDIS_CACHE_DB=1`)
                        │  prefix: *-cache- │
                        └──────────────────┘
```

Configured in `config/database.php`:
- `default` → `REDIS_DB` (0)
- `cache` → `REDIS_CACHE_DB` (1)

---

## Environment matrix

| Environment | REDIS_HOST | Cache | Queue | Session |
|-------------|------------|-------|-------|---------|
| Docker API container | `redis` (DNS) | redis | redis | redis |
| Host PHP + Docker Redis | `127.0.0.1:6379` | redis | redis | redis/database |
| PHPUnit (unit/feature) | n/a | array | sync | array |
| PHPUnit Redis integration | `127.0.0.1` | redis | redis | array |
| Hostinger production | env | redis | redis | redis recommended |

---

## Key namespaces

| Domain | Pattern | Invalidation |
|--------|---------|--------------|
| Catalog search | `diyar:catalog:search:*:v1:{version}:*` | Version bump `diyar:catalog:version` |
| Admin permissions | `diyar:admin:permissions:v4:{uuid}:{version}` | Version bump / per-user forget |
| Analytics | `analytics:*` + `analytics:version:{scope}:{id}` | Scope version bump |
| Notifications unread | `diyar:notifications:unread:{userId}` | Targeted forget |
| Chat | `diyar:chat:*` | Message/read events |

**Global flush:** prohibited in application code (0 runtime `Cache::flush()`).

**Safe ops invalidation:** `php artisan diyar:cache:invalidate {domain}`

---

## Docker compose

- `docker-compose.dev.yml` — Redis on `localhost:6379` for host dev
- `docker-compose.loadtest.yml` — Redis exposed `6379:6379`, API uses `REDIS_HOST=redis`

---

## Production recommendations (Hostinger VPS)

- `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`
- Separate Redis logical DBs (0/1) as configured
- Supervisor workers for: `default`, `notifications`, `notifications-high`, `notifications-low`, `critical`, `chat`, `chat-low`
- `DIYAR_ENFORCE_REDIS_IN_PRODUCTION=true`
- Do **not** run `php artisan cache:clear` in production without understanding it clears the cache store only (still avoid during traffic peaks)
