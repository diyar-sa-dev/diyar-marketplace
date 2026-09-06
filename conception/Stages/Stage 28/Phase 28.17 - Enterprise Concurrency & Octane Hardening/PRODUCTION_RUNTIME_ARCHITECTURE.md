# Production Runtime Architecture — Phase 28.17

**Date:** 2026-09-03  
**Scope:** FPM, Octane/Swoole, queue workers, scheduler, Redis, deployment procedures  
**Status:** **PREPARED** — not load-certified

---

## Runtime Models

DIYAR must behave identically under:

| Runtime | Role | Correctness dependency |
|---------|------|------------------------|
| PHP-FPM | Traditional production web | **None on Octane** |
| Octane + Swoole | High-performance web | Performance only |
| Queue workers | Async processing | Same services as HTTP |
| CLI / scheduler | Batch & cron | `onOneServer()` mutex |
| PHPUnit | CI verification | Non-Octane path |

> Octane is a performance runtime, not a business-logic dependency.

---

## Web Layer — FPM (production option A)

| Component | Configuration |
|-----------|---------------|
| Server | nginx → php-fpm |
| Example config | `deploy/nginx/production-like.conf` |
| Sessions | Redis (`SESSION_DRIVER=redis`) |
| Cache | Redis |
| Octane middleware | **Inactive** (`LARAVEL_OCTANE` unset) |

**Status:** **VERIFIED** (dev compose + CI use FPM-compatible paths).

---

## Web Layer — Octane + Swoole (production option B)

| Component | Configuration |
|-----------|---------------|
| Image | `backend/Dockerfile.octane` (PHP 8.3, Swoole, Redis ext) |
| Workers | `OCTANE_WORKERS` (default 4) |
| Task workers | `OCTANE_TASK_WORKERS` (default 2) |
| Max requests | `OCTANE_MAX_REQUESTS` (loadtest default 2000) |
| Listeners | Auth flush, session persist, locale reset, DB disconnect, GC |
| Env flag | `LARAVEL_OCTANE=1` set by Octane bootstrap |

### Worker recycling

| Mechanism | Purpose |
|-----------|---------|
| `--max-requests=N` | Recycle worker after N requests (memory leak mitigation) |
| `CollectGarbage` listener | Octane GC after operations |
| `DisconnectFromDatabases` | Prevent stale connections |
| Graceful reload | `php artisan octane:reload` (zero-downtime deploy) |

**Align note:** `config/octane.php` swoole `max_request=1000` vs compose default 2000 — compose CLI flag wins in Docker.

### Graceful shutdown

```bash
# Stop accepting new connections; finish in-flight
php artisan octane:stop
# Or reload workers with new code
php artisan octane:reload
```

---

## Queue Layer (always separate from HTTP)

Supervisor programs in `deploy/supervisor/`:

| Program | Queues | Processes |
|---------|--------|-----------|
| `diyar-queue-critical` | `critical` | 1 |
| `diyar-queue-high` | `notifications-high`, `notifications` | 2 |
| `diyar-queue-broadcast` | `notifications-low`, `broadcast` | 1 |
| `diyar-queue-chat` | `chat`, `chat-low`, `default` | 2 |

Worker flags: `--max-jobs=1000 --max-time=3600 --memory=128 --tries=5 --timeout=120`

Graceful stop: `stopwaitsecs=3600`, `stopasgroup=true`, `killasgroup=true`

**Do not** run long jobs inside Octane HTTP workers in production.

---

## Scheduler Layer

| Mode | Config |
|------|--------|
| Supervisor loop | `diyar-scheduler` runs `schedule:run` every 60s |
| Mutex | `onOneServer()` when cache is redis/memcached/database |
| Overlap guard | `withoutOverlapping(N)` on minute-level tasks |

Requires shared Redis (or database cache) for distributed locks.

---

## Reverb Layer

| Component | Config |
|-----------|--------|
| Process | `diyar-reverb` supervisor program |
| Scaling | Redis broadcasting backend for multi-node |
| Origins | `ReverbAllowedOrigins` + `config/reverb.php` |

Separate from Octane HTTP — scale independently.

---

## Redis Requirements (production)

| Use | Key prefix | Notes |
|-----|------------|-------|
| Sessions | `REDIS_PREFIX` + session keys | Required for multi-node |
| Cache | Same Redis, prefixed | Catalog stampede locks |
| Queue | Same Redis, prefixed | At-least-once delivery |
| Schedule mutex | Cache store for `onOneServer()` | Required for multi-node cron |
| Broadcast | Redis pub/sub | Reverb multi-instance |

`DIYAR_ENFORCE_REDIS_IN_PRODUCTION=true` in production env templates.

---

## Health Checks

| Endpoint | Type | Use |
|----------|------|-----|
| `/api/v1/health/live` | Liveness | Process up |
| `/api/v1/health/ready` | Readiness | DB + Redis connectivity |
| `/api/v1/health` | Combined | Loadtest Docker healthcheck |

LB should use readiness — not route to nodes failing DB/Redis.

---

## Deployment Procedures

### Octane deploy (recommended)

```bash
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan octane:reload   # graceful worker recycle
# Restart queue workers separately
supervisorctl restart diyar-queue-*
```

### FPM deploy

```bash
# Same through migrate/cache steps
sudo systemctl reload php8.3-fpm
supervisorctl restart diyar-queue-*
```

### Rollback

Revert git ref → re-run cache commands → `octane:reload` or FPM reload → restart queue workers.

---

## Observability

Log context should include (where safe): request ID, order ID, payment ID, webhook event ID.

**Never log:** passwords, full card data, raw tokens, session IDs.

---

## Loadtest Stack (development only)

```bash
docker compose -f docker-compose.loadtest.yml up --build
```

- API: `:8000` (Octane, 4 workers, Redis sessions)
- MySQL: `:3307`
- Redis: `:6379` (conflicts with dev Redis if both running)

Probe scripts: `backend/scripts/stage2817-*.php`

**k6:** Explicitly out of scope for Phase 28.17 closure.

---

## Certification Status

| Gate | Status |
|------|--------|
| FPM compatibility preserved | **VERIFIED** |
| Octane config + listeners | **VERIFIED** |
| Supervisor templates | **PREPARED** |
| Graceful reload documented | **PREPARED** |
| Production load certified | **NOT VERIFIED** |

See [FINAL_CERTIFICATION.md](./FINAL_CERTIFICATION.md).
