# Stage 25 — V1 Production Release (prod-temp)

**Branch:** `prod-temp` (tracks `origin/main` deploy repo)  
**Status:** PARTIAL — code implemented; full INFRASTRUCTURE-VERIFIED pending Render PostgreSQL + redeploy  
**Date:** 2026-08-24

## Repository audit

| Item | Value |
|------|--------|
| Local branch | `prod-temp` @ `70a09bd` (pre-commit baseline) |
| Deploy remote | `origin` → https://github.com/yacinekermame-kaaado/diyar |
| Team remote | `diyar` → https://github.com/diyar-sa-dev/diyar-marketplace |
| `dev` branch | MySQL — **unchanged** |
| `prod-temp` DB target | **PostgreSQL** (Render) |

## Branch isolation

- **DEV:** MySQL, local Redis, `.env.example` unchanged (`DB_CONNECTION=mysql`)
- **PROD-TEMP:** PostgreSQL via env + `render.yaml`, `docker-compose.pgsql.yml`, `.env.production.example`
- No hardcoded production DB driver in application logic — `SqlDialect` helper for portable SQL

## PostgreSQL migration (IMPLEMENTED)

| Fix | File |
|-----|------|
| `DATE_FORMAT` → driver-aware month expression | `SqlDialect.php`, `AffiliateDashboardService.php` |
| JSON `LIKE` on materials removed | `ProductService.php` |
| MySQL `information_schema.statistics` → `Schema::hasIndex()` | `2026_08_17_090000_add_color_to_cart_items_table.php` |
| `pdo_pgsql` in Docker | `Dockerfile`, `Dockerfile.octane` |
| Local PG stack | `docker-compose.pgsql.yml` |
| CI migrate smoke | `.github/workflows/ci.yml` → `backend-pgsql` job |

**DEFERRED:** Full feature test suite on PostgreSQL in CI (smoke: migrate + HealthEndpointTest only). Manual `migrate:fresh --seed` on Render PG required before marking COMPLETE.

## Render FREE optimization (IMPLEMENTED)

| Change | Rationale |
|--------|-----------|
| `render.yaml` → Docker + Octane | Replaces single-threaded `artisan serve` |
| `healthCheckPath: /up` | Lightweight liveness (was heavy `/api/v1/health`) |
| `DIYAR_MIGRATE_ON_BOOT=false` | Avoid cold-start migration penalty |
| `OCTANE_WORKERS=2` | Fits FREE tier RAM |
| `DIYAR_HEALTH_PROBE_CACHE_SECONDS=45` | Reduces DB/Redis probe load |
| `DB_CONNECTION=pgsql` in blueprint | prod-temp production target |

**INFRASTRUCTURE-VERIFIED limitations (honest):**

- Render FREE web sleeps → 30–60s cold starts
- Worker service is separate paid tier
- Render PostgreSQL FREE has limited backup — document manual `pg_dump` procedure
- No measured 25K VU capacity on FREE tier

## Vercel optimization (IMPLEMENTED)

- Direct Render API URL documented (`VITE_API_URL=https://…onrender.com/api/v1`) — avoids ~60s proxy 408
- `vercel.json` asset immutable cache headers
- CSRF JSON token flow (prior commits)
- React Query: categories 15m, products 2m, product detail 3m, vendor 5m staleTime

## Redis / cache (IMPLEMENTED)

- Category tree cache 15min (`CategoryService`, invalidates on CRUD)
- Existing: search facets, suggestions, effective config, affiliate dashboard

## Security (PASS — no weakening)

- CSRF JSON token + explicit header on auth
- Session isolation unchanged
- No auth data in cache keys

## V1 checklist summary

See `STAGE_25_V1_CHECKLIST.md` for item-by-item PASS/PARTIAL/FAIL with evidence.

**Release verdict:** **PARTIAL COMPLETE** — ready for redeploy after:

1. Provision Render PostgreSQL
2. Set Vercel env to direct Render API URL
3. Run `php artisan migrate --force` on Render PG
4. Seed staging only (never production auto-seed)
5. Verify login + catalog + checkout smoke on live URLs

## Environment matrix

| | DEV | STAGING | PRODUCTION (prod-temp) |
|--|-----|---------|------------------------|
| DB | MySQL | PostgreSQL (optional compose) | Render PostgreSQL |
| API | local | Render/staging | Render Docker/Octane |
| Frontend | Vite proxy | Vercel | Vercel |
| Redis | local | staging | Upstash/Render |
| Debug | on | off | off |
| Demo seed | yes | controlled | **never** |

## Backup (DEFERRED)

Render FREE PostgreSQL may lack automatic backups. Procedure documented in `deploy/RENDER_VERCEL.md` — use scheduled `pg_dump` to external storage before claiming backup PASS.
