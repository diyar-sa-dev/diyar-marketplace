# Stage 28 — Repository Discovery Report

**Captured:** 2026-08-27 (local audit)  
**Branch:** `dev`  
**Commit:** `92638a9ef5e5dcce27ca56a3ededdf3d40163bed`  
**Auditor method:** Direct inspection of repository source, config, tests, CI, and local runtime (`php artisan about`).

> This report reflects **implemented code**, not documentation claims alone.

---

## 1. Repository layout

```text
diyar-marketplace/
├── backend/          Laravel 13 API (/api/v1, /api/v1/admin)
├── frontend/         React 19 SPA (Vite 6)
├── conception/       Stage plans & architecture docs (Stages 0–26 documented; Stage 28 new)
├── deploy/           Nginx, supervisor, Render/Vercel notes
├── scripts/          E2E bootstrap, k6 performance, Stage 28 Redis verify
├── .github/workflows CI (6 workflows)
├── docker-compose.dev.yml      Redis 7
├── docker-compose.staging.yml  MySQL 8 + Redis 7
├── docker-compose.loadtest.yml Octane + MySQL + Redis
└── render.yaml       Production blueprint
```

---

## 2. Runtime stack (measured locally)

| Component | Version | Source |
|-----------|---------|--------|
| PHP | **8.4.0** (local CLI) | `php -v` |
| Laravel | **13.26.1** | `php artisan about` / `composer.lock` |
| Node | **23.11.0** (local) | `node -v` |
| React | **^19.0.1** | `frontend/package.json` |
| Vite | **^6.2.3** | `frontend/package.json` |
| TypeScript | **~5.8.2** | `frontend/package.json` |
| Redis server | **7.4.7** | Docker `diyar-marketplace-redis-1` |
| PHP Redis ext | **6.1.0** (phpredis) | `php -m` |
| MySQL | **NOT VERIFIED locally** (CLI not on PATH) | `.env` uses `DB_CONNECTION=mysql`, database `diyar` |

**Note:** `backend/composer.json` requires PHP `^8.3`; local PHP 8.4.0 runs but is outside the declared constraint — flag for ENVIRONMENT.md in Phase 28.1.

**Warning observed:** PHP startup warning for missing `sodium` extension on local Windows PHP — **NOT VERIFIED** impact on production (Linux/Docker).

---

## 3. Backend architecture (evidence)

### Routes

| File | Role |
|------|------|
| `backend/routes/api.php` | Primary API (~956 lines, ~100 route definitions) |
| `backend/routes/web.php` | Web routes |
| `backend/routes/channels.php` | Broadcast channels |
| `backend/routes/console.php` | Scheduled commands |

### API domains present in `routes/api.php`

Verified prefixes/controllers include:

- Health / readiness (`/health`, `/health/live`, `/health/ready`, `/readiness`)
- Platform config (`/platform/*`)
- Catalog (`/products`, `/categories`, `/catalog/search`, `/vendors`)
- Service marketplace (`/services`, `/providers`, service bookings)
- Blog, Projects, B2B directory
- Affiliate (public click/resolve + dashboard)
- Cart, Auth, Admin auth
- Authenticated customer (`auth:sanctum`): checkout, orders, payments, returns, chat, loyalty, profile, notifications
- Admin panel (`auth:admin`): users, vendors, providers, finance, shipping, analytics, chat moderation, B2B, CMS, loyalty admin
- Vendor / Provider / Affiliate dashboards (`role:*` middleware)

### Configuration defaults vs production intent

| Setting | `config/*.php` default | `backend/.env` (local) | `.env.example` |
|---------|------------------------|------------------------|----------------|
| `CACHE_STORE` | `database` | **redis** | redis |
| `QUEUE_CONNECTION` | `database` | **redis** | redis |
| `SESSION_DRIVER` | `database` | **database** | database |

Production enforcement: `config/diyar.php` → `enforce_redis_in_production` defaults **true**.

### Database

- **93 migration files** in `backend/database/migrations/`
- Local `.env` uses **MySQL** (`diyar` database); CI PHPUnit uses **sqlite in-memory**

### Jobs / queues (sample)

`backend/app/Jobs/` includes notification delivery, payment webhooks, chat archive, admin audit — all `ShouldQueue`.

Health probes: `PlatformHealthService` probes database, cache, queue, payments (`backend/app/Services/Infrastructure/PlatformHealthService.php`).

---

## 4. Frontend architecture (evidence)

- **SPA:** React 19 + React Router 7 + TanStack Query 5 + Axios
- **State:** Context providers (auth, cart, locale, etc.)
- **API layer:** `frontend/src/api/*` + `frontend/src/lib/csrf.ts` (Sanctum stateful)
- **Admin:** separate shell under `/admin`
- **Realtime:** Laravel Echo + Pusher-js (Reverb)

### Tests

| Type | Count | Location |
|------|-------|----------|
| Vitest | 25 files | `frontend/src/**/*.test.{ts,tsx}` |
| Playwright E2E | 15 specs | `frontend/e2e/*.spec.ts` |
| k6 performance | 4 scripts | `scripts/performance/` |

---

## 5. Automated test suite (PHPUnit)

| Suite | Files |
|-------|-------|
| Feature | 128 |
| Unit | 15 |
| **Total** | **143** |

PHPUnit env (`phpunit.xml`): `CACHE_STORE=array`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=array` — **does not exercise Redis**.

Key feature areas under `backend/tests/Feature/Api/V1/`: Auth, Catalog, Cart, Checkout, Coupons, Shipping, Payments, B2B, Blog, Loyalty, Returns, ServiceMarketplace, Analytics, Admin, Security.

---

## 6. CI/CD (`.github/workflows/`)

| Workflow | Triggers | Notable jobs |
|----------|----------|--------------|
| `ci.yml` | push/PR `main`, `dev` | Frontend lint/test/build; Playwright E2E (Redis service); k6 analytics; PHPUnit + Pint |
| `performance.yml` | weekly + manual | k6 smoke + Octane stack |
| `staging-deploy.yml` | push `dev` | Staging validation |
| `messaging-integration.yml` | PR backend paths | MySQL + Redis integration |
| `deploy-pages.yml` | push `main` | GitHub Pages frontend |
| `npm-publish-github-packages.yml` | release | Package publish |

---

## 7. Deployment artifacts

- **Render:** `render.yaml` — API, Reverb, 4 queue workers, scheduler; Redis env vars on all services
- **Docker:** `backend/Dockerfile.octane` (PHP 8.3 + redis + swoole)
- **Nginx:** `deploy/nginx/production.conf.example`
- **Supervisor:** `deploy/supervisor/diyar-notifications.conf`

---

## 8. Prior performance / hardening work (historical)

| Doc | Claim | Verification status |
|-----|-------|---------------------|
| Stage 22 `LOAD_TEST_RESULTS.md` | Load test code complete | **25K VUs NOT VERIFIED** (per README) |
| Stage 17/18/26 PERFORMANCE.md | Various optimizations documented | Requires re-benchmark in Stage 28.7 |
| k6 CI smoke | 5→20 VU analytics profile | Measured in CI; p95 ~2s on GitHub runners (recent runs) |

---

## 9. Technical debt markers

| Search | Result |
|--------|--------|
| `TODO` / `FIXME` in `backend/**/*.php` | **0** literal markers |
| `TODO` / `FIXME` in `frontend/src/**/*.{ts,tsx}` | **0** literal markers |

Incidental matches in i18n phone-format strings — not dev debt.

---

## 10. Gaps / risks identified (discovery only — not yet tested)

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| D-01 | Config PHP defaults still `database` for cache/queue if `.env` missing | P2 | Document in deployment checklist |
| D-02 | PHPUnit/CI backend job does not use Redis — production Redis paths less covered in unit tests | P2 | Test in Phase 28.11 |
| D-03 | `DIYAR_API_VERSION` / `DIYAR_STAGE` env defaults stale in `config/diyar.php` | P4 | Cosmetic |
| D-04 | Local PHP 8.4 vs composer constraint `^8.3` | P3 | Align in ENVIRONMENT.md |
| D-05 | Stage 20 Security marked PARTIAL in root README | P1 | Re-verify in Phase 28.6 |
| D-06 | Stage 22 25K load **NOT VERIFIED** | P2 | Phase 28.7 |
| D-07 | `composer dev` active — concurrent workers may affect local benchmarks | P3 | Note for baseline |

---

## 11. Redis configuration status

**Requirement:** Cache + Queue on Redis; Sessions on database.

**Local `backend/.env` (verified):**

```env
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=database
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**Infrastructure:** `docker-compose.dev.yml` — Redis 7-alpine on port 6379 (container healthy).

Full verification results: [REDIS_VERIFICATION.md](./REDIS_VERIFICATION.md)

---

## 12. Discovery conclusion

The repository contains a **mature, multi-domain marketplace** with extensive PHPUnit coverage, Playwright E2E, k6 smoke scripts, and production deployment templates. Stage 28 documentation did not exist prior to this audit.

**Ready to proceed:** Phase 28.1 baseline establishment.  
**Blockers cleared:** Redis cache + queue configured and verified locally.
