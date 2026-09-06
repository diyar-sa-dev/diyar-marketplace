# Phase 28.1 — Known Issues Register

**Date:** 2026-08-27  
**Commit:** `92638a9`  
**Classification key:** CONFIRMED BUG · TEST GAP · CONFIGURATION GAP · ENVIRONMENT GAP · PERFORMANCE SUSPECT · SECURITY SUSPECT · DOCUMENTATION GAP · TECHNICAL DEBT · NOT VERIFIED

---

## P0 — Production blockers

*None confirmed in Phase 28.1 baseline with full evidence chain. PHPUnit suite near-complete (1 error) — triage below.*

---

## P1 — Critical

### KI-028-001 — PHPUnit shipping precedence test error

| Field | Value |
|-------|-------|
| **Severity** | P1 |
| **Category** | CONFIRMED BUG (pending root-cause split) |
| **Component** | `ShippingRulePrecedenceTest` / cart weight validation |
| **Evidence** | `php artisan test`: 731/732 pass; error: *Cart weight exceeds the maximum supported limit.* |
| **Reproduction** | `cd backend && php artisan test --filter=ShippingRulePrecedenceTest` |
| **Impact** | CI backend job fails; shipping rule precedence unverified |
| **Status** | OPEN |
| **Next phase** | 28.3 triage → 28.8 blocker fix if application defect |

---

## P2 — High

### KI-028-002 — PHPUnit/CI backend suite does not exercise Redis

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Category** | TEST GAP |
| **Component** | `phpunit.xml`, `ci.yml` backend job |
| **Evidence** | `CACHE_STORE=array`, `QUEUE_CONNECTION=sync`; CI backend extensions omit redis |
| **Impact** | Redis-specific failures may reach production undetected by default test run |
| **Status** | OPEN |
| **Next phase** | 28.11 + optional dedicated Redis integration job |

### KI-028-003 — Playwright E2E dev DB ≠ CI seed

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Category** | ENVIRONMENT GAP |
| **Component** | E2E against `composer dev` + MariaDB `diyar` |
| **Evidence** | `blog.spec.ts` API not OK; `b2b-admin` draft company not in list — dev DB lacks E2E seeds |
| **Impact** | Local E2E results not comparable to CI; false failures |
| **Status** | OPEN |
| **Next phase** | 28.4/28.5 — document standard E2E bootstrap for local runs |

### KI-028-004 — B2B admin E2E draft company not visible

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Category** | CONFIRMED BUG or ENVIRONMENT GAP |
| **Component** | `frontend/e2e/b2b-admin.spec.ts` |
| **Evidence** | Playwright: `b2b-preview-draft-b2b-company` not found after 60s; 3 serial tests skipped |
| **Reproduction** | `npm run test:e2e -- b2b-admin` against dev DB |
| **Impact** | B2B admin publish/RFQ journeys untested locally; CI history shows flakiness |
| **Status** | OPEN |
| **Next phase** | 28.5 — reproduce on CI sqlite seed |

### KI-028-005 — Shared database server schema bleed

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Category** | ENVIRONMENT GAP |
| **Component** | Local MariaDB instance |
| **Evidence** | `stage28-db-baseline.php` listed `hospital_stock.*`, `cybercafe_db.*` tables (204+ rows unrelated) |
| **Impact** | Risk of wrong DB operations; baseline table counts unreliable |
| **Status** | OPEN |
| **Next phase** | 28.14 — isolated dev DB per engineer |

### KI-028-006 — Stage 20 security hardening PARTIAL

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Category** | SECURITY SUSPECT |
| **Component** | Root README status |
| **Evidence** | README: *Stage 20 — PARTIAL (matrix + regression)* |
| **Impact** | Full IDOR/business-logic abuse matrix not certified |
| **Status** | NOT VERIFIED in 28.1 |
| **Next phase** | 28.6 Security Testing |

### KI-028-007 — 25K VU load NOT VERIFIED

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Category** | NOT VERIFIED |
| **Component** | k6 `profiles.js`, Stage 22 |
| **Evidence** | README + LOAD_TEST_RESULTS; profile `25000` exists, no measured run in 28.1 |
| **Impact** | Scalability claims unsupported |
| **Status** | OPEN |
| **Next phase** | 28.7 controlled load testing |

---

## P3 — Medium

### KI-028-008 — Projects E2E modal intercepts navigation

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | TEST DEFECT or UI DEFECT |
| **Component** | `frontend/e2e/projects.spec.ts` |
| **Evidence** | 90s timeout; dialog overlay intercepts Projects button click |
| **Status** | OPEN |
| **Next phase** | 28.4/28.5 |

### KI-028-009 — Blog public E2E fails on dev DB

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | ENVIRONMENT GAP |
| **Component** | `frontend/e2e/blog.spec.ts` |
| **Evidence** | `page.request.get(.../blog/articles/{slug})` not OK |
| **Status** | OPEN |
| **Next phase** | 28.5 with CI seed |

### KI-028-010 — PHP 8.4 local vs ^8.3 constraint

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | CONFIGURATION GAP |
| **Evidence** | Local PHP 8.4.0; `composer.json` requires `^8.3`; CI uses 8.3 |
| **Status** | OPEN |

### KI-028-011 — Node version drift

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | CONFIGURATION GAP |
| **Evidence** | Local Node 23.11; `.nvmrc` 20; CI Node 22 |
| **Status** | OPEN |

### KI-028-012 — PHP sodium extension missing (local Windows)

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | ENVIRONMENT GAP |
| **Evidence** | PHP startup warning; extension not loaded |
| **Impact** | NOT VERIFIED — may affect encryption features in dev |
| **Status** | OPEN |

### KI-028-013 — Vitest act() warnings

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | TECHNICAL DEBT |
| **Evidence** | stderr warnings in AuthContext, B2BCompanyPage tests; tests PASS |
| **Status** | OPEN |

### KI-028-014 — Pint failure on Stage 28 instrumentation

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | TECHNICAL DEBT |
| **Evidence** | `vendor/bin/pint --test` fails on `stage28-queue-verify.php` only |
| **Status** | OPEN (uncommitted instrumentation) |

### KI-028-015 — PHPStan not configured

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | TEST GAP |
| **Evidence** | No phpstan/larastan in `composer.json` |
| **Status** | NOT CONFIGURED |

### KI-028-016 — Config metadata stale

| Field | Value |
|-------|-------|
| **Severity** | P4 |
| **Category** | DOCUMENTATION GAP |
| **Evidence** | `config/diyar.php` defaults `api_version` stage3; health returns `1.0.0-stage26` |
| **Status** | OPEN |

### KI-028-017 — Playwright CI blocked when dev server occupies port 8000

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | ENVIRONMENT GAP |
| **Evidence** | `CI=true npm run test:e2e` → health URL already used |
| **Status** | OPEN |

---

## P4 — Low

### KI-028-018 — Large frontend bundles

| Field | Value |
|-------|-------|
| **Severity** | P4 |
| **Category** | PERFORMANCE SUSPECT |
| **Evidence** | Main chunk 499 kB raw / 144 kB gzip; CartesianChart 325 kB |
| **Impact** | Not measured against SLA — baseline only |
| **Status** | OPEN |
| **Next phase** | 28.12 after Phase 28.7 |

### KI-028-019 — PHPUnit memory 512M override

| Field | Value |
|-------|-------|
| **Severity** | P4 |
| **Category** | TECHNICAL DEBT |
| **Evidence** | `phpunit.xml` ini memory_limit 512M vs CLI 128M |
| **Status** | DOCUMENTED |

---

## Issues explicitly NOT raised (insufficient evidence)

| Topic | Reason |
|-------|--------|
| Production deployment live | README: docs complete, not live-deployed — status unknown |
| MySQL vs MariaDB in docs | Measured MariaDB 10.4.32 — documentation says MySQL 8 for staging |
| Checkout full E2E | README notes limitation — not re-verified here |

---

## Backlog routing (Phase 28.8 preview)

| Priority | Count | Target phases |
|----------|-------|---------------|
| P1 | 1 | 28.3 → fix → regression |
| P2 | 6 | 28.5, 28.6, 28.7, 28.11, 28.14 |
| P3 | 9 | 28.4, 28.5, 28.14 |
| P4 | 2 | 28.12 |

**Optimization backlog:** empty until Phase 28.8 consolidation after testing phases.
