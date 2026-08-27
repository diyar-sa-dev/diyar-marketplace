# Phase 28.1 — Environment Specification

**Date:** 2026-08-27  
**Commit:** `92638a9`  
**Rule:** No secrets documented below.

---

## Environment matrix

| Aspect | Development (measured) | Testing (PHPUnit) | CI E2E | Staging (docs) | Production (docs) |
|--------|------------------------|-------------------|--------|----------------|-------------------|
| `APP_ENV` | local | testing | local (bootstrap) | staging | production |
| `APP_DEBUG` | true | — | true (bootstrap) | false | false |
| Database | MariaDB `diyar` | sqlite memory | sqlite file | MySQL 8 (compose) | MySQL (Render) |
| Cache | redis | array | redis | redis | redis |
| Queue | redis | sync | redis | redis | redis |
| Sessions | database | array | database | redis (loadtest) / database | redis (render.yaml) |
| Mail | enabled (SMTP) | array | disabled | configurable | configurable |
| Payments | fake gateway | fake | fake | fake/staging | live provider |

---

## Measured development workstation

| Item | Value | Evidence |
|------|-------|----------|
| OS | Windows 10 | user_info |
| PHP | 8.4.0 | `php -v` |
| PHP path | Herd Lite | composer output |
| Composer constraint | `^8.3` | `backend/composer.json` |
| Laravel | 13.26.1 | `php artisan --version` |
| Node | 23.11.0 | `node -v` |
| npm | 11.6.4 | `npm -v` |
| `.nvmrc` | 20 | repo root (CI uses 22) |
| DB server | MariaDB **10.4.32** | `SELECT VERSION()` |
| DB name | `diyar` | `backend/.env` |
| Redis | 7.4.7 via Docker | `docker-compose.dev.yml` |
| phpredis | 6.1.0 | `php -m` |

### PHP extensions (relevant)

| Extension | Present |
|-----------|---------|
| redis | yes |
| pdo_mysql | yes |
| pdo_sqlite | yes |
| mbstring | yes |
| sodium | **no** (startup warning on Windows CLI) |
| intl | NOT VERIFIED on Windows CLI |

---

## Reproducibility audit

### Documented entry points

| File | Purpose |
|------|---------|
| `backend/.env.example` | Backend template |
| `backend/.env.staging.example` | Staging template |
| `backend/.env.production.example` | Production template |
| `backend/.env.loadtest.example` | Octane/k6 load test |
| `frontend/.env.production.example` | Vite production |
| `frontend/.env.staging.example` | Vite staging |
| `docker-compose.dev.yml` | Local Redis |
| `docker-compose.staging.yml` | MySQL + Redis |
| `docker-compose.loadtest.yml` | Octane + MySQL + Redis |
| `render.yaml` | Production blueprint |
| `scripts/e2e/bootstrap-backend.sh` | CI E2E DB seed |

### Configuration defaults vs `.env`

| Variable | `config/*` default | `.env.example` | Local `.env` (measured) |
|----------|-------------------|----------------|-------------------------|
| `CACHE_STORE` | database | redis | **redis** |
| `QUEUE_CONNECTION` | database | redis | **redis** |
| `SESSION_DRIVER` | database | database | **database** |
| `REDIS_CLIENT` | phpredis | phpredis | phpredis |
| `DB_CONNECTION` | — | mysql | mysql |

**Risk:** Fresh clone without `.env` falls back to **database** cache/queue until configured.

### Undocumented / optional variables (sample)

Full enumeration NOT performed. Known from code:

- `DIYAR_LOADTEST_MODE` — disables rate limits (E2E bootstrap sets true)
- `DIYAR_ENFORCE_REDIS_IN_PRODUCTION` — default true in `config/diyar.php`
- `DIYAR_API_VERSION`, `DIYAR_STAGE` — metadata (defaults stale in config)
- `SANCTUM_STATEFUL_DOMAINS` — required for SPA auth
- `FRONTEND_URL` / `VITE_*` — CORS and API client

### Secrets (required, not documented)

- `APP_KEY`
- `DB_PASSWORD` (if used)
- Mail credentials (`DIYAR_MAIL_*`)
- Payment provider keys (production)
- `REDIS_PASSWORD` (production Render)

---

## Docker infrastructure

| Compose file | Services |
|--------------|----------|
| `docker-compose.dev.yml` | Redis 7-alpine :6379 |
| `docker-compose.staging.yml` | MySQL 8 + Redis 7 |
| `docker-compose.loadtest.yml` | API (Octane), MySQL, Redis, optional k6 |

**Dockerfile:** `backend/Dockerfile.octane` — PHP 8.3, redis, swoole extensions

---

## Web / workers

| Component | Local dev | Production (render.yaml) |
|-----------|-----------|--------------------------|
| API server | `php artisan serve` / Octane via `composer dev` | Octane or PHP-FPM |
| Queue workers | manual / supervisor docs | 4 dedicated worker services |
| Reverb | optional local | dedicated service |
| Scheduler | cron documented | Render cron |
| Nginx | example in `deploy/nginx/` | reverse proxy |

---

## Frontend environment

| Variable | CI E2E build | Typical local |
|----------|--------------|---------------|
| `VITE_API_URL` | `/api/v1` (proxy) | `http://127.0.0.1:8000/api/v1` |
| `E2E_BASE_URL` | `http://127.0.0.1:3000` | same |
| `E2E_API_URL` | `http://127.0.0.1:8000/api/v1` | same |

Playwright: `frontend/playwright.config.ts` — chromium, locale `ar-SA`, CI starts webServers.

---

## Storage & mail

| Driver | Local |
|--------|-------|
| `FILESYSTEM_DISK` | local |
| Mail | SMTP enabled in local `.env` (credentials in `.env` only — **not copied here**) |

---

## External services

| Service | Local baseline |
|---------|----------------|
| Payments | Fake gateway (`DIYAR_PAYMENT_USE_FAKE_GATEWAY=true`) |
| SMS/OTP | Log providers in tests |
| Realtime | Reverb (broadcast connection configured) |
| S3 | NOT CONFIGURED (empty AWS vars) |

---

## Environment gaps (reproducibility)

| ID | Gap | Severity |
|----|-----|----------|
| EG-01 | PHP 8.4 local vs CI PHP 8.3 vs composer `^8.3` | P3 |
| EG-02 | Node 23 local vs `.nvmrc` 20 vs CI 22 | P3 |
| EG-03 | Shared MariaDB server exposes multiple unrelated schemas | P2 |
| EG-04 | Local E2E against dev DB ≠ CI sqlite seed | P2 |
| EG-05 | Playwright CI mode blocked if port 8000 occupied | P3 |

See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) for tracked items.
