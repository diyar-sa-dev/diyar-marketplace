# DIYAR — Deployment Architecture

> **Updated:** 2026-08-23 (Stages 22–24)

## Environments

| Env | Frontend | API | Database | Redis | Storage |
|-----|----------|-----|----------|-------|---------|
| Local | Vite `:3000` | Laravel `:8000` | MySQL or SQLite | Optional | `local` disk |
| Staging | `staging.diyar.sa` | `staging-api.diyar.sa` | `diyar_staging` | Prefix `diyar-staging-` | `diyar-staging-media` |
| Production | `diyar.com`, `admin.diyar.com` | `api.diyar.com` | `diyar_production` | Prefix `diyar-production-` | Production bucket |

Domains are **environment variables** — never hardcoded in application code.

## V1 stack

```
Internet
  ↓
CDN / Nginx (TLS, gzip, static caching)
  ↓
React SPA (hashed assets, code-split routes)
  ↓
Laravel API (/api/v1)
  ↓
MySQL 8 (authoritative)
  ↓
Redis (cache, queues, rate limits)
  ↓
S3-compatible object storage (media)
```

Workers: Laravel → Redis queues → Supervisor (`deploy/workers/README.md`)

## Redis (required staging/production)

- `CACHE_STORE=redis`
- `QUEUE_CONNECTION=redis`
- `REDIS_PREFIX` per environment
- Boot guard: `DIYAR_ENFORCE_REDIS_IN_PRODUCTION=true`

Database `cache` / `jobs` tables remain for dev/test fallback — not used when Redis is configured.

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push/PR `main`,`dev` | lint, test, build, E2E |
| `staging-deploy.yml` | push `dev`, manual | staging validation + smoke |
| `performance.yml` | manual/schedule | k6 load profiles |
| `deploy-pages.yml` | push `main` | static SPA demo (not production API) |

## Observability

- Correlation ID: `X-Request-Id` middleware on all API requests
- Health: `/api/v1/health`
- Readiness: `/api/v1/readiness` (DB + cache + queue)
- Environment validation: `php artisan diyar:validate-environment`

## SSL / headers

TLS on all public endpoints. `SecurityHeaders` middleware: HSTS, X-Content-Type-Options, Permissions-Policy.

## Monitoring targets

API p95 latency, error rate, DB pool, Redis latency, queue depth, failed jobs, uptime on `/readiness`.

## Load testing

k6 profiles in `scripts/performance/`. **25K VUs requires staging infrastructure** — see `conception/Stages/Stage 22/LOAD_TEST_RESULTS.md`.
