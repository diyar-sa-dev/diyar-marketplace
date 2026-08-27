# Release Recommendation — Stage 28

**Date:** 2026-08-27  
**Audience:** Engineering lead / release sign-off  
**Baseline commit:** `92638a9` (uncommitted Stage 28 artifacts)

---

## Recommended next action

## **REMEDIATE BLOCKERS FIRST**

Then proceed to **Phase 28.9 remediation + optimization** per [OPTIMIZATION_BACKLOG.md](./OPTIMIZATION_BACKLOG.md).

**Not recommended today:** deploy to production as-is without decisions below.  
**Not recommended:** skip directly to broad optimization before blocker remediation.

---

## Executive summary

DIYAR V1/V1.1 has **strong functional and authorization evidence** on SQLite and partial MySQL 8 verification. Core commerce, vendor, provider, admin, and B2B journeys pass CI-parity E2E. Local load testing shows healthy behavior at **100 VU** on browse paths.

**No confirmed P0/P1 application defect** blocks release on tested paths.

**Three items require action before production:**

1. **Product/security decision** on public assistant API (KI-028-053)
2. **Verify PHP bcmath** (and standard extensions) on Hostinger — catalog depends on it
3. **MySQL 8 full test parity** — run CI job or accept documented risk (KI-028-030)

**Strongly recommended before launch:** sanitize admin B2B preview HTML (KI-028-055); fix rate-limit regression tests (KI-028-054).

---

## What blocks production

| # | Item | Type |
|---|------|------|
| 1 | KI-028-053 Assistant endpoint | Decision / hardening |
| 2 | BLOCK-002 bcmath on Hostinger | Deploy verification |
| 3 | KI-028-030 MySQL 8 full suite | CI or sign-off |
| 4 | Production env checklist | DEBUG, HTTPS, secrets, cookies — **NOT VERIFIED** |

See [PRODUCTION_BLOCKERS.md](./PRODUCTION_BLOCKERS.md).

---

## What can be accepted (with documentation)

- Local Docker load results ≠ production capacity
- 499 KB JS bundle (OPT-FE-001 deferred)
- Products SQL scan at 500 rows (OPT-DB-001 deferred)
- Ad popup UX flake (KI-028-050) if product accepts
- Partial a11y/responsive/upload coverage
- MariaDB local dev vs MySQL 8 prod architecture

See [CONDITIONAL_ACCEPTANCE.md](./CONDITIONAL_ACCEPTANCE.md).

---

## What should be optimized later (priority order)

1. **28.9:** OPT-INFRA-002, OPT-SECURITY-002/003, OPT-FE-003, test fixes (021, 051, 054)
2. **28.10:** OPT-API-002/003, OPT-FE-001/002
3. **28.11:** OPT-SECURITY-001 (CSP), OPT-QUEUE-001, staging soak

See [OPTIMIZATION_BACKLOG.md](./OPTIMIZATION_BACKLOG.md).

---

## Sign-off checklist

```text
[ ] KI-028-053 — Assistant: auth / accept / harden (documented)
[ ] BLOCK-002 — php -m | grep bcmath on Hostinger PASS
[ ] KI-028-030 — MySQL 8 CI job added OR risk acceptance signed
[ ] KI-028-055 — B2B preview sanitize OR risk acceptance signed
[ ] Production .env — APP_DEBUG=false, secure cookies, secrets rotated
[ ] Staging smoke — health, login, catalog, checkout preview
[ ] OPT-NETWORK-001 — Optional staging load smoke before marketing scale
```

---

## Architecture reaffirmation

```text
Production DB:     MySQL 8.x on Hostinger — UNCHANGED
Local dev DB:      MariaDB 10.4 — ACCEPTED
PostgreSQL:        REJECTED — NOT REOPENED
App server prod:   PHP-FPM + Nginx — NOT Octane Docker
```

---

## Phase 28.8 certification

```text
Issue consolidation:             PASS
Duplicate/reclassification:        PASS
Functional readiness:              PASS WITH CONDITIONS
Database readiness:                PASS WITH CONDITIONS
API readiness:                     PASS WITH CONDITIONS
Frontend readiness:                PASS WITH CONDITIONS
Integration readiness:             PASS WITH CONDITIONS
Security readiness:                PARTIAL
Performance readiness:             PASS WITH CONDITIONS
Infrastructure readiness:          PARTIAL
Production blockers identified:    YES
Optimization backlog created:      YES
Dependencies identified:           YES
Production certification:          NO

Optimization started: NO
Commits created: NO
Production deployment: NO
```

---

## STOP

Await authorization for **Phase 28.9** remediation/optimization sequence.
