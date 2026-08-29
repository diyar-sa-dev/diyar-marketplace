# Infrastructure Audit — Phase 28.14

## Inventory

| Component | Location | Status |
|-----------|----------|--------|
| Nginx production template | `deploy/nginx/production.conf.example` | ✅ Hardened |
| PHP-FPM pools | `deploy/php/fpm-pool-*.conf.example` | ✅ Added |
| OPcache | `deploy/php/opcache-production.ini.example` | ✅ Added |
| Supervisor workers | `deploy/supervisor/diyar-notifications.conf` | ✅ Existing |
| Deploy script | `scripts/deploy/deploy-release.sh` | ✅ Added |
| E2E bootstrap | `scripts/e2e/bootstrap-stack.ps1` | ✅ 28.13 |
| Docker dev | `docker-compose.dev.yml` | ✅ Redis only |
| Docker staging | `docker-compose.staging.yml` | ✅ MySQL+Redis |
| Docker loadtest | `docker-compose.loadtest.yml` | ✅ Octane |
| Docker prod-like | `docker-compose.production-like.yml` | ✅ Added |
| PHP-FPM image | `backend/Dockerfile.fpm` | ✅ Added |
| Octane image | `backend/Dockerfile.octane` | ✅ Loadtest only |
| CI | `.github/workflows/ci.yml` | ✅ |
| Runbooks | `conception/runbooks/PRODUCTION.md` | ✅ |

## Dependency map

```
Browser → Nginx (TLS, gzip, static cache)
        → PHP-FPM (Laravel, OPcache, BCMath)
        → MySQL 8 (authoritative data)
        → Redis 7 (cache, queue, sessions optional)
        → Supervisor (queue workers, scheduler, Reverb)
```

## Hardcoded / dev leakage scan

- `DIYAR_LOADTEST_MODE` — gated for production/staging ✅
- `DIYAR_PAYMENT_USE_FAKE_GATEWAY` — gated ✅
- No `migrate:fresh` in deploy scripts ✅
- PHPUnit forces loadtest off in `TestCase` ✅
