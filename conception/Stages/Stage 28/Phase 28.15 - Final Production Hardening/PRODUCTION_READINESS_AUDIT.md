# Phase 28.15 — Production Readiness Audit

## Environment matrix

| Control | Production | Staging | Development/Test |
|---------|------------|---------|------------------|
| `APP_DEBUG` | Must be false | false | true allowed |
| `DIYAR_LOADTEST_MODE` | **Blocked** | **Blocked** | E2E only |
| Fake payment gateway | Disabled | Disabled | PHPUnit + local |
| Rate limit bypass | Never | Never | E2E loadtest only |
| Test routes | Absent | Absent | Absent from prod routes |

## Configuration validation

- `EnvironmentSafetyValidator` runs at boot
- `diyar:validate-php-runtime` for deploy gate
- `.env.example` documents all critical flags

## Deployment readiness

- Atomic release script present
- Rollback via symlink documented
- Maintenance mode supported
- Worker restart documented (Supervisor)

## Data safety

- No destructive deploy commands in repository scripts
- E2E bootstrap uses disposable sqlite only
- Migrations forward-only in production deploy

## Frontend production build

- Vite production build PASS
- CDN preconnect plugin (28.13)
- OG/meta tags in index.html

## Verdict

**Production readiness: PASS** for repository deliverables. VPS operator must execute `PRODUCTION_CHECKLIST.md` on target host.
