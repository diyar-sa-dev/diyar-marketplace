# Phase 28.1 — Test Strategy

**Date:** 2026-08-27  
**Commit baseline:** `92638a9`  
**Scope:** DIYAR V1 + V1.1 production-readiness testing program (Stage 28)

---

## Purpose

Establish a **reproducible, evidence-based QA baseline** before any optimization or production certification. Answer: *What is the current state of the system, what is tested, what is not, and what must be fixed?*

## Scope

### In scope (Stage 28 testing phases)

- Unit, feature, API, integration, E2E, security, performance/load, regression
- Database integrity analysis (read-only in 28.2)
- Redis cache + queue verification (gate complete)
- CI/CD parity analysis
- Health/readiness/liveness probes
- Static analysis already configured in repo

### Out of scope (Phase 28.1)

- Performance optimization
- Schema/index changes
- API contract changes
- UI redesign
- New business features
- 25K VU load validation (explicitly **NOT VERIFIED** — see Stage 22)

## Testing philosophy

```text
DISCOVER → MEASURE → TEST → DOCUMENT → FIX (correctness/security only) → RE-TEST → OPTIMIZE (later phases)
```

**Testing happens before optimization.** No tuning without before/after evidence.

## Test levels

| Level | Tool | Location | Default environment |
|-------|------|----------|---------------------|
| Unit | PHPUnit | `backend/tests/Unit` | sqlite `:memory:`, sync queue, array cache |
| Feature / API | PHPUnit | `backend/tests/Feature` | sqlite `:memory:`, sync queue, array cache |
| Component / hook | Vitest | `frontend/src/**/*.test.{ts,tsx}` | jsdom |
| E2E | Playwright | `frontend/e2e/*.spec.ts` | CI: sqlite backend + Redis; local dev: MySQL/MariaDB + Redis |
| Load smoke | k6 | `scripts/performance/*.js` | Octane+Redis recommended; CI analytics smoke only |
| Static | ESLint, tsc, Prettier, Pint | npm/composer scripts | local / CI |

## Test environments

| Environment | Purpose | DB | Cache | Queue | Sessions |
|-------------|---------|-----|-------|-------|----------|
| PHPUnit (`phpunit.xml`) | Automated backend tests | sqlite memory | array | sync | array |
| CI E2E (`bootstrap-backend.sh`) | Playwright | sqlite file + seed | redis | redis | database |
| CI backend job | Pint + PHPUnit | sqlite memory | array | sync | array |
| Local dev (measured) | Engineer workstation | MariaDB `diyar` | redis | redis | database |
| k6 load (documented) | Performance | MySQL (profiles ≥100) | redis | redis | redis (loadtest compose) |

## Test data strategy

- **PHPUnit:** factories + seeders invoked per test class; `RefreshDatabase` pattern
- **E2E CI:** `migrate:fresh --seed` via `scripts/e2e/bootstrap-backend.sh` (deterministic demo users)
- **Local E2E against `composer dev`:** uses developer DB state — **not equivalent to CI** (see KNOWN_ISSUES.md KI-028-006)

## Functional testing

- PHPUnit feature tests cover API domains (Auth, Cart, Checkout, Payments, Shipping, B2B, Blog, Loyalty, Chat, Admin, etc.)
- Vitest covers isolated UI units (pages, hooks, auth context, routes)
- Playwright covers cross-browser user journeys (customer, vendor, provider, admin, B2B, loyalty, messaging)

## Integration testing

- `backend/tests/Feature/Outbox/`, payment concurrency, checkout+shipping integration tests
- CI `messaging-integration.yml` (MySQL + Redis) — separate workflow, not run in default `ci.yml` on every path
- Full-stack E2E in Playwright (frontend + API + DB)

## Security testing (planned Phase 28.6)

Existing partial coverage:

- `backend/tests/Feature/Security/` (rate limiting, uploads)
- Admin isolation tests, B2B/blog/project security tests
- IDOR and business-logic abuse matrix — **NOT COMPLETE** (Stage 20 PARTIAL)

## Performance / load testing (planned Phase 28.7)

Phase 28.1 inventories k6 scripts only. Controlled load execution belongs to Phase 28.7.

Existing infrastructure:

- `scripts/performance/smoke.js` — up to 100 VUs catalog paths
- `scripts/performance/profiles.js` — baseline through 25000 VU **profiles defined**, not verified at scale
- `scripts/performance/analytics.js` — 5→20 VU authenticated analytics smoke (CI)
- `docker-compose.loadtest.yml` — Octane + MySQL + Redis

## Regression strategy

1. Run full PHPUnit + Vitest + Playwright on every Stage 28 gate
2. Compare against Phase 28.1 baseline metrics (BASELINE.md)
3. Re-run affected domain tests after any correctness fix
4. No optimization merge without regression PASS on touched domains

## Failure classification

| Class | Description | Phase 28.1 action |
|-------|-------------|-------------------|
| Environment failure | Wrong DB, missing Redis, port conflict | Document; fix env or classify BLOCKED |
| Test infrastructure failure | Playwright webServer conflict, missing seed | Document |
| Test defect | Flaky selector, wrong assertion | Document → Phase 28.4/28.5 |
| Application defect | API returns wrong status, logic error | Document → fix in 28.8 blockers |
| Database problem | Missing table/seed | Document |
| Flaky test | Passes on retry / timing | Document explicitly |

## Severity model

| Level | Meaning |
|-------|---------|
| P0 | Production blocker — cannot deploy safely |
| P1 | Critical — major flow broken or security gap |
| P2 | High — significant gap or frequent failure |
| P3 | Medium — partial coverage, non-critical defect |
| P4 | Low — cosmetic, docs, minor debt |

## Production gates (target — Phase 28.15)

Application may be marked **PRODUCTION READY** only when critical tests pass, security blockers resolved, Redis/queue verified, deployment reproducible, and final regression complete. **Not met at Phase 28.1.**

## Phase 28.1 deliverables

- [x] TEST_STRATEGY.md (this document)
- [x] BASELINE.md
- [x] ENVIRONMENT.md
- [x] TEST_MATRIX.md
- [x] KNOWN_ISSUES.md
