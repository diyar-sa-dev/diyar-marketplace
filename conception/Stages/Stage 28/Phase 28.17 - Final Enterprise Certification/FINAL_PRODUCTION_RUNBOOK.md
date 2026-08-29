# Final Production Runbook — Phase 28.17

## Pre-deploy Checklist

- [ ] `APP_ENV=production`, `APP_DEBUG=false`
- [ ] `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `SESSION_DRIVER=redis`
- [ ] `DIYAR_ENFORCE_REDIS_IN_PRODUCTION=true`
- [ ] Octane: `--workers=N` (N ≈ CPU cores)
- [ ] Nginx → Octane upstream (not `artisan serve`)
- [ ] Run `php artisan config:cache`, `route:cache`, `view:cache`
- [ ] Migrations applied on MySQL 8
- [ ] Health: `/api/v1/health/live` + `/api/v1/health/ready`

---

## Deterministic Loadtest Reset (local)

```powershell
docker compose -f docker-compose.loadtest.yml down -v
docker compose -f docker-compose.loadtest.yml up -d --build
# Wait healthy (~2 min)
Invoke-WebRequest http://127.0.0.1:8000/api/v1/health
.\scripts\performance\run-k6.ps1 -Profile rps25
```

---

## Phase 28.17 Certification Run

```powershell
.\scripts\qa\run-phase-28-17-certification.ps1 -Tier quick
.\scripts\qa\run-phase-28-17-certification.ps1 -Tier load
```

Evidence → `conception/Stages/Stage 28/Phase 28.17 - Final Enterprise Certification/_raw/`

---

## Rollback

1. Revert container image tag / git SHA
2. `php artisan migrate:rollback` if schema changed
3. Clear Redis prefix namespace if cache schema changed
4. Verify readiness endpoint before traffic restore

---

## Monitoring Minimum

- Request rate, p95 latency, 5xx rate
- Octane worker memory
- MySQL connections, slow query log
- Redis memory, evictions
- Queue depth, failed_jobs count

---

## Known Gap

Docker healthcheck fix merged in `docker-compose.loadtest.yml` — apply same CMD-array pattern to production/staging compose if using PHP inline probe.
