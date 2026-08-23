# Stage 19 — Browser QA Results

**Date:** 2026-08-23  
**Method:** Automated regression (PHPUnit 509, Vitest, typecheck, build) + static auth-boundary code audit. No Playwright/Cypress in repo — manual spot-check recommended before production.

## Automated coverage

| Area | Result |
|------|--------|
| Admin isolation (`AdminIsolationTest`) | ✅ 17 tests — dual session, logout independence, admin-only blocked from marketplace APIs |
| Route guards (`routes.test.tsx`, auth context tests) | ✅ |
| Checkout price authority | ✅ `ShippingStage101HardeningTest` |
| Vendor/customer IDOR | ✅ `OrderAuthorizationTest` |
| Frontend typecheck + build | ✅ |

## Static audit — identity mixing

| Scenario | Expected | Verified by |
|----------|----------|-------------|
| Admin login → marketplace `/profile` | Blocked | `EnsureMarketplaceAccess` + `AdminIsolationTest` |
| Admin login → `/api/v1/orders` | 403 | `test_admin_only_cannot_list_marketplace_orders` |
| Admin login → checkout preview | 403 | `test_admin_only_cannot_preview_checkout` |
| Marketplace vendor → `/admin` | Redirect/unauthorized | `ProtectedAdminRoute` |
| Admin logout ≠ marketplace logout | Independent | `AdminIsolationTest` cross-context tests |
| React Query namespaces | Separated | `isAdminQueryKey` + separate providers |

## Manual matrix (recommended)

| Actor | Login | Profile | Dashboard | RTL | Status |
|-------|-------|---------|-----------|-----|--------|
| Admin | `/admin/login` | N/A (admin shell) | `/admin` | Toggle locale in admin | Spot-check |
| Customer | `/auth` | `/profile` | `/customer` | ar/en switcher | Spot-check |
| Vendor | `/auth` | `/profile` | `/dashboard/vendor` | Spot-check |
| Provider | `/auth` | `/profile` | `/dashboard/provider` | Spot-check |
| Marketer | `/auth` | `/profile` | `/dashboard/affiliate` | Spot-check |
| Guest | — | Redirect to auth | Public catalog | Spot-check |

## Findings

- **None blocking** from automated gate.
- Guest cart is intentionally public (session-based) — admin-only users must not authenticate via marketplace login (enforced).
