# Stage 13 — Architecture Overview

> **Domain:** Service marketplace + **Provider Portal**  
> **Distinct from:** Stage 12 Vendor Portal (product commerce — see [Stage 12](../Stage%2012/README.md))

---

## Application layers

```text
Customer Application (React)
        │
        ├── Public service catalog (/services, /service/:id, /provider/:slug)
        ├── RFQ & bookings (/profile/service-requests, booking panels)
        └── Service wishlist / follow

Provider Application (React — /dashboard/service/*)
        │
        ├── Client requests inbox (RFQ)
        ├── Bookings lifecycle
        ├── My services CRUD
        ├── Finance & payouts
        ├── Reviews inbox
        └── Settings & work policy

Backend (Laravel — /api/v1/*)
        │
        ├── Public read APIs (catalog, providers)
        ├── Customer authenticated APIs (RFQ, offers, bookings, payment, reviews)
        └── Provider dashboard APIs (/dashboard/provider/*)

Database (SQLite/MySQL)
        │
        └── service_* , provider_* tables (see DATABASE.md)
```

---

## Domain relationship diagram

```text
Customer
   │
   ├── browses ──► Service Catalog (13.1)
   │                    │
   │                    └── ProviderAccount (provider profile)
   │
   ├── creates ──► ServiceRequest / RFQ (13.2)
   │                    │
   │                    └── ServiceOffer ◄── Provider submits (13.3)
   │                              │
   │                              └── accept ──► ServiceBooking (13.4)
   │                                              │
   │                                              ├── Payment (13.5)
   │                                              ├── Direct booking path (13.8)
   │                                              └── ProviderReview (14.x, inbox 13.9)
   │
   └── manages ──► Provider Portal (13.6–13.10)
                         │
                         ├── Services CRUD
                         ├── Bookings (confirm/start/complete/schedule)
                         ├── Finance (13.7)
                         └── Settings + WorkPolicy (13.10)
```

**Not in Stage 13 scope:** Vendor product orders, vendor shipping, vendor coupons (Stage 12 / 15). Providers and vendors are separate account types with separate dashboards.

---

## Ownership boundary

| Account type | Model | Dashboard prefix | Owns |
|--------------|-------|------------------|------|
| Provider | `ProviderAccount` | `/dashboard/service/*` | Services, service bookings, RFQ offers, provider finance, provider settings |
| Vendor | `VendorAccount` | `/dashboard/vendor/*` | Products, vendor orders, shipping, vendor coupons |

Provider A **cannot** access Provider B's dashboard data. Enforcement:

- Middleware: `role:provider,admin` on `/dashboard/provider/*`
- Services resolve `user->providerAccount` and compare IDs
- Booking/offer/request queries scoped by `provider_account_id`

---

## Key backend modules

| Layer | Location |
|-------|----------|
| Controllers | `backend/app/Http/Controllers/Api/V1/ServiceMarketplace/*` |
| Services | `backend/app/Services/ServiceMarketplace/*` |
| Models | `backend/app/Models/Service*.php`, `Provider*.php` |
| Resources | `backend/app/Http/Resources/Service*.php`, `Provider*.php` |
| Enums | `backend/app/Enums/Service*.php`, `Provider*.php` |
| Presenter | `backend/app/Support/ServiceMarketplace/ServiceMarketplacePresenter.php` |

---

## Key frontend modules

| Layer | Location |
|-------|----------|
| Provider pages | `frontend/src/pages/dashboard/Service*.tsx` |
| Provider hooks | `frontend/src/hooks/provider/*` |
| Provider API | `frontend/src/api/providerDashboard.ts` |
| Customer service pages | `frontend/src/pages/ServicesPage.tsx`, `ServicePage.tsx`, `ProviderPage.tsx` |
| Shared components | `frontend/src/components/provider/*`, `components/services/*` |

---

## Future Admin (control plane)

Stage 13 operational data will later be managed by a **separate Admin application**. See [FUTURE_ADMIN_MANAGEMENT.md](./FUTURE_ADMIN_MANAGEMENT.md).

Admin is **not** implemented in Stage 13. Existing `/api/v1/admin/*` routes (categories, payouts) are minimal and unrelated to full marketplace management.

---

## Stage roadmap (documentation)

```text
Stage 12 — Vendor Portal (products, orders, shipping)
        ↓
Stage 13 — Provider Portal (services, RFQ, bookings)  ← THIS STAGE
        ↓
Stage 14 — Reviews audit & hardening
        ↓
Stage 15 — Vendor coupons
        ↓
Future Admin Stage — platform management control plane
```
