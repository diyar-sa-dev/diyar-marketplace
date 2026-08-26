#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND="$ROOT/backend"

cd "$BACKEND"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

php artisan key:generate --force --no-interaction >/dev/null 2>&1 || php artisan key:generate --force

php -r "
\$env = file_get_contents('.env');
\$env = preg_replace('/^DB_CONNECTION=.*/m', 'DB_CONNECTION=sqlite', \$env);
\$env = preg_replace('/^DB_DATABASE=.*/m', 'DB_DATABASE=database/database.sqlite', \$env);
\$env = preg_replace('/^CACHE_STORE=.*/m', 'CACHE_STORE=redis', \$env);
\$env = preg_replace('/^QUEUE_CONNECTION=.*/m', 'QUEUE_CONNECTION=sync', \$env);
\$env = preg_replace('/^DIYAR_PAYMENT_USE_FAKE_GATEWAY=.*/m', 'DIYAR_PAYMENT_USE_FAKE_GATEWAY=true', \$env);
file_put_contents('.env', \$env);
"

mkdir -p database
touch database/database.sqlite

export APP_ENV=local
export APP_DEBUG=true
export DB_CONNECTION=sqlite
export DB_DATABASE="$BACKEND/database/database.sqlite"
export CACHE_STORE="${CACHE_STORE:-redis}"
export QUEUE_CONNECTION="${QUEUE_CONNECTION:-sync}"
export SESSION_DRIVER=database
export DIYAR_PAYMENT_USE_FAKE_GATEWAY=true
export DIYAR_MAIL_ENABLED=false
export FRONTEND_URL=http://127.0.0.1:3000
export SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000,127.0.0.1:8000,localhost:8000
export REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
export REDIS_PORT="${REDIS_PORT:-6379}"

php artisan migrate:fresh --seed --force --no-interaction

echo "E2E backend ready (sqlite + seeded demo data)."
