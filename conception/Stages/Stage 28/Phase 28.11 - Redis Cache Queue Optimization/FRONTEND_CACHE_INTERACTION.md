# Frontend ↔ Backend Cache Interaction

---

## Global TanStack Query defaults (`queryClient.ts`)

| Option | Value | Effect |
|--------|-------|--------|
| `staleTime` | 60_000 ms | Reduces refetch churn |
| `refetchOnWindowFocus` | false | Avoids tab-focus storms |
| `retry` | 1 | Limits error retry load |

---

## Changes (28.11)

| Hook | Before | After | Rationale |
|------|--------|-------|-----------|
| `useVendor` | `staleTime: 0` | `60_000` | Public vendor profile is stable; was causing redundant API hits |
| `useProvider` | `staleTime: 0` | `60_000` | Same for service providers |
| `useSearchProducts` | default 60s | `30_000` | Search results slightly fresher than generic default |

---

## Intentionally aggressive refetch (unchanged)

| Hook | Pattern | Reason |
|------|---------|--------|
| `useNotifications` | 120s / 300s poll | Reconcile with server unread counter |
| `useChat` | 120s poll | Fallback when websocket down |
| `usePayment` | Conditional poll | Payment status terminal state |
| `MarketplaceMaintenanceGate` | 30s poll | Ops visibility |
| `useAdminOperationalHealth` | 30s poll | Admin dashboard |
| `useAdminDetailQuery` | `staleTime: 0` | Edit forms need fresh data |
| `useVendorTeam` | `staleTime: 0` + poll | Team membership changes |

---

## Backend cache alignment

| Frontend data | Backend cache | Coherence |
|---------------|---------------|-----------|
| Catalog search | 300s facets | OK — public data |
| Vendor detail | None (DB) | OK — 60s client stale acceptable |
| Admin analytics | 60–300s server | Frontend 120–300s staleTime aligned |
| Notifications unread | 300s Redis counter | Polling 120s < TTL |

---

## HTTP / CDN boundary (28.13 prep)

- Authenticated API responses: **no CDN cache**
- Public catalog JSON: app-cache + client staleTime; CDN cache headers deferred to 28.13
- Static assets (`frontend/public/`): browser/CDN cacheable — not Redis-related

---

## Assessment

**PARTIAL → improved** — Removed unnecessary `staleTime: 0` on public store/provider pages. Full frontend perf pass remains Phase 28.12.
