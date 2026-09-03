# Deploy: Vercel (frontend) + Render (API)

V1 split hosting. Later migrate to Hostinger VPS with Nginx same-origin (`VITE_API_URL=/api/v1`).

## 1. Render (Laravel API)

1. Create **MySQL** and **Redis** on Render (or external providers).
2. New **Blueprint** from repo `render.yaml`, or manual Web Service:
   - Root: `backend`
   - Build: `composer install --optimize-autoloader && php artisan migrate --force`
   - Start: `bash scripts/render-web-start.sh` (Octane when Swoole/FrankenPHP exists; otherwise `artisan serve` with **STAGING ONLY** warning)
3. **Render Free is not production-grade** — spin-down, 512 MB, no paid workers. Use for demo/staging only.
4. **Production API** should run on **Hostinger VPS (Nginx + PHP-FPM)** or **paid Render** with always-on workers.

## 2. Vercel (React SPA)

1. Import repo; set **Root Directory** to `frontend`.
2. Framework: Vite (uses `frontend/vercel.json`).
3. Add env from `frontend/.env.production.example`:
   - `VITE_API_URL=https://<your-render-api>/api/v1`
   - `VITE_BACKEND_URL=https://<your-render-api>`
4. Deploy.

## 3. Link frontend ↔ API

On **Render**, set:

```env
FRONTEND_URL=https://<your-vercel-app>.vercel.app
SANCTUM_STATEFUL_DOMAINS=<your-vercel-app>.vercel.app
DIYAR_FRONTEND_URL=https://<your-vercel-app>.vercel.app
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
```

Redeploy API after changing CORS/Sanctum vars.

## 4. Validate

```bash
curl https://<api>/api/v1/health
php artisan diyar:validate-environment   # on Render shell
```

## 5. Future VPS (Hostinger)

- Nginx serves SPA + proxies `/api` to PHP-FPM/Octane.
- Use `VITE_API_URL=/api/v1` and `SESSION_SAME_SITE=lax`.
- See `deploy/nginx/production.conf.example`.
