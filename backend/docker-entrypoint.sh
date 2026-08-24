#!/bin/sh
set -e

php artisan package:discover --ansi

if [ -z "${APP_KEY:-}" ]; then
  echo "FATAL: APP_KEY is not set. Generate with: php artisan key:generate --show"
  exit 1
fi

if [ "${DIYAR_MIGRATE_ON_BOOT:-false}" = "true" ]; then
  php artisan migrate --force
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache

exec php artisan octane:start \
  --server=swoole \
  --host=0.0.0.0 \
  --port="${PORT:-8000}" \
  --workers="${OCTANE_WORKERS:-4}" \
  --task-workers="${OCTANE_TASK_WORKERS:-2}" \
  --max-requests="${OCTANE_MAX_REQUESTS:-500}"
