#!/usr/bin/env bash
# Render web start — prefer Octane when available; never treat artisan serve as production-grade.
set -euo pipefail

PORT="${PORT:-8000}"

if php -r "exit(class_exists('Laravel\\Octane\\Octane') ? 0 : 1);" 2>/dev/null; then
  if php -m 2>/dev/null | grep -qi swoole; then
    echo "[diyar] Starting Octane (Swoole) on port ${PORT}" >&2
    exec php artisan octane:start \
      --server=swoole \
      --host=0.0.0.0 \
      --port="${PORT}" \
      --workers="${OCTANE_WORKERS:-2}" \
      --task-workers="${OCTANE_TASK_WORKERS:-1}" \
      --max-requests="${OCTANE_MAX_REQUESTS:-500}"
  fi

  if php -m 2>/dev/null | grep -qi frankenphp; then
    echo "[diyar] Starting Octane (FrankenPHP) on port ${PORT}" >&2
    exec php artisan octane:start \
      --server=frankenphp \
      --host=0.0.0.0 \
      --port="${PORT}" \
      --workers="${OCTANE_WORKERS:-2}" \
      --max-requests="${OCTANE_MAX_REQUESTS:-500}"
  fi
fi

echo "[diyar] WARNING: Octane unavailable — falling back to artisan serve (STAGING/DEMO ONLY)." >&2
echo "[diyar] Use Hostinger VPS (Nginx + PHP-FPM) or Render Docker for production traffic." >&2
exec php artisan serve --host=0.0.0.0 --port="${PORT}"
