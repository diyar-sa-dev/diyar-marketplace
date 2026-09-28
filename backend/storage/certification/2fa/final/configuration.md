# Sanitized Production Configuration Report

**Source:** diyar-production-app-1 runtime (2026-09-11)  
Secrets redacted.

| Setting | Value |
|---------|-------|
| APP_ENV | local |
| APP_DEBUG | false |
| DIYAR_OTP_TEST_MODE | false |
| DIYAR_OTP_PROVIDER | log (MSEGAT credentials not configured) |
| LOG_LEVEL | info (local cert; compose default is warning) |
| CACHE_STORE | redis |
| SESSION_DRIVER | redis |
| QUEUE_CONNECTION | redis |
| DB_HOST | mysql |
| DB_DATABASE | diyar_production_local |
| REDIS_HOST | redis |
| REDIS_PREFIX | diyar-prodlocal- |
| BROADCAST_CONNECTION | reverb |
| PHP | 8.3.33 |
| Laravel | 13.26.1 |
| Runtime | PHP-FPM (not Octane) |

## Production deployment requirements

For real production (`APP_ENV=production`):

- `DIYAR_OTP_TEST_MODE=false` (mandatory)
- MSEGAT SMS credentials configured (`MSEGAT_*` env vars)
- `LOG_LEVEL=warning` (OTP plaintext must not appear in logs)
- `APP_DEBUG=false`
- `SESSION_SECURE_COOKIE=true` when served over HTTPS

## Config cache

Container boot uses live env (config not cached at time of inspection).
