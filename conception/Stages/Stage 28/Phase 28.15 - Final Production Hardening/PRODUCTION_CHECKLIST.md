# Phase 28.15 — Production Checklist

Use before every production release.

## Pre-deploy

- [ ] `git` release tag created; changelog reviewed
- [ ] `php artisan diyar:validate-php-runtime` — BCMath + PDO present
- [ ] `APP_ENV=production`, `APP_DEBUG=false` on server `.env`
- [ ] `DIYAR_LOADTEST_MODE` unset or `false`
- [ ] `DIYAR_PAYMENT_USE_FAKE_GATEWAY=false`
- [ ] Secrets rotated if compromised; `.env` not in web root
- [ ] Nginx: `.env`, `.git`, backup deny rules active (`deploy/nginx/production.conf.example`)
- [ ] OPcache + PHP-FPM pool sized for VPS tier (`deploy/php/`)

## Deploy

- [ ] Run `scripts/deploy/deploy-release.sh` (never `migrate:fresh`)
- [ ] `php artisan migrate --force`
- [ ] `php artisan config:cache`, `route:cache`, `view:cache`
- [ ] Symlink switch to new release
- [ ] Restart PHP-FPM, queue workers (Supervisor)
- [ ] Health: `GET /up` → 200
- [ ] Readiness: `GET /api/v1/platform/readiness` → status ok/degraded with checks

## Post-deploy smoke

- [ ] Login / logout (customer + vendor + admin)
- [ ] Catalog home + product detail
- [ ] Cart → checkout preview → payment webhook path
- [ ] Admin dashboard loads
- [ ] CDN assets load (if `VITE_CDN_BASE_URL` set)
- [ ] Queue worker processing (test notification or deferred job)
- [ ] Redis connectivity (cache + queue if configured)

## Rollback

- [ ] Previous release symlink available
- [ ] DB migrations reversible or forward-fix documented
- [ ] Worker restart after rollback

## Monitoring

- [ ] Application logs shipping (structured JSON where configured)
- [ ] Request correlation ID present in logs
- [ ] Payment failure alerts configured
- [ ] Queue failed jobs monitored (`failed_jobs` table)
