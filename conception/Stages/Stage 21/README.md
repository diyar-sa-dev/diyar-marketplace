# Stage 21 — Enterprise Testing

**Status:** PARTIAL  
**Last updated:** 2026-08-23

## Scope

- Backend feature/API regression (commerce, identity, admin, chat, shipping, returns)
- Security regression (IDOR, auth isolation, checkout authority, webhooks)
- Frontend unit tests (Vitest) for auth, validation, mappers
- Browser E2E (Playwright) — scaffolded, opt-in

## Backend pyramid

| Layer | Coverage | Status |
|-------|----------|--------|
| Unit | Commission, returns policy, vendor order filters | **PARTIAL** |
| Feature/API | 520+ tests across domains | **VERIFIED** |
| Security regression | AdminIsolation, ProductIdor, OrderAuthorization, CatalogSearchSecurity, PaymentWebhookSecurity | **VERIFIED** |

## Frontend

| Layer | Status |
|-------|--------|
| Vitest (auth, mappers, admin context) | **PARTIAL** |
| Component/integration (search, checkout, cart) | **BLOCKED** — not introduced |
| Playwright E2E | **SCAFFOLDED** — see `frontend/e2e/` |

## Playwright (opt-in)

```bash
# Terminal 1 — backend (seeded demo data)
cd backend && php artisan serve

# Terminal 2 — frontend
cd frontend && npm run dev

# Terminal 3 — E2E
cd frontend
npm install
npm run test:e2e:install
E2E_ENABLED=1 E2E_BASE_URL=http://localhost:3000 E2E_API_URL=http://localhost:8000/api/v1 npm run test:e2e
```

E2E is **not** in CI yet (requires running stack). Backend `AdminIsolationTest` provides API-level dual-session proof.

## Acceptance gates

| Gate | Status |
|------|--------|
| Backend unit for critical business logic | PARTIAL |
| Feature/API coverage | VERIFIED |
| Frontend component tests | PARTIAL |
| Playwright installed | VERIFIED (scaffold) |
| Customer/vendor/provider/admin E2E flows | BLOCKED |
| Dual-context auth E2E | SCAFFOLDED (opt-in) |
| CI runs critical tests | VERIFIED (PHPUnit + Vitest) |

See [STAGE_21_COMPLETION_REPORT.md](./STAGE_21_COMPLETION_REPORT.md).
