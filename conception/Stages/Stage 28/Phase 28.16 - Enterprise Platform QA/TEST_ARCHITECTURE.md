# Enterprise Test Architecture

**Phase:** 28.16  
**Objective:** Repeatable, evidence-backed full-platform verification

---

## Test Pyramid

```text
                    ┌─────────────────────┐
                    │  Certification Tier  │  soak, scale DB, multi-node
                    │  (nightly/manual)    │
                    └──────────┬──────────┘
               ┌───────────────┴───────────────┐
               │  E2E Playwright (browser)      │  ~72 tests → expand commerce
               └───────────────┬───────────────┘
          ┌────────────────────┴────────────────────┐
          │  Integration (Redis, queue, Reverb)      │  6 Redis; queue TBD
          └────────────────────┬────────────────────┘
     ┌─────────────────────────┴─────────────────────────┐
     │  Feature/API PHPUnit (~775)                        │
     └─────────────────────────┬─────────────────────────┘
┌────┴────────────────────────────────────────────────────┐
│  Unit PHPUnit + Vitest (~128)                            │
└─────────────────────────────────────────────────────────┘
```

---

## Environments

| Tier | Stack | Use |
|------|-------|-----|
| **Dev quick** | SQLite, array cache, artisan serve | PHPUnit default, local dev |
| **CI PR** | SQLite + Redis (E2E), sync queue | GitHub Actions fast gate |
| **Integration** | Docker Redis/MySQL | Redis tests, DB EXPLAIN |
| **Production-like** | Nginx + Octane + MySQL 8 + Redis 7 | k6, certification |
| **E2E full** | Preview build + API (target: Docker) | Playwright journeys |

---

## Orchestration

```text
scripts/qa/run-platform-certification.ps1
├── quick          → pint, vitest, phpunit (default env)
├── integration    → + redis-integration, mysql explain
├── e2e            → bootstrap + playwright
├── security       → rate limit, upload, auth isolation subset
├── load           → k6 smoke + mixed rps10
└── certification  → all above + evidence to _raw/
```

---

## Evidence Output

All certification runs write to:

```text
conception/Stages/Stage 28/Phase 28.16 - Enterprise Platform QA/_raw/{timestamp}/
├── phpunit.json
├── vitest.txt
├── playwright-report/
├── k6-*.json
├── redis-integration.txt
└── summary.md
```

---

## Test Isolation Rules

1. **Deterministic seeders** — `DatabaseSeeder`, demo users in `e2e/fixtures/credentials.ts`
2. **No test order dependency** — PHPUnit parallel-safe where possible
3. **Cleanup** — `RefreshDatabase` for feature tests; E2E fresh sqlite per bootstrap
4. **Redis** — `@group redis-integration` skipped unless Redis reachable
5. **Payment** — `DIYAR_PAYMENT_USE_FAKE_GATEWAY=true` in test env

---

## CI Integration (target)

| Job | Tier | Trigger |
|-----|------|---------|
| `frontend` | quick | every PR |
| `backend` | quick | every PR |
| `backend-mysql` | integration | every PR |
| `e2e` | e2e | every PR |
| `redis-integration` | integration | every PR (new) |
| `k6-analytics` | load smoke | every PR |
| Nightly | certification subset | cron |

---

## Naming Conventions

| Layer | Location | Pattern |
|-------|----------|---------|
| API feature | `backend/tests/Feature/` | `*Test.php` |
| Integration | `backend/tests/Integration/` | grouped |
| E2E | `frontend/e2e/` | `*.spec.ts` |
| Vitest | `frontend/src/**/*.test.ts` | colocated |
| k6 | `scripts/performance/` | `*.js` |
| QA scripts | `scripts/qa/` | `*.ps1` |
