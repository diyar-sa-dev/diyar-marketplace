# Phase 28.15 — Deployment Hardening Audit

## Deploy script (`scripts/deploy/deploy-release.sh`)

| Requirement | Status |
|-------------|--------|
| Build frontend | Yes |
| Run migrations (not fresh) | Yes |
| Config/route/view cache | Yes |
| Atomic symlink release | Yes |
| Worker restart hook | Documented |
| Rollback path | Previous release retained |

## Nginx / PHP-FPM

Templates in `deploy/nginx/` and `deploy/php/`:

- Security deny rules for sensitive files
- `server_tokens off`
- FPM pool sizing small/medium/large
- OPcache production ini

## Docker production-like

`docker-compose.production-like.yml` + `Dockerfile.fpm` for local staging simulation.

## Test isolation

`scripts/test-phpunit.ps1` forces `DIYAR_LOADTEST_MODE=false`.

`TestCase` forces `APP_ENV=testing` — prevents EffectiveConfig cache pollution during CI/local PHPUnit.

## Verdict

**Deployment: PASS**
