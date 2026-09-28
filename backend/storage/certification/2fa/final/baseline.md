# DIYAR 2FA — Docker Production Baseline

**Captured:** 2026-09-11T09:27:00Z  
**Git commit:** `257a7a719e5236272ff9e057b81e3fd68805d1e9`  
**Compose project:** `diyar-production`

## Containers

| Container | Image | Status | Public ports |
|-----------|-------|--------|--------------|
| diyar-production-nginx-1 | nginx:1.27-alpine | healthy | 8093→80 |
| diyar-production-app-1 | diyar-production-app | healthy | internal 9000 |
| diyar-production-mysql-1 | mysql:8.0 | healthy | internal only |
| diyar-production-redis-1 | redis:7-alpine | healthy | internal only |
| diyar-production-reverb-1-1 | diyar-production-reverb-1 | healthy | internal |
| diyar-production-reverb-2-1 | diyar-production-reverb-2 | healthy | internal |
| diyar-production-queue-critical-1 | diyar-production-queue-critical | unhealthy | internal |
| diyar-production-queue-default-1 | diyar-production-queue-default | unhealthy | internal |
| diyar-production-scheduler-1 | diyar-production-scheduler | unhealthy | internal |

## Runtime

- **PHP:** 8.3.33 (FPM)
- **Laravel:** 13.26.1
- **API URL (cert):** http://127.0.0.1:8093/api/v1
- **Image created:** 2026-09-11T09:19:33Z (post 2FA rebuild)

## Topology

```
Internet/Host → nginx:8093 → PHP-FPM app → MySQL + Redis
                              Reverb ×2 (WS via nginx /app/)
                              Queue workers ×2, Scheduler ×1
```

MySQL and Redis are not published to the host.

## Actions taken during certification

1. Rebuilt `diyar-production-app` image with 2FA backend code
2. Applied migration `2026_09_11_100000_add_two_factor_to_users_table`
3. Verified 6 two-factor API routes present in container
4. Set `LOG_LEVEL=info` in local production.env for log-provider OTP evidence (local docker only)
5. Updated `docker-compose.production.yml` to honor `${LOG_LEVEL:-warning}`
