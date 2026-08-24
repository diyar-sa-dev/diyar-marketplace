#!/bin/sh
set -e

php artisan package:discover --ansi

# Runtime bootstrap (Render injects env at container start, not at Docker build).
if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY missing — generating ephemeral key (set APP_KEY in Render env to keep sessions stable)."
  php artisan key:generate --force
fi

php artisan migrate --force

if [ "${DIYAR_SEED_ON_BOOT:-false}" = "true" ]; then
  php artisan db:seed --force
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache

if php artisan list --raw 2>/dev/null | grep -q '^octane:start'; then
  exec php artisan octane:start \
    --server=swoole \
    --host=0.0.0.0 \
    --port="${PORT:-8000}" \
    --workers="${OCTANE_WORKERS:-4}" \
    --task-workers="${OCTANE_TASK_WORKERS:-2}" \
    --max-requests="${OCTANE_MAX_REQUESTS:-500}"
fi

echo "Octane unavailable — falling back to php artisan serve (single-threaded)."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
