# Stage 28 — Production QA, Performance, Security, Hardening & Optimization

**Status:** IN PROGRESS  
**Production candidate:** DIYAR V1 + V1.1 (current `dev` branch)  
**Started:** 2026-08-27  
**Git baseline commit:** `92638a9` — `fix(ci): send Sanctum stateful Origin headers in e2e and k6 smoke tests.`

---

## Objective

Make the existing V1 + V1.1 implementation production-safe, measurable, secure, and regression-resistant **without removing functionality, redesigning the product, or changing business rules unless a confirmed defect requires it.**

## Method

```text
DISCOVER → MEASURE → TEST → DOCUMENT → FIX (correctness/security) → BENCHMARK → OPTIMIZE → REGRESSION → CERTIFY
```

## Current progress

| Step | Status | Evidence |
|------|--------|----------|
| Repository discovery | **COMPLETE** | [DISCOVERY_REPORT.md](./DISCOVERY_REPORT.md) |
| Redis configuration (cache + queue) | **COMPLETE** | `backend/.env` — `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `SESSION_DRIVER=database` |
| Redis verification | **PASS** | [REDIS_VERIFICATION.md](./REDIS_VERIFICATION.md) |
| Phase 28.1 baseline | **COMPLETE** | [Phase 28.1 - Production QA Strategy](./Phase%2028.1%20-%20Production%20QA%20Strategy/) |
| Phase 28.2 database testing | **COMPLETE** | [Phase 28.2 - Database Testing](./Phase%2028.2%20-%20Database%20Testing/) |
| Phase 28.3 backend API testing | **COMPLETE** | [Phase 28.3 - Backend API Testing](./Phase%2028.3%20-%20Backend%20API%20Testing/) |
| Phase 28.4 frontend testing | **COMPLETE WITH CONDITIONS** | [Phase 28.4 - Frontend Testing](./Phase%2028.4%20-%20Frontend%20Testing/) |
| Phase 28.5 full stack integration | **COMPLETE WITH CONDITIONS** | [Phase 28.5 - Full Stack Integration](./Phase%2028.5%20-%20Full%20Stack%20Integration/) |
| Phase 28.6 security testing | **COMPLETE WITH CONDITIONS** | [Phase 28.6 - Security Testing](./Phase%2028.6%20-%20Security%20Testing/) |
| Phase 28.7 performance & load | **COMPLETE WITH CONDITIONS** | [Phase 28.7 - Performance & Load Testing](./Phase%2028.7%20-%20Performance%20%26%20Load%20Testing/) |
| Phase 28.8 QA consolidation | **COMPLETE** | [Phase 28.8 - QA Consolidation](./Phase%2028.8%20-%20QA%20Consolidation/) |
| Phase 28.9 database optimization | **COMPLETE** (9.5/10) | [Phase 28.9 - Database Optimization](./Phase%2028.9%20-%20Database%20Optimization/) |
| Phase 28.10 backend/API optimization | **COMPLETE** (9.2/10) | [Phase 28.10 - Backend API Optimization](./Phase%2028.10%20-%20Backend%20API%20Optimization/) |
| Optimization (28.11–28.14) | **NOT STARTED** | 28.10 certified; next: Redis/cache/queue |
| Final certification (28.15) | **NOT STARTED** | — |

## Phase map

| Phase | Folder | Purpose |
|-------|--------|---------|
| 28.1 | [Phase 28.1 - Production QA Strategy](./Phase%2028.1%20-%20Production%20QA%20Strategy/) | Baseline metrics & test strategy |
| 28.2 | Phase 28.2 - Database Testing | Schema integrity & query analysis |
| 28.3 | Phase 28.3 - Backend API Testing | API domain coverage |
| 28.4 | [Phase 28.4 - Frontend Testing](./Phase%2028.4%20-%20Frontend%20Testing/) | SPA routes, bundles, UX states — **COMPLETE WITH CONDITIONS** |
| 28.5 | [Phase 28.5 - Full Stack Integration](./Phase%2028.5%20-%20Full%20Stack%20Integration/) | E2E + seed parity — **COMPLETE WITH CONDITIONS** |
| 28.6 | [Phase 28.6 - Security Testing](./Phase%2028.6%20-%20Security%20Testing/) | AuthZ, IDOR, uploads — **COMPLETE WITH CONDITIONS** |
| 28.7 | [Phase 28.7 - Performance & Load Testing](./Phase%2028.7%20-%20Performance%20%26%20Load%20Testing/) | Load profiles & capacity — **COMPLETE WITH CONDITIONS** |
| 28.8 | [Phase 28.8 - QA Consolidation](./Phase%2028.8%20-%20QA%20Consolidation/) | Master register + release recommendation — **COMPLETE** |
| 28.9–28.15 | Optimization & certification | After blocker remediation |

## Verification scripts (instrumentation)

Added for Stage 28 diagnostics (no business-logic changes):

```text
backend/scripts/stage28-redis-verify.php   # Cache + Redis raw ops + queue connection
backend/scripts/stage28-queue-verify.php   # Dispatch + queue:work --once
```

## Rules of engagement

- **Allowed:** tests, instrumentation, profiling, security hardening, bug fixes, config corrections, documentation
- **Not allowed without justification:** new features, UI redesign, business-rule changes, breaking API changes, architectural rewrites
- **Sessions:** remain on **database** driver (not Redis) per Stage 28 scope
- **Evidence required:** every optimization must include before/after measurements

## Next step

Phase 28.8 QA consolidation is complete. **Release recommendation: REMEDIATE BLOCKERS FIRST.** Await authorization for **Phase 28.9** remediation/optimization.
