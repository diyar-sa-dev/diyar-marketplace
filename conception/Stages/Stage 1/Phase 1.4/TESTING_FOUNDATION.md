# Phase 1.4 — Testing Foundation

> **Status:** CURRENT  
> **Stage:** 1 — Engineering Foundation

---

## Backend — PHPUnit

**Decision:** PHPUnit (Laravel 13 default). Pest not adopted in Stage 1.

| Area | Location |
|------|----------|
| Feature tests | `backend/tests/Feature/` |
| Unit tests | `backend/tests/Unit/` |
| Test DB | SQLite in-memory (`phpunit.xml`) |
| Run | `cd backend && php artisan test` |

### Stage 1 Coverage

- `HealthEndpointTest` — success envelope + JSON 404
- Example tests retained from Laravel scaffold

### Future Critical Domains (Stage 2+)

Authorization, inventory, checkout, payments, ledger, commission, orders, returns, services.

---

## Frontend — Vitest

**Decision:** Vitest + jsdom + Testing Library.

| Area | Location |
|------|----------|
| Unit tests | `src/**/*.test.ts` |
| Setup | `src/test/setup.ts` |
| Config | `vitest.config.ts` |
| Run | `cd frontend && npm test` |

### Stage 1 Coverage

- `utils/errors.test.ts` — API error parsing

---

## Test Environment

- Backend CI uses SQLite — no MySQL required in CI
- Frontend tests run in jsdom — no browser required
