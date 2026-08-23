# Production Environment Runbook

## Configuration

| Variable | Production value |
|----------|------------------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `CACHE_STORE` | `redis` |
| `QUEUE_CONNECTION` | `redis` |
| `SESSION_SECURE_COOKIE` | `true` |
| `DIYAR_PAYMENT_USE_FAKE_GATEWAY` | `false` |
| `MYFATOORAH_TEST_MODE` | `false` |

Validate before deploy:

```bash
php artisan diyar:validate-environment
```

## Domains

| Surface | Domain |
|---------|--------|
| Marketplace | `diyar.com` |
| Admin | `admin.diyar.com` |
| API | `api.diyar.com` |

SPA build uses `VITE_API_URL=/api/v1` when API is same-origin behind Nginx.

## Infrastructure

See `conception/architecture/DEPLOYMENT.md` and `deploy/nginx/production.conf.example`.

### Workers (Supervisor)

- `notifications-high`, `notifications`, `notifications-low`
- `chat-low`, `default`
- Optional: `reverb:start`

### Health / monitoring

- Liveness: `GET /api/v1/health`
- Readiness: `GET /api/v1/readiness`
- Monitor: API latency, 5xx rate, DB connections, Redis latency, queue depth, `failed_jobs`, CPU/RAM/disk

Do not expose secrets, stack traces, or raw env in public endpoints.

## Security

- HTTPS + HSTS (`SecurityHeaders` middleware)
- CORS allowlist via `FRONTEND_URL` / Sanctum stateful domains
- Rate limits on auth, search, webhooks
- Admin/marketplace session isolation (separate guards)
- Webhook signature validation

## Backups

See [DATABASE_BACKUP.md](./DATABASE_BACKUP.md).

- MySQL: authoritative — daily backups, tested restore
- Redis: not source of truth — rebuild from MySQL if lost
- Storage: versioned object storage backups for media

RPO/RTO: document per business SLA (target RPO ≤ 24h for V1).

## Rollback

1. Revert deployment artifact (previous release tag)
2. `php artisan migrate:status` — avoid destructive down migrations in prod
3. Restart PHP-FPM + workers
4. Verify health/readiness + smoke

## Release gates

1. Staging smoke green
2. `diyar:validate-environment` green on production `.env`
3. CI green on release commit
4. Post-deploy smoke + monitor 30m

Production deploy workflow is **manual** — do not auto-deploy from arbitrary branches.
