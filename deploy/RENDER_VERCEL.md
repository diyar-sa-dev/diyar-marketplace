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
SESSION_SAME_SITE=none
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

**Backups (Render FREE):** automatic PostgreSQL backups may be unavailable on free plans. Schedule external `pg_dump` before claiming production backup readiness.

Redeploy API after changing env vars.

## 4. Validate

```bash
curl https://<api>/api/v1/health
php artisan diyar:validate-environment   # on Render shell
```

## 5. Future VPS (Hostinger)

- Nginx serves SPA + proxies `/api` to PHP-FPM/Octane.
- Use `VITE_API_URL=/api/v1` and `SESSION_SAME_SITE=lax`.
- See `deploy/nginx/production.conf.example`.
