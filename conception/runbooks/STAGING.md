# Staging Environment Runbook

## Domains (configure via env — do not hardcode)

| Surface | Example |
|---------|---------|
| Marketplace SPA | `https://staging.diyar.sa` |
| Admin SPA | `https://staging-admin.diyar.sa` |
| API | `https://staging-api.diyar.sa` |

Frontend build: `frontend/.env.staging.example`  
Backend: `backend/.env.staging.example`

## Isolation checklist

- [ ] `APP_ENV=staging`
- [ ] `DB_DATABASE` contains `staging` (not `production` / `diyar_prod`)
- [ ] `REDIS_PREFIX` contains `staging`
- [ ] `AWS_BUCKET` is staging-only
- [ ] `MYFATOORAH_TEST_MODE=true` OR `DIYAR_PAYMENT_USE_FAKE_GATEWAY=true`
- [ ] `MAIL_FROM_NAME` includes `[STAGING]` when using live mail transports
- [ ] `php artisan diyar:validate-environment` passes

Boot-time enforcement: `EnvironmentSafetyValidator` in `AppServiceProvider` (staging + production).

## Local simulation

```bash
docker compose -f docker-compose.staging.yml up -d
```

MySQL: `localhost:3307`, Redis: `localhost:6380`, Mailhog UI: `http://localhost:8025`

## CI/CD

Workflow: `.github/workflows/staging-deploy.yml`

Pipeline: validate staging env → migrate/seed → serve API → `scripts/staging/smoke.sh`

Optional remote deploy: set repository variable `STAGING_DEPLOY_ENABLED=true` and configure `staging` GitHub environment secrets.

## Smoke tests (post-deploy)

```bash
STAGING_API_URL=https://staging-api.diyar.sa/api/v1 \
STAGING_FRONTEND_URL=https://staging.diyar.sa \
bash scripts/staging/smoke.sh
```

Manual QA matrix: admin login, marketplace login, search, product, cart, checkout preview, orders, vendor, provider, notifications, dual-session isolation, logout.

## Seeding

```bash
php artisan db:seed --class=PlatformDemoSeeder
```

Demo password from `DIYAR_DEMO_PASSWORD`. Never seed uncontrolled fake users.
