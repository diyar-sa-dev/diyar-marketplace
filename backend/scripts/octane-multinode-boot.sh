#!/bin/sh
set -e
cp .env.loadtest.example .env
sed -i 's/^DB_HOST=.*/DB_HOST=mysql/' .env
sed -i 's/^DB_PORT=.*/DB_PORT=3306/' .env
sed -i 's/^DB_DATABASE=.*/DB_DATABASE=diyar_multinode/' .env
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=multinode/' .env
sed -i 's/^REDIS_HOST=.*/REDIS_HOST=redis/' .env
sed -i 's/^QUEUE_CONNECTION=.*/QUEUE_CONNECTION=redis/' .env
sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=redis/' .env
sed -i 's/^CACHE_STORE=.*/CACHE_STORE=redis/' .env
sed -i 's/^DIYAR_HEALTH_PROBE_CACHE_SECONDS=.*/DIYAR_HEALTH_PROBE_CACHE_SECONDS=0/' .env
sed -i 's|^APP_KEY=.*|APP_KEY=base64:2fl+KtvkblFZiGZtacP1ZAwJfvyIZxSzUI/qpgQHoW0=|' .env
php artisan package:discover --ansi
mkdir -p storage/logs storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache
