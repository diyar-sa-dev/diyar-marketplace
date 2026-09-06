# Deployment Requirements — Phase 28.13

## VPS (Hostinger) checklist

### Stack
- [ ] MySQL 8.0
- [ ] Redis 7
- [ ] PHP 8.2+ with opcache enabled
- [ ] Nginx + PHP-FPM
- [ ] Supervisor for queue workers (`deploy/workers/`)

### Frontend deploy
```bash
cd frontend && npm ci && npm run build
rsync -av dist/ /var/www/diyar/frontend/dist/
```

### Backend deploy
```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan storage:link
```

### Nginx
- Copy `deploy/nginx/production.conf.example` → `/etc/nginx/sites-available/diyar`
- Set SSL paths (Let's Encrypt)
- Reload Nginx

### Environment
```env
APP_ENV=production
CACHE_STORE=redis
SESSION_DRIVER=database
QUEUE_CONNECTION=redis
DIYAR_CDN_ENABLED=false  # true when CDN ready
```

### Post-deploy verification
- [ ] `curl -I https://diyar.com/assets/index-*.js` → `immutable`
- [ ] `curl -I https://diyar.com/` → `no-cache`
- [ ] `curl -I https://api.diyar.com/api/v1/categories` → `public, max-age=60` (no cookies)
- [ ] Playwright smoke against staging URL

## Demo showcase

- Use sqlite seeded stack locally OR staging VPS
- Credentials: `DIYAR_DEMO_PASSWORD` from seeders
- Ports: frontend :3000, API :8000

## Optional CDN rollout

See `CDN_AUDIT.md` — enable after VPS baseline is stable.
