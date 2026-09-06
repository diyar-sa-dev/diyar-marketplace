# Stage 26.2 — Testing Guide

## Backend (PHPUnit)

```bash
cd backend
php artisan test tests/Feature/Api/V1/B2b/
```

| File | Coverage |
|------|----------|
| `B2bCompanyTest.php` | Public list, detail, categories, draft hiding, lead auth |
| `AdminB2bCompanyTest.php` | Admin CRUD, publish, verify, security, N+1, duplicate lead, IDOR |

Full suite:

```bash
php artisan test
vendor/bin/pint --test
```

## Frontend (Vitest)

```bash
cd frontend
npm test -- src/pages/__tests__/B2BPage.test.tsx src/pages/__tests__/B2BCompanyPage.test.tsx
npm run lint
npm run typecheck
npm run build
```

Unit tests cover:

- Directory title, cards, loading skeletons, empty state
- Company detail render, guest RFQ redirect, authenticated RFQ success

## E2E (Playwright)

Requires running app + seeded `B2bE2eSeeder` data.

```bash
cd frontend
npm run test:e2e -- e2e/b2b.spec.ts e2e/b2b-admin.spec.ts
```

| Spec | Journey |
|------|---------|
| `b2b.spec.ts` | Browse directory → open company; guest RFQ → login redirect |
| `b2b-admin.spec.ts` | Admin create/publish/verify; draft hidden; customer blocked; customer RFQ success |

Credentials: `frontend/e2e/fixtures/credentials.ts`

## Manual QA checklist

- [ ] `/b2b` search + category filter + pagination
- [ ] `/b2b/:slug` portfolio, services, RFQ modal
- [ ] Admin create/edit modal saves correctly
- [ ] Publish/unpublish/verify/feature actions
- [ ] RTL layout on mobile
- [ ] Error/retry states on API failure
