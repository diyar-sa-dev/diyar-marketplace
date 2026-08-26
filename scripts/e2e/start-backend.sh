#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

bash "$ROOT/scripts/e2e/bootstrap-backend.sh"

cd "$ROOT/backend"
export APP_ENV=local
export DB_CONNECTION=sqlite
export DB_DATABASE="$ROOT/backend/database/database.sqlite"
export CACHE_STORE="${CACHE_STORE:-redis}"
export QUEUE_CONNECTION=sync
export REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
export REDIS_PORT="${REDIS_PORT:-6379}"
export DIYAR_PAYMENT_USE_FAKE_GATEWAY=true
export DIYAR_LOADTEST_MODE=true

exec php artisan serve --host=127.0.0.1 --port=8000 --no-reload
