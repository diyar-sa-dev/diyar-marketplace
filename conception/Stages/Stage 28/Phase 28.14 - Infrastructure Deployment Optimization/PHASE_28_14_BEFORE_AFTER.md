# Phase 28.14 — Before / After

| Area | Before 28.14 | After 28.14 |
|------|--------------|-------------|
| Loadtest in production | No env guard | **Blocked** in prod + staging |
| PHP extension check | Manual | `diyar:validate-php-runtime` |
| BCMath verification | Documented only | **Automated check** |
| PHP-FPM config | None in repo | 3 VPS profiles |
| OPcache config | None in repo | Production template |
| Deploy script | Manual rsync docs | `deploy-release.sh` |
| Nginx security | Basic | `.env`/backup deny rules |
| PHPUnit + loadtest shell | 756/769 (env pollution) | **761/769** (clean env) |
| Production-like Docker | None | `docker-compose.production-like.yml` |
| Test helper | None | `scripts/test-phpunit.ps1` |

## Score

| Pass | Score |
|------|-------|
| First 28.14 target | 9.8–10 |
| **Achieved** | **9.7** (2 pre-existing loyalty tests; E2E not re-run) |
