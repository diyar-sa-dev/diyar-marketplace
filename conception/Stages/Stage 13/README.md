# Stage 13 — Service Marketplace (Provider)

> **Date started:** 2026-08-18  
> **Status:** **IN PROGRESS** — core workflow implemented; **Provider Portal integration pending sign-off**  
> **Prerequisite:** [Stage 12.5](../Stage%2012.5/README.md) — vendor extensions **COMPLETE**  
> **Domain:** **Provider / services** (not vendor commerce — see Stage 12)  
> **Last updated:** 2026-08-18

---

## Stage objective

Deliver a production-real **service marketplace** on top of existing identity, media, and payment infrastructure:

```text
Catalog → RFQ → Provider offers → Customer acceptance → Payment → Booking lifecycle
```

Customer storefront and backend APIs for phases **13.1–13.5** are implemented in the working tree. **Provider Portal React pages remain mock at `HEAD`** and require wiring to `/dashboard/provider/*` before Stage 13 sign-off.

---

## Completion matrix

| Phase | Name | Backend | Customer UI | Provider UI | Status |
|-------|------|---------|---------------|-------------|--------|
| 13.1 | Service Catalog | ✅ | ✅ | N/A | **COMPLETE** |
| 13.2 | Customer RFQ | ✅ | ✅ | N/A | **COMPLETE** |
| 13.3 | Provider Offers | ✅ | ✅ (accept) | ⏳ mock | **COMPLETE** (API); portal **PENDING** |
| 13.4 | Booking | ✅ | ✅ (view) | ⏳ mock | **COMPLETE** (API); portal **PENDING** |
| 13.5 | Service Payment | ✅ (dev simulate) | ✅ | N/A | **COMPLETE** (dev gateway) |
| — | **Provider Portal** | ✅ APIs ready | — | ⏳ **PENDING** | **BLOCKS SIGN-OFF** |

**Stage 13 overall:** **IN PROGRESS**

---

## Phases

| Phase | Document |
|-------|----------|
| 13.1 Service Catalog | [Phase 13.1/PHASE-13.1-SERVICE-CATALOG.md](./Phase%2013.1/PHASE-13.1-SERVICE-CATALOG.md) |
| 13.2 Customer RFQ | [Phase 13.2/PHASE-13.2-CUSTOMER-RFQ.md](./Phase%2013.2/PHASE-13.2-CUSTOMER-RFQ.md) |
| 13.3 Provider Offers | [Phase 13.3/PHASE-13.3-PROVIDER-OFFERS.md](./Phase%2013.3/PHASE-13.3-PROVIDER-OFFERS.md) |
| 13.4 Booking | [Phase 13.4/PHASE-13.4-BOOKING.md](./Phase%2013.4/PHASE-13.4-BOOKING.md) |
| 13.5 Service Payment | [Phase 13.5/PHASE-13.5-SERVICE-PAYMENT.md](./Phase%2013.5/PHASE-13.5-SERVICE-PAYMENT.md) |

Supporting artifacts:

- [STAGE_13_PROGRESS_REPORT.md](./STAGE_13_PROGRESS_REPORT.md)
- [TEST-RESULTS.md](./TEST-RESULTS.md)
- [ACCEPTANCE-MATRIX.md](./ACCEPTANCE-MATRIX.md)

---

## Deferred (not Stage 13 sign-off scope)

| Item | Target |
|------|--------|
| Service reviews | Stage 14.2 |
| Production MyFatoorah for service bookings | Stage 17 / payment hardening |
| Chat / WhatsApp on offers | Intentionally disabled |
| Provider booking accept/reject (pre-payment) | No backend equivalent — UX TBD |
| Provider notes persistence on complete | Future enhancement |

---

## Tests (Stage 13 API)

| Suite | Tests |
|-------|-------|
| `ServiceCatalogTest` | 12 |
| `ServiceRfqWorkflowTest` | 9 |
| **Total** | **21** |

Full repository suite (2026-08-18 audit): **345** backend · **82** frontend.

---

*Maintained by development team.*
