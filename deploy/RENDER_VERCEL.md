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
4. Add env from `frontend/.env.production.example` (**same-origin — required for login**):
   - `VITE_API_URL=/api/v1`
   - `VITE_BACKEND_URL=` (empty)
5. Deploy.

> **Why proxy?** Vercel (`*.vercel.app`) + Render (`*.onrender.com`) are different sites. Browsers block third-party session/CSRF cookies → **419** on login. Proxying `/api` and `/sanctum` through Vercel fixes this.

## 3. Link frontend ↔ API

On **Render**, set:

```env
APP_URL=https://<your-vercel-app>.vercel.app
FRONTEND_URL=https://<your-vercel-app>.vercel.app
DIYAR_FRONTEND_URL=https://<your-vercel-app>.vercel.app
SANCTUM_STATEFUL_DOMAINS=<your-vercel-app>.vercel.app
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=
APP_KEY=base64:...   # required — php artisan key:generate --show
```

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
