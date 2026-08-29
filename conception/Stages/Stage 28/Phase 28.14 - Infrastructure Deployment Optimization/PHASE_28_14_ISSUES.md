# Phase 28.14 — Issue Register

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| INF-014-001 | P1 | `DIYAR_LOADTEST_MODE` not blocked in production/staging env validation | **FIXED** |
| INF-014-002 | P1 | No deploy-time BCMath / PHP extension verification | **FIXED** — `diyar:validate-php-runtime` |
| INF-014-003 | P2 | Shell `DIYAR_LOADTEST_MODE=true` breaks PHPUnit rate-limit tests | **FIXED** — boot guard + `scripts/test-phpunit.ps1` |
| INF-014-004 | P2 | No automated deploy script | **FIXED** — `scripts/deploy/deploy-release.sh` |
| INF-014-005 | P2 | No PHP-FPM / OPcache VPS templates | **FIXED** — `deploy/php/*` |
| INF-014-006 | P2 | Nginx missing `.env`/backup deny rules | **FIXED** |
| INF-014-007 | P2 | 2 loyalty tests fail (EffectiveConfig vs config key mismatch) | **FIXED 28.15** — TestCase APP_ENV guard |
| INF-014-008 | P3 | No systemd unit files (Supervisor only) | **ACCEPTED** — Hostinger uses Supervisor |
| INF-014-009 | P3 | Physical backup automation not in repo | **ACCEPTED** — procedure in BACKUP_RESTORE_STRATEGY.md |
| INF-014-010 | P3 | Production-like Docker not CI-validated | **DOCUMENTED** — manual `docker compose -f docker-compose.production-like.yml` |
