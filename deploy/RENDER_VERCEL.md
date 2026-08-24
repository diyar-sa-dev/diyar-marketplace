# Deploy: Vercel (frontend) + Render (API)

V1 split hosting. Later migrate to Hostinger VPS with Nginx same-origin (`VITE_API_URL=/api/v1`).

## 1. Render (Laravel API)

1. Create **MySQL** and **Redis** on Render (or external providers).
2. New **Blueprint** from repo `render.yaml`, or manual Web Service:
   - Root: `backend`
   - Build: `composer install --no-dev --optimize-autoloader && php artisan migrate --force`
   - Start: `php artisan serve --host=0.0.0.0 --port=$PORT`
3. Copy env from `backend/.env.production.example` into Render environment.
4. Set `APP_URL` to your Render API URL (e.g. `https://diyar-api.onrender.com`).
5. Run once after first deploy: `php artisan migrate --force` (Render shell).
6. Add **Worker** service: `php artisan queue:work redis --sleep=3 --tries=3`.

## 2. Vercel (React SPA)

1. Import repo; set **Root Directory** to `frontend`.
2. Update `frontend/vercel.json` — set `destination` to your Render API URL (`https://<service>.onrender.com`).
3. Framework: Vite (uses `frontend/vercel.json` proxy rewrites).
4. Add env (**recommended — direct Render API, avoids Vercel proxy 408 timeouts on cold start**):

```env
VITE_API_URL=https://<service>.onrender.com/api/v1
VITE_BACKEND_URL=https://<service>.onrender.com
```

Optional same-origin proxy (can timeout ~60s when Render is cold):

```env
VITE_API_URL=/api/v1
VITE_BACKEND_URL=
VITE_USE_API_PROXY=true
```

5. Deploy.

> **CSRF:** The API exposes `GET /api/v1/csrf-token` (JSON `{ data: { token } }`). The frontend sends that plain token as `X-XSRF-TOKEN` on mutating requests — works cross-origin without reading cookies in JS.
>
> **408 timeouts:** Vercel rewrites to Render can return **408** when login takes >~60s (Render free cold start + slow external DB). Prefer **direct `VITE_API_URL`** to Render instead of `/api/v1` proxy.

## 3. Link frontend ↔ API

On **Render**, set:

```env
APP_URL=https://diyar-k255.onrender.com
FRONTEND_URL=https://diyar-psi.vercel.app
DIYAR_FRONTEND_URL=https://diyar-psi.vercel.app
SANCTUM_STATEFUL_DOMAINS=diyar-psi.vercel.app
DB_CONNECTION=pgsql
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=
APP_KEY=base64:...   # required — php artisan key:generate --show
DIYAR_MIGRATE_ON_BOOT=false
DIYAR_HEALTH_PROBE_CACHE_SECONDS=45
```

> **500 on login / health with SPA Origin:** if `SESSION_DOMAIN` is set to the Vercel hostname while the API runs on `*.onrender.com`, Sanctum stateful session cookies crash. Keep `SESSION_DOMAIN` **empty** for split hosting.

Run migrations once after provisioning PostgreSQL:

```bash
php artisan migrate --force
```

**Render FREE has no shell.** First deploy — set ONE of these in Render env, redeploy, then disable:

```env
DIYAR_PROVISION_ON_BOOT=true   # recommended: migrate + seed in one deploy
# or
DIYAR_MIGRATE_ON_BOOT=true     # migrate only
DIYAR_SEED_ON_BOOT=true        # seed only (migrate runs automatically first)
```

> Seeding in `APP_ENV=production` skips demo users/passwords but still creates roles, categories, catalog, and system settings.

> **Blanket 500 on every data endpoint** (`/catalog/search`, `/cart`, `/csrf-token`) while `/health` returns 200 means the database is connected but **not migrated** — `/health` only opens a PDO connection. Check `data.checks.schema.missing_tables` in the health payload.

**Backups (Render FREE):** automatic PostgreSQL backups may be unavailable on free plans. Schedule external `pg_dump` before claiming production backup readiness.

Redeploy API after changing env vars.

**Octane + Redis cache:** never store Eloquent models in Redis (causes `__PHP_Incomplete_Class` / 500). Category trees use `EloquentTreeCache` (array payload). Search facets, dashboards, settings, and notifications already cache arrays/scalars only.

## 3b. Optional: Supabase PostgreSQL + Storage

Render's filesystem is **ephemeral** — uploaded product images are lost on redeploy unless you use object storage.

Recommended split for FREE tier:

| Service | Host |
|---------|------|
| API | Render |
| Frontend | Vercel |
| PostgreSQL | Render Postgres **or** Supabase (`DATABASE_URL`) |
| Redis | Upstash / Render Redis |
| Media uploads | **Supabase Storage** (S3-compatible) |

**Database:** point Render env at Supabase instead of Render Postgres:

```env
DATABASE_URL=postgresql://postgres:<password>@db.ivhlydioztriyhvzniyx.supabase.co:5432/postgres
DB_CONNECTION=pgsql
```

**Storage:** create a public bucket in Supabase, then set:

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=<supabase-s3-access-key>
AWS_SECRET_ACCESS_KEY=<supabase-s3-secret>
AWS_DEFAULT_REGION=auto
AWS_BUCKET=<bucket-name>
AWS_ENDPOINT=https://ivhlydioztriyhvzniyx.supabase.co/storage/v1/s3
AWS_USE_PATH_STYLE_ENDPOINT=true
AWS_URL=https://ivhlydioztriyhvzniyx.supabase.co/storage/v1/object/public/<bucket-name>
```

Generate S3 keys in Supabase → Project Settings → Storage → S3 connection.

## 4. Validate

```bash
curl https://<api>/api/v1/health
php artisan diyar:validate-environment   # on Render shell
```

## 5. Future VPS (Hostinger)

- Nginx serves SPA + proxies `/api` to PHP-FPM/Octane.
- Use `VITE_API_URL=/api/v1` and `SESSION_SAME_SITE=lax`.
- See `deploy/nginx/production.conf.example`.
