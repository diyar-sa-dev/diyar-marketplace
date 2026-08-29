# CDN Delivery Audit — Phase 28.13 Re-Audit

**Date:** 2026-08-29

## Configuration

| Variable | Purpose |
|----------|---------|
| `VITE_CDN_BASE_URL` | Vite `base` for hashed assets + chunk URLs |
| `DIYAR_CDN_ENABLED` | Backend CDN feature flag |
| `DIYAR_CDN_ASSETS_URL` | Optional absolute asset origin |
| `DIYAR_CDN_MEDIA_URL` | Optional media CDN origin |

## Build verification

### CDN disabled (default)

```
base: /
dist/index.html → /assets/index-*.js
```

### CDN enabled

```
VITE_CDN_BASE_URL=https://cdn.example.com npm run build
dist/index.html → https://cdn.example.com/assets/index-*.js
modulepreload + CSS + favicon → CDN origin
```

## Safety rules

- Hashed filenames provide cache busting on deploy
- HTML served from origin with `no-cache` (Nginx template) — prevents stale chunk references
- Lazy chunks inherit Vite `base` — no mixed-origin chunk failures when CDN configured consistently
- OG/favicon paths resolve against CDN base when enabled

## Nginx template

`deploy/nginx/production.conf.example`:
- `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`
- `*.html` → `no-cache` (must revalidate)
- `/storage/` → short TTL public cache for media

## Status

| Mode | Verified |
|------|----------|
| Non-CDN | ✅ Functional (E2E 72/72) |
| CDN build output | ✅ Correct absolute URLs |
| Physical CDN edge | ⏸ Deferred (P3 — Hostinger provisioning)
