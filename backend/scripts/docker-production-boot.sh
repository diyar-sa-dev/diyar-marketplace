#!/bin/sh
set -e

# Container boot — discover packages, ensure writable dirs, optional migrate wait.
php artisan package:discover --ansi 2>/dev/null || true

mkdir -p \
  storage/logs \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/app/public/media \
  bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Host `php artisan storage:link` on Windows creates a junction that breaks inside Linux containers.
if [ -L public/storage ] && [ ! -e public/storage ]; then
  rm -f public/storage
fi
if [ ! -e public/storage ]; then
  ln -snf ../storage/app/public public/storage 2>/dev/null || true
fi

if [ "${RUN_MIGRATIONS_ON_BOOT:-false}" = "true" ]; then
  php artisan migrate --force --no-interaction
fi

if [ "${WARM_CACHES_ON_BOOT:-false}" = "true" ]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
fi

exec "$@"
