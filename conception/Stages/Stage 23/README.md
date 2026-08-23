# Stage 23 — Staging Environment

Isolated pre-production boundary between development and production.

## Goals

| Requirement | Implementation |
|-------------|----------------|
| Separate database | `diyar_staging` — `backend/.env.staging.example` |
| Separate Redis | `REDIS_PREFIX=diyar-staging-` + boot-time validator |
| Separate storage | `AWS_BUCKET=diyar-staging-media` |
| Sandbox payments | `MYFATOORAH_TEST_MODE=true` or `DIYAR_PAYMENT_USE_FAKE_GATEWAY=true` |
| Test email | Mailhog in `docker-compose.staging.yml` + `[STAGING]` mail prefix rule |
| Staging domains | `staging.diyar.sa`, `staging-api.diyar.sa` (env-driven, not hardcoded) |
| Safety checks | `EnvironmentSafetyValidator` + `php artisan diyar:validate-environment` |
| CI/CD | `.github/workflows/staging-deploy.yml` |
| Smoke tests | `scripts/staging/smoke.sh` |

## Local staging simulation

```bash
docker compose -f docker-compose.staging.yml up -d
cp backend/.env.staging.example backend/.env
# Point DB_HOST=127.0.0.1 DB_PORT=3307, REDIS_PORT=6380, MAIL_PORT=1025
cd backend && php artisan migrate --force && php artisan db:seed --class=PlatformDemoSeeder
php artisan diyar:validate-environment
php artisan serve
```

## Seeding

Use `PlatformDemoSeeder` for controlled QA accounts. Never run demo seeders in production.

## Related docs

- [STAGING runbook](../../runbooks/STAGING.md)
- [STAGE_23_COMPLETION_REPORT.md](./STAGE_23_COMPLETION_REPORT.md)
