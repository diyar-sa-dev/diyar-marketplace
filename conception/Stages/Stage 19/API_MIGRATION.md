# Stage 19 — Frontend API Migration

**Status:** In progress (core commerce API-driven; marketing prototypes deferred)  
**Last updated:** 2026-08-23

## Goal

Replace mock/static business data in the Marketplace SPA with authoritative Laravel API contracts, React Query hooks, and standard UI states.

## Architecture

```text
Laravel API (routes → controllers → services → resources)
        ↓
Typed API client (axios + CSRF)
        ↓
React Query hooks (domain query keys)
        ↓
Page / dashboard components (presentation only)
```

Admin remains on the separate `adminApi` + `AdminAuthContext` control plane (Stage 18).

## Migration status

| Domain | API | React Query | UI states | Notes |
|--------|-----|-------------|-----------|-------|
| Catalog (products, categories) | ✅ | ✅ | ✅ | `useCatalog` |
| Cart & checkout | ✅ | ✅ | ✅ | `useCart`, checkout preview |
| Orders (customer) | ✅ | ✅ | ✅ | |
| Wishlist & profile | ✅ | ✅ | ✅ | |
| Notifications | ✅ | ✅ | ✅ | |
| Vendor dashboard | ✅ | ✅ | ✅ | Products, orders, inventory, shipping, payouts |
| Provider dashboard | ✅ | ✅ | ✅ | Services, requests, bookings |
| Affiliate dashboard | ✅ | ✅ | ✅ | Links, commissions, payouts |
| Reviews (store/product) | ✅ | ✅ | ✅ | |
| B2B directory | ❌ | — | Static prototype | No backend contract yet |
| Blog / CMS articles | ❌ | — | Static prototype | `BlogArticlePage` uses `MOCK_ARTICLE` |
| Sidebar projects widget | ❌ | — | Cosmetic | `MOCK_PROJECTS` in `SidebarMenu` — future feature |
| Visual search | Partial | — | Coming-soon UX | i18n placeholder until API exists |

## Deferred mocks (documented)

These pages intentionally use static content until a backend CMS/B2B module is specified:

- `frontend/src/pages/B2BCompanyPage.tsx` — `COMPANIES`, `MOCK_REVIEWS`
- `frontend/src/pages/B2BPage.tsx` — static company list
- `frontend/src/pages/BlogArticlePage.tsx` — `MOCK_ARTICLE`
- `frontend/src/components/layout/SidebarMenu.tsx` — `MOCK_PROJECTS`

**Rule:** No silent mock fallback on API failure for commerce flows. Errors surface via `ErrorState` + retry.

## Verification

```bash
cd frontend
npm run typecheck
npm run build
```

Grep audit:

```bash
rg "MOCK_" frontend/src --glob '!**/*.test.*'
```

Expected: only deferred marketing/CMS files above.
