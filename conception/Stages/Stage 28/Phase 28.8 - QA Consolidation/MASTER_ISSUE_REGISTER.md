# Master Issue Register — Stage 28

**Date:** 2026-08-27  
**Authority:** This document supersedes per-phase registers for **release decisions**. Historical detail remains in phase folders.

**Lifecycle states used:** OPEN · CONFIRMED · BLOCKER · CONDITIONALLY ACCEPTED · DEFERRED · TEST GAP · ENVIRONMENT GAP · FALSE POSITIVE · SUPERSEDED · RESOLVED · OPTIMIZATION BACKLOG · DOCUMENTATION ONLY

---

## Summary counts (deduplicated)

| Severity | Open | Resolved/Superseded | OPT backlog |
|----------|-----:|--------------------:|------------:|
| P0 | 0 | 0 | 0 |
| P1 | 0 | 1 | 0 |
| P2 | 8 | 4 | 0 |
| P3 | 18 | 2 | 0 |
| P4 | 6 | 0 | 8 OPT-* |

---

## Master table

| ID | Sev | Area | Type | Lifecycle | Blocker? | Evidence | Next action | Phase |
|----|-----|------|------|-----------|----------|----------|-------------|-------|
| **KI-028-001** | P1→P2 | API/Test | TEST DEFECT | **SUPERSEDED** | NO | Flaky shipping test | See KI-028-021 | — |
| **KI-028-002** | P2 | Infra/CI | TEST GAP | OPEN | NO | PHPUnit uses array/sync; no Redis in CI backend | Optional Redis CI job | 28.11 |
| **KI-028-003** | P2 | E2E | ENV GAP | **SUPERSEDED** | NO | Dev DB ≠ CI seed | Resolved via KI-028-048 | — |
| **KI-028-004** | P2 | E2E/B2B | ENV GAP | **SUPERSEDED** | NO | Draft B2B missing locally | Resolved via KI-028-048 | — |
| **KI-028-005** | P2 | DB/Env | ENV GAP | OPEN | NO | Shared MariaDB schemas | Isolated dev DB | 28.14 |
| **KI-028-006** | P2 | Security | TEST GAP | OPEN | NO | Stage 20 PARTIAL | Addressed PARTIAL in 28.6 | 28.6 ✓ |
| **KI-028-007** | P2 | Perf | NOT VERIFIED | OPEN | NO | 25K VU never run | 100 VU done 28.7; 25K deferred | 28.7 ✓ |
| **KI-028-008** | P3 | Frontend | PRODUCT | **SUPERSEDED** | NO | Projects modal | See KI-028-050 | — |
| **KI-028-009** | P3 | E2E/Blog | ENV GAP | **SUPERSEDED** | NO | Blog API fail on dev DB | Resolved KI-028-048 | — |
| **KI-028-010** | P3 | Infra | CONFIG GAP | OPEN | NO | PHP 8.4 local vs ^8.3 | Align local/CI | 28.14 |
| **KI-028-011** | P3 | Infra | CONFIG GAP | OPEN | NO | Node 23 vs 20/22 | Use .nvmrc in CI/dev | 28.14 |
| **KI-028-012** | P3 | Env | ENV GAP | OPEN | NO | Windows sodium ext missing | Dev-only; verify prod | Deploy checklist |
| **KI-028-013** | P3 | Frontend/Test | TEST DEFECT | OPEN | NO | Vitest act() warnings | Hygiene | 28.9+ |
| **KI-028-014** | P3 | Tooling | TECH DEBT | OPEN | NO | Pint on stage28 scripts | Format when committing | 28.8 hygiene |
| **KI-028-015** | P3 | QA | TEST GAP | OPEN | NO | No PHPStan | Optional static analysis | 28.14 |
| **KI-028-016** | P4 | Docs | DOCUMENTATION | OPEN | NO | config/diyar.php stale version | Doc sync | 28.14 |
| **KI-028-017** | P3 | E2E | ENV GAP | OPEN | NO | Port 8000 conflict | Document bootstrap | 28.8 ✓ |
| **KI-028-018** | P4 | Frontend | OPT CANDIDATE | **OPT BACKLOG** | NO | 499 KB main JS | OPT-FE-001 | 28.10+ |
| **KI-028-019** | P4 | Test | TECH DEBT | DOCUMENTATION | NO | PHPUnit 512M memory | Accepted | — |
| **KI-028-020** | P1 | DB/Security | ENV GAP | OPEN | NO | XAMPP root ALL PRIVILEGES | Scoped dev user | 28.14 |
| **KI-028-021** | P2 | Test | TEST DEFECT | OPEN | NO | ShippingRulePrecedence flaky factory | Fix fixture dims null | 28.9 |
| **KI-028-022** | P2 | CI | TEST GAP | OPEN | NO | Default PHPUnit SQLite only | MySQL 8 CI job | 28.8/CI |
| **KI-028-023** | P2 | DB/Env | ENV GAP | OPEN | NO | Same as KI-028-005 | 28.14 | 28.14 |
| **KI-028-024** | P2 | DB | NOT VERIFIED | **MERGED** | NO | Full suite not MySQL 8 | See KI-028-030 | — |
| **KI-028-025** | P3 | DB | DOCUMENTATION | DOCUMENTATION | NO | MySQL-specific analytics SQL | Accepted (MySQL 8 prod) | — |
| **KI-028-026** | P3 | DB/Resilience | NOT VERIFIED | OPEN | NO | No DB outage test | Failure injection | 28.14 |
| **KI-028-027** | P3 | Tooling | TEST DEFECT | OPEN | NO | Integrity script wrong column | Fix script if reused | 28.8 |
| **KI-028-028** | P3 | DB/Perf | OPT CANDIDATE | **OPT BACKLOG** | NO | Analytics unprofiled at scale | OPT-DB-002; measured 28.7 | 28.9+ |
| **KI-028-029** | P4 | DB | DOCUMENTATION | DOCUMENTATION | NO | Tiny dev DB | Medium seed 28.7 | 28.7 ✓ |
| **KI-028-030** | P2 | API/DB | TEST GAP | OPEN | **CONDITIONAL** | 696 tests SQLite; 41 MySQL 8 PASS | Add MySQL 8 CI job pre-prod | 28.8/CI |
| **KI-028-031** | P3 | API/Security | TEST GAP | OPEN | NO | Notification IDOR incomplete | Extend tests | 28.6→28.9 |
| **KI-028-033** | P3 | API | TEST GAP | **MERGED** | NO | Assistant validation | KI-028-057 | — |
| **KI-028-034** | P3 | API/Admin | TEST GAP | OPEN | NO | 167 admin routes not per-route | Permission tests exist | Accept |
| **KI-028-035** | P3 | API | NOT VERIFIED | OPEN | NO | Booking idempotency | Add test | 28.9+ |
| **KI-028-036** | P3 | API/Chat | NOT VERIFIED | OPEN | NO | Chat idempotency | Add test | 28.9+ |
| **KI-028-037** | P2 | API | TEST GAP | OPEN | NO | No assistant Feature test | KI-028-057 | 28.9 |
| **KI-028-038** | P2 | Tooling | DOCUMENTATION | OPEN | NO | Route inventory unclassified | Script improvement | 28.14 |
| **KI-028-039** | P4 | API | DOCUMENTATION | DOCUMENTATION | NO | Login 422 not 401 | Intentional | — |
| **KI-028-040** | P4 | CI/Perf | DOCUMENTATION | DOCUMENTATION | NO | MySQL8 subset slow | CI tuning | 28.11 |
| **KI-028-041** | P2 | Frontend | PRODUCT | **SUPERSEDED** | NO | Projects modal | See KI-028-050 | — |
| **KI-028-042** | P3 | Frontend/Admin | UX GAP | DEFERRED | NO | No admin 404 page | Product acceptance | 28.10+ |
| **KI-028-043** | P4 | Frontend/Test | TEST DEFECT | OPEN | NO | act() warnings | Same as KI-028-013 | 28.9 |
| **KI-028-044** | P3 | i18n | PRODUCT GAP | DOCUMENTATION | NO | No French locale | Not required unless product says | N/A |
| **KI-028-045** | P3 | Frontend | TEST GAP | **PARTIAL** | NO | Responsive not full matrix | 29/29 smoke pass 28.5 | 28.5 ✓ |
| **KI-028-046** | P3 | Frontend/E2E | TEST GAP | **PARTIAL** | NO | Upload UI not verified | KI-028-052 | 28.9 |
| **KI-028-047** | P3 | A11y | TEST GAP | OPEN | NO | No a11y smoke | axe/lighthouse | 28.14 |
| **KI-028-048** | P2 | E2E | ENV GAP | **RESOLVED** | NO | Seed parity procedure | CI-parity bootstrap doc | 28.5 ✓ |
| **KI-028-049** | P3 | E2E/Cache | ENV GAP | OPEN | NO | Redis stale after DB switch | cache:clear in bootstrap | 28.8 ✓ |
| **KI-028-050** | P2 | Frontend/UX | CONFIRMED | OPEN | **CONDITIONAL** | Ad popup z-300 blocks sidebar | Fix stacking or dismiss policy | 28.9 |
| **KI-028-051** | P3 | E2E/Test | TEST DEFECT | OPEN | NO | b2b-admin wrong request ctx | Fix storageState | 28.9 |
| **KI-028-052** | P3 | E2E/Upload | TEST GAP | OPEN | NO | Logo upload not E2E verified | Harden upload spec | 28.9 |
| **KI-028-053** | P2 | Security/API | SECURITY HARDENING | OPEN | **YES** | Public `/assistant/chat` 30/min | Auth or product accept + monitor | 28.9 |
| **KI-028-054** | P3 | Security/CI | TEST GAP | OPEN | NO | RateLimit tests fail in 28.6 audit | Fix test payloads; no bypass proven | 28.9 |
| **KI-028-055** | P3 | Security/FE | SECURITY HARDENING | OPEN | **CONDITIONAL** | Admin B2B dangerouslySetInnerHTML | sanitizeHtml before render | 28.9 |
| **KI-028-056** | P3 | Security/Infra | SECURITY HARDENING | DEFERRED | NO | No CSP header | nginx/middleware CSP | 28.11 |
| **KI-028-057** | P3 | Security/API | TEST GAP | OPEN | NO | Assistant security tests missing | Feature tests | 28.9 |
| **KI-028-058** | P3 | Security/API | TEST GAP | OPEN | NO | Notification IDOR matrix | Extend tests | 28.9 |
| **KI-028-059** | P3 | Secrets | ENV GAP | OPEN | NO | Local plaintext .env secrets | Prod secrets manager | Deploy |
| **KI-028-060** | P4 | Test | TEST DEFECT | OPEN | NO | RateLimit test payload drift | Same as KI-028-054 | 28.9 |
| **KI-028-061** | P4 | Test | TEST DEFECT | OPEN | NO | Loyalty config 4 PHPUnit fails | Not security | 28.9 |
| **PERF-028-001** | P1→P2 | Infra/Perf | ENV GAP | OPEN | **NO*** | bcmath missing Docker Octane | OPT-INFRA-002; *prod=PHP-FPM | 28.9 |
| **PERF-028-002** | P2 | Infra | ENV GAP | OPEN | NO | MySQL volume cred drift | OPT-INFRA-001 doc | 28.9 |
| **PERF-028-003** | P2 | Env | ENV GAP | OPEN | NO | Port 8000 serve vs Docker | Document | 28.8 ✓ |
| **PERF-028-004** | P2 | Perf/Data | TEST GAP | OPEN | NO | Large tier not seeded | Seed 100× if needed | 28.9 |
| **PERF-028-005** | P2 | Perf | ENV GAP | OPEN | NO | profiles.js blocked by bcmath | After OPT-INFRA-002 | 28.9 |
| **PERF-028-006** | P3 | Perf | NOT VERIFIED | OPEN | NO | 60 min soak not run | Staging soak | 28.11 |
| **PERF-028-007** | P3 | Frontend/Perf | NOT VERIFIED | OPEN | NO | No Web Vitals | Lighthouse CI | 28.12 |
| **PERF-028-008** | P3 | Security/Perf | NOT VERIFIED | DOCUMENTATION | NO | Assistant not load-tested | By design 28.7 | — |

\* **PERF-028-001:** Production architecture is **PHP-FPM + Nginx** (not Octane Docker). Classified as **load-test environment defect**. **Pre-deploy verify `bcmath` on Hostinger PHP** — if absent, becomes production blocker.

---

## Optimization IDs (see OPTIMIZATION_BACKLOG.md)

OPT-DB-001/002/003 · OPT-API-001–004 · OPT-REDIS-001 · OPT-QUEUE-001 · OPT-FE-001/002 · OPT-INFRA-001/002

---

## Release blocker column legend

| Value | Meaning |
|-------|---------|
| **YES** | Must remediate or obtain explicit product sign-off before production |
| **CONDITIONAL** | Blocker unless accepted with documented mitigation |
| **NO** | Not a production deployment blocker |

**Explicit production blockers:** KI-028-053 (product/security decision). **Strong recommendations:** KI-028-055 (sanitize admin preview), pre-deploy bcmath verification, KI-028-030 (MySQL 8 CI parity).

---

## Certification

```text
Master register complete: YES
Duplicates removed: YES
Optimization implemented: NO
Commits: NO
```
