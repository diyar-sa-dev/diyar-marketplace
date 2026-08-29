#!/usr/bin/env bash
# Run PHPUnit with MySQL 8 for index EXPLAIN and engine-parity tests
set -euo pipefail
export DIYAR_LOADTEST_MODE=false
export DB_CONNECTION=mysql
export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-3306}"
export DB_DATABASE="${DB_DATABASE:-diyar_test}"
export DB_USERNAME="${DB_USERNAME:-root}"
export DB_PASSWORD="${DB_PASSWORD:-root}"
cd "$(dirname "$0")/../backend"
php artisan test "$@"
