# Deployment Runbook — Phase 28.14

## Pre-deploy checklist

```bash
php artisan diyar:validate-environment
php artisan diyar:validate-php-runtime
```

Ensure `DIYAR_LOADTEST_MODE=false`, `APP_DEBUG=false`, Redis + MySQL reachable.

## Release flow

See `scripts/deploy/deploy-release.sh`:

1. Deploy artifact to `releases/<timestamp>/`
2. Link shared `.env` + `storage/`
3. Validate environment + PHP runtime
4. `composer install --no-dev`
5. `php artisan migrate --force` (never `migrate:fresh`)
6. `config:cache`, `route:cache`, `view:cache`
7. Build frontend (`npm ci && npm run build`)
8. Symlink `current` → new release
9. Reload PHP-FPM, restart Supervisor workers, reload Nginx
10. Smoke: `/api/v1/health/live`, `/api/v1/health/ready`
11. Keep last 3 releases for lazy-chunk compatibility

## Post-deploy smoke

```bash
bash scripts/staging/smoke.sh
```

## Rollback

```bash
ln -sfn /var/www/diyar/releases/<previous> /var/www/diyar/current
sudo systemctl reload php8.2-fpm
sudo supervisorctl restart all
sudo nginx -t && sudo systemctl reload nginx
```

## Cron (production)

```cron
* * * * * cd /var/www/diyar/current/backend && php artisan schedule:run >> /dev/null 2>&1
```

## Workers (Supervisor)

Install `deploy/supervisor/diyar-notifications.conf` — 6 programs (critical, high, broadcast, chat, reverb, scheduler).
