# DIYAR Security

## Production enforcement (boot-time)

`EnvironmentSafetyValidator` throws on startup when `APP_ENV=production|staging`:

| Check | Production |
|-------|------------|
| `APP_DEBUG` | must be `false` |
| `DIYAR_LOADTEST_MODE` | must be `false` |
| `DIYAR_PAYMENT_USE_FAKE_GATEWAY` | must be `false` |
| `MYFATOORAH_TEST_MODE` | must be `false` |
| `CACHE_STORE` / `QUEUE_CONNECTION` | must be `redis` |

Staging additionally requires isolated `REDIS_PREFIX` containing `staging`.

## Network exposure

Production compose (`docker-compose.production.yml`):

- **Published:** nginx HTTP/HTTPS only (`HTTP_PORT`)
- **Internal only:** MySQL 3306, Redis 6379, PHP-FPM 9000, Reverb 8090

Multinode/loadtest compose may publish 3308/6380 for **local benchmarking only** — never use on KVM2 production.

## Trusted proxies

Laravel trusts **private Docker/host ranges only** (`App\Support\Http\TrustedProxies`), not `*`.

Override via `TRUSTED_PROXIES=10.0.0.5,192.168.1.0/24` when needed.

Nginx maps `CF-Connecting-IP` → `X-Real-IP` / `X-Forwarded-For` for Cloudflare.

**Never** trust arbitrary client-supplied `X-Forwarded-For` on direct connections.

## Secrets

- Never commit `deploy/docker/production.env`
- Never bake credentials into Docker images
- `VITE_*` variables are public (frontend bundle)
- SMTP passwords via VPS env only

## Headers

`SecurityHeaders` middleware sets:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (production)
- `Permissions-Policy` restrictions

## Rate limiting

All limiters use `$request->ip()` after trusted-proxy resolution.

Load-test bypass requires explicit `DIYAR_LOADTEST_MODE=true` — blocked in production/staging boot.

## Container hardening

| Control | Status |
|---------|--------|
| Separate containers per role | Implemented |
| MySQL/Redis not public | Production compose |
| Non-root FPM user | `www-data` in Dockerfile.fpm |
| Redis password | Required in production compose |
| `server_tokens off` | Nginx |

## Dependency audit

Run periodically on deploy host:

```bash
cd backend && composer audit
cd frontend && npm audit --omit=dev
```

## Incident response

See `deploy/OPERATIONS.md` runbook table.

Report security issues to platform owners — do not disclose credentials in tickets or logs.
