# Stage 20–22 — Gap Matrix & Status

**Last updated:** 2026-08-23  
**Auditor:** Principal engineering pass (code-first)

## Gap matrix (summary)

| Area | Current | Risk | Required | Action | Status |
|------|---------|------|----------|--------|--------|
| Auth isolation | Separate guards, `EnsureMarketplaceAccess`, `AdminIsolationTest` | Medium | No cross-context identity | API regression tests green | **VERIFIED** |
| Browser auth isolation | Playwright scaffold | Medium | Dual-session proof | `e2e/auth-isolation.spec.ts` (opt-in) | **SCAFFOLDED** |
| Admin services nav | Was in sidebar | Low | Hide from admin UI | Removed `/admin/services` nav item | **DONE** |
| Product card N+1 | Per-card review queries | High | Batch aggregates | `withCount`/`withAvg` on `cardQuery()` | **DONE** |
| Vendor list N+1 | Per-vendor store review queries | High | Batch aggregates | `withCount`/`withAvg` on vendor list | **DONE** |
| Search vendor facets N+1 | `find()` per facet row | Medium | Batch `whereIn` | `CatalogSearchService` batch load | **DONE** |
| Health observability | Basic status | Low | Readiness probes | DB + cache checks; prod env redaction | **DONE** |
| Catalog search security | Public endpoint | Medium | No internal leakage | `CatalogSearchSecurityTest` | **DONE** |
| Redis production | `.env.example` = redis | Medium | Redis in prod | Document + example env | **DOCUMENTED** |
| Load testing (k6) | Smoke script added | Medium | Baseline load tests | `scripts/performance/smoke.js` — not executed | **SCAFFOLDED** |
| Playwright E2E | Scaffold + auth isolation spec | Medium | Critical flows + auth isolation | Opt-in; not in CI | **PARTIAL** |
| Stage 20 sign-off | Partial | — | No Critical/High open | 526 tests pass | **PARTIAL** |
| Stage 21 sign-off | Folder + report | — | Test pyramid + E2E | Backend strong; E2E gaps | **PARTIAL** |
| Stage 22 sign-off | Folder + report | — | Redis + perf gates | Query fixes done; load test not run | **PARTIAL** |

## Stage status (honest)

### STAGE 20 — SECURITY: **PARTIAL / VERIFIED (automated gate)**

- Auth/admin isolation regression suite (526 tests)
- IDOR, checkout authority, rate limits, permissions documented
- Health production redaction + security headers tested
- Production cookie domain split — deploy-time (`AUTH_SECURITY.md`)
- Webhook replay expanded tests — deferred

### STAGE 21 — TESTING: **PARTIAL**

- 526 backend tests (feature + unit across commerce/security)
- `CatalogQueryPerformanceTest`, `CatalogSearchSecurityTest`
- Playwright scaffold (opt-in)
- Frontend component test coverage incomplete
- E2E not in CI

### STAGE 22 — PERFORMANCE: **PARTIAL**

- Product/vendor/search query optimization (N+1 removed)
- Redis documented in `.env.example`
- Catalog facet + suggestion Redis cache
- k6 smoke script — not executed
- 25K VUs — **NOT VERIFIED**

## Verification commands

```bash
cd backend && php artisan test && vendor/bin/pint --test
cd frontend && npm run lint && npm run typecheck && npm run build
E2E_ENABLED=1 npm run test:e2e   # optional, from frontend/
k6 run scripts/performance/smoke.js
```

## Full audit

See [FINAL_STAGE_20_21_22_AUDIT.md](../../../FINAL_STAGE_20_21_22_AUDIT.md).
