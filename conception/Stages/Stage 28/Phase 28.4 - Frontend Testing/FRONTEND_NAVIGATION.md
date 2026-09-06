# Phase 28.4 — Navigation & UX Flow Testing

---

## Playwright journey coverage

| Journey | Spec | Result |
|---------|------|--------|
| Customer cart/checkout | `customer-journey.spec.ts` | **PASS** |
| Vendor dashboard | `vendor-journey.spec.ts` | **PASS** |
| Provider services | `provider-journey.spec.ts` | **PASS** |
| Admin operations | `admin-journey.spec.ts` | **PASS** |
| Messaging | `messaging.spec.ts` | **PASS** |
| Auth isolation | `auth-isolation.spec.ts` | **PASS** |
| Blog public | `blog.spec.ts` | **FAIL** (missing article in dev DB) |
| Blog admin CRUD | `blog-admin.spec.ts` | **PASS** |
| B2B admin filter | `b2b-admin.spec.ts` | **FAIL** (missing draft in dev DB) |
| Projects sidebar | `projects.spec.ts` | **FAIL** (modal intercept) |

**Total:** 33 pass / 3 fail / 3 skipped (serial b2b after fail)

---

## Deep link / refresh (E2E verified)

| Flow | Evidence |
|------|----------|
| Session refresh preserves admin/marketplace identity | auth-isolation |
| Logout one session preserves other | auth-isolation |
| Vendor registration → vendor dashboard | routes.test + vendor-journey |

---

## Navigation patterns (source)

| Pattern | Implementation |
|---------|----------------|
| React Router `Link` / `Navigate` | Storefront + dashboard |
| Admin legacy redirects | Hash redirects for analytics |
| Breadcrumbs | Category/product pages |
| Query params | Search, pagination on lists |

---

## Known dead-end / UX risks

| Risk | ID |
|------|-----|
| Admin unknown route → `/admin` not 404 | KI-028-042 |
| Projects modal blocks nav click | KI-028-041 |

---

## Gate

```text
PARTIAL
```

Core commerce journeys pass; 3 E2E failures (2 env, 1 UI).
