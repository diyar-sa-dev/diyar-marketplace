# CURRENT_STATE.md

> **Last updated:** 2026-08-19  
> **Maintained by:** AI development agents after each phase completion  
> **Canonical plans:** [conception/MASTER_DEVELOPMENT_PLAN.md](../conception/MASTER_DEVELOPMENT_PLAN.md) · [conception/Stages/Stage 13/README.md](../conception/Stages/Stage%2013/README.md)

---

## Project

**DIYAR Marketplace** — Arabic RTL multi-vendor commerce + **service marketplace (provider portal)** — Saudi Arabia · SAR · 15% VAT

---

## Stage Status

| Stage | Status |
|-------|--------|
| Stages 0–12.5 | **COMPLETE** |
| **Stage 13 — Service Marketplace (Provider)** | **COMPLETE** (docs + provider UI wired) |
| **Stage 14 — Reviews audit** | **COMPLETE** (gap fixes, no rebuild) |
| **Stage 15 — Vendor percentage coupons** | **IN PROGRESS** (domain + checkout + vendor UI; polish in working tree) |

---

## Current Position

| Field | Value |
|-------|--------|
| **Branch** | `dev` |
| **Last commit** | `d197702` — feat(stage): Stage 13 Provider Portal |
| **Working tree** | Stage 14/15 + schedule negotiation UI + coupon UX (**uncommitted**) |

---

## Domain Split

| Portal | API prefix | UI route |
|--------|------------|----------|
| **Vendor** (commerce) | `/api/v1/dashboard/vendor/*` | `/dashboard/vendor/*` |
| **Provider** (services) | `/api/v1/dashboard/provider/*` | `/dashboard/service/*` |
| **Customer** | `/api/v1/*` | `/`, `/services`, `/service-requests`, etc. |

---

## Implemented (working tree since `d197702`)

### Service marketplace
- Provider dashboard: bookings, RFQ inbox, offers, finance, settings, services CRUD
- Schedule negotiation timeline + booking detail sections
- RFQ flow: accept offer → **provider confirmation** → payment (negotiation before pay)
- Direct booking + provider reviews
- Customer: service catalog, RFQ, bookings, wishlist

### Vendor coupons (Stage 15)
- `vendor_coupons` table, CRUD API, checkout apply/remove, usage on payment
- Vendor UI: `/dashboard/vendor/coupons` with share card + form modal
- Tests: `VendorCouponTest` (8/8)

### Reviews (Stage 14 audit)
- Unified customer review history (product + store + provider)
- Provider self-review guard test

---

## Key Backend Modules

```
backend/app/Services/Coupon/*          — vendor coupon validation, checkout, usage
backend/app/Services/ServiceMarketplace/* — RFQ, bookings, direct booking, reviews, finance
backend/app/Http/Controllers/Api/V1/ServiceMarketplace/*
backend/app/Http/Controllers/Api/V1/Dashboard/VendorCouponController.php
```

## Key Frontend Areas

```
frontend/src/pages/dashboard/Service*     — provider portal
frontend/src/pages/dashboard/VendorCoupons.tsx
frontend/src/components/services/BookingScheduleSection.tsx
frontend/src/components/coupon/*
frontend/src/pages/ServiceRequestsPage.tsx
```

---

## Last Validation (2026-08-19, local)

| Check | Result |
|-------|--------|
| `vendor/bin/pint --test` | Run after `pint` fix on dirty files |
| `php artisan test --filter=ServiceRfqWorkflowTest` | **10/10 PASS** |
| `php artisan test --filter=VendorCouponTest` | **8/8 PASS** |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |

---

## CI/CD

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml):
- **Frontend:** typecheck, eslint (full `src/**`), prettier, vitest, build
- **Backend:** composer install, pint, phpunit

---

## Next Actions

1. Commit working tree (recommended split: Stage 14/15 backend, provider UI polish, coupon UX)
2. Full regression: `php artisan test` + `npm test`
3. Sign off Stage 15 → update MASTER_DEVELOPMENT_PLAN
