# PHP-FPM & OPcache Audit — Phase 28.14

## BCMath requirement

**40+ backend files** use `bcadd`, `bcsub`, `bcmul`, `bcdiv`, `bccomp` for financial math.

Verification: `php artisan diyar:validate-php-runtime` — **bcmath required**.

## PHP-FPM profiles

| Profile | RAM | max_children | File |
|---------|-----|--------------|------|
| Small | 2 GB | 10 | `deploy/php/fpm-pool-small.conf.example` |
| Medium | 4 GB | 20 | `deploy/php/fpm-pool-medium.conf.example` |
| Large | 8 GB | 36 | `deploy/php/fpm-pool-large.conf.example` |

Shared settings:
- `request_terminate_timeout = 120s` (matches queue job timeout)
- `upload_max_filesize = 12M` (matches Nginx `client_max_body_size`)
- `pm.max_requests = 500–1000` (recycle workers)

## OPcache (production)

| Setting | Value | Rationale |
|---------|-------|-----------|
| `opcache.enable` | 1 | Required for production performance |
| `opcache.validate_timestamps` | 0 | No stale bytecode in prod |
| `opcache.memory_consumption` | 192 MB | Laravel + vendor |
| `opcache.jit` | 0 | Not enabled — measure before enabling |
| `opcache.max_accelerated_files` | 20000 | Large codebase headroom |

**Deploy note:** reload PHP-FPM after deploy when `validate_timestamps=0`.

## Docker FPM image

`backend/Dockerfile.fpm` includes: bcmath, intl, pdo_mysql, redis, opcache, zip.
