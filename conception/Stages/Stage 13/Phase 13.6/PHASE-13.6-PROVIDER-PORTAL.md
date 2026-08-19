# Phase 13.6 — Provider Portal Shell

> **Status:** **COMPLETE**  
> **Scope:** Dashboard layout, navigation, role routing, API wiring foundation.

---

## Problem solved

Service providers need a dedicated operational portal separate from the vendor product portal (Stage 12), with role-aware access and consistent navigation.

---

## Frontend structure

| Item | Implementation |
|------|----------------|
| Layout | `DashboardLayout.tsx` — provider nav section |
| Guard | `ProviderPortalGuard.tsx` |
| Entry | `/dashboard/service` → `ServiceDashboard.tsx` |
| Portal routing | `App.tsx` routes under `dashboard/service/*` |
| Role resolution | `lib/auth/roles.ts` — `DashboardPortalKey.Provider` |

---

## Navigation modules

| Nav item | Route | Phase |
|----------|-------|-------|
| Home | `/dashboard/service` | 13.7 |
| Client requests | `/dashboard/service/client-requests` | 13.2, 13.3 |
| Bookings | `/dashboard/service/bookings` | 13.4, 13.8 |
| My services | `/dashboard/service/services` | 13.1 |
| Reviews | `/dashboard/service/reviews` | 13.9 |
| Finance | `/dashboard/service/finance` | 13.7 |
| Settings | `/dashboard/service/settings` | 13.10 |

---

## API integration

Central client: `frontend/src/api/providerDashboard.ts`  
Hooks: `frontend/src/hooks/provider/useProviderDashboard.ts`

All provider pages use React Query for server state — **no hardcoded mock data** in wired pages.

---

## Authorization

- `ProtectedRoute roles={[RoleName.Provider, RoleName.Admin]}`
- Backend: `Route::middleware('role:provider,admin')->prefix('dashboard/provider')`

---

## UX foundation

- RTL via `useLocale().dir`
- Skeleton loaders for list pages
- `ErrorState` with retry
- `PaginationBar` for server pagination
- i18n: `provider.nav.*` keys (EN + AR)

---

## Tests

Indirect coverage via feature tests hitting `/api/v1/dashboard/provider/*` endpoints.

Portal UI: manual QA; no dedicated E2E suite for Stage 13.

---

## Outside this phase

- Provider team/multi-user access (vendor portal has team; provider does not)
- Notifications backend (placeholder page exists)

---

## Relationship to Stage 12

| Portal | Account | Route prefix |
|--------|---------|--------------|
| Vendor | `VendorAccount` | `/dashboard/vendor/*` |
| Provider | `ProviderAccount` | `/dashboard/service/*` |

Users with both roles see both portals in account hub switcher.
