# Stage 13 — Service Marketplace & Provider Portal

> **Date:** 2026-08-19  
> **Decision:** **STAGE 13 — COMPLETE**  
> **Domain:** **Provider / services** (product commerce = [Stage 12](../Stage%2012/README.md))  
> **Prerequisite:** Stage 12 vendor portal **COMPLETE**

---

## Stage objective

Deliver a production-real **service marketplace** and **provider operational portal**:

```text
Catalog → RFQ / Direct booking → Offers → Acceptance → Payment → Booking lifecycle → Reviews
```

Provider portal at `/dashboard/service/*` is wired to `/api/v1/dashboard/provider/*`.

---

## Status summary

| Area | Status |
|------|--------|
| Service catalog (13.1) | ✅ Complete |
| Customer RFQ (13.2) | ✅ Complete |
| Provider offers (13.3) | ✅ Complete |
| Booking lifecycle (13.4) | ✅ Complete |
| Service payment (13.5) | ✅ Complete (dev simulate) |
| Provider portal (13.6) | ✅ Complete |
| Provider finance (13.7) | ✅ Complete |
| Direct booking & schedule (13.8) | ✅ Complete |
| Provider reviews inbox (13.9) | ✅ Complete |
| Provider settings & work policy (13.10) | ✅ Complete |
| **Stage 13 overall** | **✅ COMPLETE** |

Known limitations: production payment gateway, admin moderation, provider notifications backend — see [STAGE_13_COMPLETION_REPORT.md](./STAGE_13_COMPLETION_REPORT.md).

---

## Completed phases

| Phase | Document |
|-------|----------|
| 13.1 Service Catalog | [Phase 13.1/PHASE-13.1-SERVICE-CATALOG.md](./Phase%2013.1/PHASE-13.1-SERVICE-CATALOG.md) |
| 13.2 Customer RFQ | [Phase 13.2/PHASE-13.2-CUSTOMER-RFQ.md](./Phase%2013.2/PHASE-13.2-CUSTOMER-RFQ.md) |
| 13.3 Provider Offers | [Phase 13.3/PHASE-13.3-PROVIDER-OFFERS.md](./Phase%2013.3/PHASE-13.3-PROVIDER-OFFERS.md) |
| 13.4 Booking | [Phase 13.4/PHASE-13.4-BOOKING.md](./Phase%2013.4/PHASE-13.4-BOOKING.md) |
| 13.5 Service Payment | [Phase 13.5/PHASE-13.5-SERVICE-PAYMENT.md](./Phase%2013.5/PHASE-13.5-SERVICE-PAYMENT.md) |
| 13.6 Provider Portal | [Phase 13.6/PHASE-13.6-PROVIDER-PORTAL.md](./Phase%2013.6/PHASE-13.6-PROVIDER-PORTAL.md) |
| 13.7 Provider Finance | [Phase 13.7/PHASE-13.7-PROVIDER-FINANCE.md](./Phase%2013.7/PHASE-13.7-PROVIDER-FINANCE.md) |
| 13.8 Direct Booking | [Phase 13.8/PHASE-13.8-DIRECT-BOOKING.md](./Phase%2013.8/PHASE-13.8-DIRECT-BOOKING.md) |
| 13.9 Provider Reviews | [Phase 13.9/PHASE-13.9-PROVIDER-REVIEWS.md](./Phase%2013.9/PHASE-13.9-PROVIDER-REVIEWS.md) |
| 13.10 Provider Settings | [Phase 13.10/PHASE-13.10-PROVIDER-SETTINGS.md](./Phase%2013.10/PHASE-13.10-PROVIDER-SETTINGS.md) |

---

## Architecture documentation

| Document | Contents |
|----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layer diagram, domain relationships, ownership |
| [DATABASE.md](./DATABASE.md) | Tables, FKs, migrations |
| [API-REFERENCE.md](./API-REFERENCE.md) | All Stage 13 endpoints |
| [FRONTEND.md](./FRONTEND.md) | Routes, pages, components, hooks |
| [BUSINESS-RULES.md](./BUSINESS-RULES.md) | Server-side rules & test mapping |
| [FUTURE_ADMIN_MANAGEMENT.md](./FUTURE_ADMIN_MANAGEMENT.md) | **Future Admin scope — NOT implemented** |

Supporting artifacts:

- [ACCEPTANCE-MATRIX.md](./ACCEPTANCE-MATRIX.md)
- [TEST-RESULTS.md](./TEST-RESULTS.md)
- [STAGE_13_COMPLETION_REPORT.md](./STAGE_13_COMPLETION_REPORT.md)

---

## Backend summary

- **Controllers:** `backend/app/Http/Controllers/Api/V1/ServiceMarketplace/*`
- **Services:** `backend/app/Services/ServiceMarketplace/*`
- **Models:** `Service`, `ServiceRequest`, `ServiceOffer`, `ServiceBooking`, `ProviderAccount`, `ProviderReview`, `ProviderWorkPolicy`, etc.
- **Routes:** Public catalog + customer authenticated + `/dashboard/provider/*`

---

## Frontend summary

- **Provider pages:** `frontend/src/pages/dashboard/Service*.tsx`
- **Customer pages:** `ServicesPage`, `ServicePage`, `ProviderPage`
- **API client:** `frontend/src/api/providerDashboard.ts`

---

## Provider vs Vendor (ownership)

| | Provider (Stage 13) | Vendor (Stage 12) |
|--|---------------------|-------------------|
| Account | `ProviderAccount` | `VendorAccount` |
| Dashboard | `/dashboard/service/*` | `/dashboard/vendor/*` |
| Sells | Services | Products |
| Commerce flow | RFQ → offer → booking | Cart → order → shipping |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for authorization details.

---

## Future Admin

Stage 13 defines what a **future centralized Admin application** must manage. **No admin marketplace UI is implemented in Stage 13.**

See [FUTURE_ADMIN_MANAGEMENT.md](./FUTURE_ADMIN_MANAGEMENT.md).

---

## Stage roadmap

```text
Stage 12 — Vendor Portal
Stage 13 — Provider Portal          ← COMPLETE
Stage 14 — Reviews
Stage 15 — Vendor Coupons
Future Admin — Platform management
```

---

## Tests (Stage 13 suites)

| Suite | Tests |
|-------|-------|
| `ServiceCatalogTest` | 12 |
| `ServiceRfqWorkflowTest` | 9 |
| `ProviderReviewAndDirectBookingTest` | 10+ |
| `ProviderDashboardExtrasTest` | 3+ |
| `ServiceWishlistTest` | — |

See [TEST-RESULTS.md](./TEST-RESULTS.md) for latest run results.

---

*Maintained by development team — reflects actual implementation as of 2026-08-19.*
