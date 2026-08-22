# Auth Context Isolation — Stage 18

## Problem

Admin and Marketplace share one Laravel app, one `users` table, and (in local dev) one origin. Without explicit boundaries, browser session state, React auth providers, API clients, and React Query caches can bleed across contexts — e.g. an Admin session appearing as a Marketplace customer on `/profile`.

## Architecture

```text
                 DIYAR
                   │
        ┌──────────┴──────────┐
        │                     │
   MARKETPLACE             ADMIN OPS
        │                     │
 MarketplaceAuth          AdminAuth
 (useMarketplaceAuth)     (useAdminAuth)
        │                     │
 marketplaceApi           adminApi
        │                     │
 /api/v1/auth/*           /api/v1/admin/*
        │                     │
 web guard session        admin guard session
```

## Backend

| Concern | Implementation |
|--------|----------------|
| Guards | `web` (marketplace), `admin` (operations) — `config/auth.php` |
| Marketplace login | `POST /api/v1/auth/login` → `AuthService::establishMarketplaceSession()` |
| Admin login | `POST /api/v1/admin/auth/login` → `AuthService::establishAdminSession()` |
| Marketplace identity | `GET /api/v1/auth/me` — `auth:sanctum` + `marketplace.access` |
| Admin identity | `GET /api/v1/admin/session` — `auth:admin` |
| Admin-only accounts | Blocked from marketplace login/me via `MarketplaceAccess::canAccessMarketplace()` |
| Role middleware | `EnsureUserHasRole` — `admin` guard on `api/v1/admin/*`; marketplace routes prefer `web` guard with safe Sanctum test fallback when admin guard is inactive |
| Marketplace policies | Admin role bypass removed on marketplace routes (orders, products, vendor/provider accounts). Admin payout actions require `admin` guard context via `VendorPayoutPolicy::isAdminOpsContext()` |
| Explicit helpers | `MarketplaceGuard`, `MarketplaceAccess::isAdminOnlyAccount()` |
| Logout isolation | `logoutMarketplace()` / `logoutAdmin()` preserve the other guard when both exist |
| Session cookie | Single Laravel session cookie with separate guard keys (`login_web_*`, `login_admin_*`) |

### Session cookie decision

Separate cookie names (`diyar_marketplace_session` / `diyar_admin_session`) were **not** introduced. Laravel stores both guards in one session namespace; `AuthService` selectively forgets guard-specific keys on partial logout. This is the safest incremental approach without rewriting CSRF/session middleware.

Subdomain split (`admin.diyar.com`) remains environment-driven for future deployment hardening.

## Frontend

`AdminAuthProvider` lives at the app root (`main.tsx`), not inside `/admin` routes. This keeps admin React state alive when an operator uses **View Store** and returns to the panel, and prevents `useAdminAuth must be used within AdminAuthProvider` crashes during route transitions.

| Concern | Implementation |
|--------|----------------|
| Provider mounting | `AdminAuthProvider` at app root (`main.tsx`); survives store ↔ admin navigation |
| Application context | `ApplicationContext = 'marketplace' \| 'admin'` in `lib/auth/applicationContext.ts` |
| Marketplace auth | `AuthContext` / `useMarketplaceAuth` — never active on `/admin/*` |
| Admin auth | `AdminAuthProvider` / `useAdminAuth` — refresh on `/admin/*` only; state preserved on store |
| API clients | `marketplaceApi` and `adminApi` in `api/client.ts` |
| 401 handling | Context-scoped via `registerUnauthorizedHandler(context, …)` |
| Query cache | `marketplace` / `admin` key roots (`cartKeys` → `['marketplace','cart',…]`); logout clears only its context |
| Locale in admin | `LocaleSwitcher` (no marketplace auth) in admin layout/login; `LanguageSwitcher` remains marketplace-only |
| Profile | Marketplace `/profile` uses marketplace auth only; admin profile at `/admin/settings` |

## Route matrix (summary)

| Route | Context |
|-------|---------|
| `/`, `/products`, `/search` | public / marketplace |
| `/cart`, `/checkout`, `/profile`, `/dashboard/*` | marketplace (authenticated) |
| `/admin`, `/admin/*` | admin |
| `/auth` | marketplace guest |

## Tests

- `backend/tests/Feature/Admin/AdminIsolationTest.php` — guard isolation, dual sessions, cross-context logout
- `backend/tests/Feature/Api/V1/Order/OrderAuthorizationTest.php` — dual-role admin cannot view another customer's order via marketplace
- `frontend/src/context/AuthContext.test.tsx` — marketplace bootstrap skipped on `/admin/*`
- `frontend/src/admin/auth/AdminAuthContext.test.tsx` — admin session bootstrap skipped outside `/admin/*`
- Regression: `php artisan test` (504), `npm run typecheck`, `npm run build`, `npm test` (101)

## Verification status

| Layer | Status |
|-------|--------|
| Backend automated | **PASS** — 504/504 |
| Frontend automated | **PASS** — typecheck, build, 101 unit tests |
| Manual browser QA (multi-tab, View Store → Profile, RTL/mobile) | **NOT RUN** — required before claiming full isolation |

## Acceptance verdict

**FAIL — ISOLATION STILL HAS GAPS** until manual browser QA (spec §28) is executed and recorded. Automated boundaries are in place; the reported production bug class must be re-validated in Chrome with concurrent admin + marketplace sessions.
