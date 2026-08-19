# Stage 13 — Frontend Reference (Provider Portal)

> Provider dashboard routes use prefix `/dashboard/service/*` (not `/dashboard/provider/*` — that is the API path).

---

## Routes (`frontend/src/App.tsx`)

| Route | Page component | Role |
|-------|----------------|------|
| `/dashboard/service` | `ServiceDashboard.tsx` | provider, admin |
| `/dashboard/service/client-requests` | `ServiceClientRequests.tsx` | provider |
| `/dashboard/service/client-requests/:id` | `ServiceClientRequestDetails.tsx` | provider |
| `/dashboard/service/bookings` | `ServiceBookings.tsx` | provider |
| `/dashboard/service/services` | `ServiceServices.tsx` | provider |
| `/dashboard/service/finance` | `ServiceFinance.tsx` | provider |
| `/dashboard/service/reviews` | `ServiceReviewsInbox.tsx` | provider |
| `/dashboard/service/settings` | `ServiceSettings.tsx` | provider |
| `/dashboard/service/notifications` | `Notifications.tsx` | provider (placeholder) |

**Layout:** `DashboardLayout.tsx` — provider nav block with `ProviderPortalGuard`.

---

## Customer-facing service pages

| Route | Page |
|-------|------|
| `/services` | `ServicesPage.tsx` |
| `/service/:id` | `ServicePage.tsx` |
| `/provider/:id` | `ProviderPage.tsx` |

---

## API clients

| File | Purpose |
|------|---------|
| `frontend/src/api/providerDashboard.ts` | Provider inbox, bookings, services CRUD, actions |
| `frontend/src/api/services.ts` | Public catalog |
| `frontend/src/api/serviceEngagement.ts` | Wishlist |
| `frontend/src/hooks/provider/useProviderDashboard.ts` | React Query hooks for provider data |
| `frontend/src/hooks/provider/useProviderSettings.ts` | Settings mutations |
| `frontend/src/types/providerDashboard.ts` | Typed API responses |

---

## Key components

| Component | Purpose |
|-----------|---------|
| `components/provider/ProviderRequestCardSkeleton.tsx` | Inbox loading |
| `components/provider/ProviderBookingCardSkeleton.tsx` | Bookings loading |
| `components/services/ScheduleNegotiationTimeline.tsx` | Schedule negotiation UI |
| `components/services/DirectBookingModal.tsx` | Customer direct booking |
| `components/services/CustomerServiceBookingsPanel.tsx` | Customer booking list |
| `lib/providerDashboardUi.ts` | Formatting helpers |
| `lib/scheduleNegotiation.ts` | Timeline step derivation |

---

## UX patterns (implemented)

| Pattern | Where |
|---------|-------|
| Loading skeletons | Client requests, bookings |
| Error state + retry | All provider list pages |
| Empty states | Inbox tabs, bookings tabs |
| Pagination | Server-driven via `PaginationBar` |
| Debounced search | Client requests, bookings |
| Tab filters | Open vs offered requests; booking status tabs |
| WhatsApp deep link | Booking detail (`lib/whatsapp.ts`) |
| RTL support | `useLocale().dir` on all pages |
| API error parsing | `parseApiError`, `collectDisplayErrors` |

---

## Permissions

- Route guard: `ProtectedRoute roles={[RoleName.Provider, RoleName.Admin]}`
- Portal switcher: `getAccessibleDashboardPortals()` in `lib/auth/roles.ts`
- No client-side-only security — all actions re-validated by API

---

## Provider portal navigation

Defined in `DashboardLayout.tsx` provider nav:

```text
Home → Client requests → Bookings → My services → Reviews → Finance → Settings
```

Icons: Lucide. Labels from `provider.nav.*` i18n keys (EN + AR in `locales/en.ts`, `locales/ar.ts`).

---

## Deferred frontend

| Item | Status |
|------|--------|
| Provider notifications backend | Placeholder page only |
| Provider team management | Not in Stage 13 (vendor has team) |
| Admin moderation UI | Future Admin stage |
