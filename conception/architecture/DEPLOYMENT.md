# DIYAR — Deployment Architecture

> **Stage:** 0

## Environments

| Env | Frontend | Backend | Database |
|-----|----------|---------|----------|
| Local | Vite dev :3000 | Laravel :8000 | MySQL local |
| Staging | CDN/staging URL | staging API | Staging MySQL |
| Production | app.diyar.sa | api.diyar.sa | Managed MySQL |

## V1 Infrastructure

- **No Redis** — Laravel file/database cache, database queue
- **No Kubernetes** — single VPS or Laravel Forge acceptable
- **S3-compatible storage** for production media

## CI/CD (target)

| Component | Pipeline |
|-----------|----------|
| Frontend | GitHub Actions: lint, build, deploy static |
| Backend | GitHub Actions: pint, pest, deploy (Stage 1+) |

Current: `deploy-pages.yml` builds root — **updated to `frontend/`**

## Process Requirements

- PHP-FPM + Nginx for API
- Queue worker: `php artisan queue:work --tries=3`
- Scheduler cron: `* * * * * php artisan schedule:run`
- Supervisor recommended for queue in production

## SSL

TLS required on both frontend and API domains.

## Monitoring (Stage 22+)

- Sentry for errors
- Uptime monitoring on API health endpoint
