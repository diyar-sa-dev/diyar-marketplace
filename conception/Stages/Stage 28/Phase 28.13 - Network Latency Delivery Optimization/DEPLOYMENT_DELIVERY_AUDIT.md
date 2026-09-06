# Deployment Delivery Audit — Phase 28.13 Re-Audit

**Date:** 2026-08-29

## Nginx template (`deploy/nginx/production.conf.example`)

| Feature | Status |
|---------|--------|
| gzip compression | ✅ Documented |
| Brotli | ⏸ Optional (module-dependent) |
| Immutable hashed assets | ✅ `Cache-Control: public, max-age=31536000, immutable` |
| HTML no-cache | ✅ Prevents stale chunk references |
| `/storage/` media TTL | ✅ Short public cache |
| Security headers | ✅ X-Content-Type-Options, frame options, etc. |
| API proxy to PHP-FPM | ✅ |
| Client body size | ✅ Upload limits |

## E2E bootstrap script

`scripts/e2e/bootstrap-stack.ps1`:
1. Delete + recreate sqlite file (prevents corruption)
2. `migrate:fresh --seed` with E2E env vars
3. Build frontend
4. Instructions for API + preview + Playwright

**Critical order:** seed → restart API → restart preview → run Playwright

## Environment tiers

| Tier | Required | Recommended | Optional |
|------|----------|-------------|----------|
| VPS (Hostinger) | PHP 8.2+, MySQL 8, Nginx, bcmath, openssl, mbstring, tokenizer, xml, ctype, json, fileinfo | Redis, OPcache, queue worker | CDN, Brotli, Octane |
| Docker | Same as VPS | Redis service | CDN |
| Limited host | PHP-FPM, MySQL, Nginx | — | Redis, CDN, queue |
| E2E local | sqlite, array cache, `DIYAR_LOADTEST_MODE=true` | serial Playwright workers | Redis |

## Loadtest mode (E2E / performance only)

`DIYAR_LOADTEST_MODE=true`:
- Disables named route rate limiters
- Bypasses AuthService credential login throttle (28.13 fix)
- **Never enable in production**

## Hostinger compatibility

- No Docker-only runtime assumptions in delivery layer
- Graceful degradation: array cache fallback, sync queue
- Storage symlink documented in DEPLOYMENT_REQUIREMENTS.md
