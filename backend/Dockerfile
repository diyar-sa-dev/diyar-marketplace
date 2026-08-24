FROM php:8.3-cli-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    pkg-config \
    libzip-dev \
    libicu-dev \
    libsqlite3-dev \
    libssl-dev \
    && docker-php-ext-install pdo_mysql pdo_sqlite zip intl pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN mkdir -p storage/logs storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# Avoid booting Laravel during image build (env vars are injected at runtime on Render).
ENV APP_ENV=local \
    DIYAR_ENFORCE_REDIS_IN_PRODUCTION=false \
    CACHE_STORE=array \
    QUEUE_CONNECTION=sync

RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev --ignore-platform-reqs --no-scripts

EXPOSE 8000

# migrate --force on boot: Render free tier has no Shell; safe to re-run (tracks migrations table).
CMD ["sh", "-c", "php artisan package:discover --ansi && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
