# DIYAR Frontend on Vercel

## Environment variables (Production)

Use project settings → Environment Variables. All `VITE_*` values are **public** (bundled into client JS).

```
VITE_API_URL=https://api.<DOMAIN>
VITE_REVERB_HOST=realtime.<DOMAIN>
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=<REVERB_APP_KEY>
```

Staging/preview: point to staging API hosts; never production DB.

## Backend coordination

In `deploy/docker/production.env`:

```
APP_URL=https://api.<DOMAIN>
FRONTEND_URL=https://app.<DOMAIN>
SANCTUM_STATEFUL_DOMAINS=app.<DOMAIN>,www.<DOMAIN>,admin.<DOMAIN>
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
```

CORS: `config/cors.php` uses `FRONTEND_URL` / allowed origins.

## Build

```bash
cd frontend
npm ci
npm run build
```

Vercel runs build automatically; output directory: `dist`.

## SPA routing

Ensure `vercel.json` rewrites unknown paths to `index.html` for client-side routing.

## Verification checklist

- [ ] Login / logout with credentials
- [ ] CSRF cookie from `/sanctum/csrf-cookie`
- [ ] WebSocket connects to `wss://realtime.<DOMAIN>/app/<key>`
- [ ] Chat / notifications receive events
- [ ] No `localhost` in production bundle (`grep -r localhost dist/`)

## Automated test

PHPUnit: `tests/Feature/Auth/VercelCrossOriginAuthTest.php` simulates Vercel-like Origin headers.

## Playwright

Run against production build with API pointing to staging/production-like backend:

```bash
cd frontend
npm run build
npx playwright test
```
