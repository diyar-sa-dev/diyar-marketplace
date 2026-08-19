# Stage 15 — Vendor Coupons

> **Date:** 2026-08-19  
> **Decision:** **IMPLEMENTED** — vendor-owned, store-scoped percentage coupons

---

## Phases

| Phase | Document | Status |
|-------|----------|--------|
| 15.1 Coupon Domain | [Phase 15.1/PHASE-15.1-COUPON-DOMAIN.md](./Phase%2015.1/PHASE-15.1-COUPON-DOMAIN.md) | **Complete** |
| 15.2 Vendor Management UI | [Phase 15.2/PHASE-15.2-VENDOR-UI.md](./Phase%2015.2/PHASE-15.2-VENDOR-UI.md) | **Complete** |
| 15.3 Checkout Integration | [Phase 15.3/PHASE-15.3-CHECKOUT.md](./Phase%2015.3/PHASE-15.3-CHECKOUT.md) | **Complete** |
| 15.4 Usage & Lifecycle | [Phase 15.4/PHASE-15.4-USAGE.md](./Phase%2015.4/PHASE-15.4-USAGE.md) | **Complete** |
| 15.5 Testing | [Phase 15.5/PHASE-15.5-TESTING.md](./Phase%2015.5/PHASE-15.5-TESTING.md) | **Complete** |

---

## V1 rules (enforced server-side)

- **Owner:** exactly one `vendor_account_id` per coupon
- **Type:** `percentage` only (5–90%)
- **Scope:** discounts only matching vendor subtotal in multi-vendor checkout
- **Apply ≠ consume:** preview validates; usage recorded on paid order only
- **Historical integrity:** order snapshots `coupon_code`, `coupon_percent_snapshot`, `discount_amount`

---

## API

| Method | Route |
|--------|-------|
| GET | `/api/v1/dashboard/vendor/coupons` |
| POST | `/api/v1/dashboard/vendor/coupons` |
| GET | `/api/v1/dashboard/vendor/coupons/{id}` |
| PATCH | `/api/v1/dashboard/vendor/coupons/{id}` |
| POST | `/api/v1/dashboard/vendor/coupons/{id}/activate` |
| POST | `/api/v1/dashboard/vendor/coupons/{id}/deactivate` |

Checkout: `vendor_coupons[]` on preview + order payloads.

---

## Out of scope (V1)

- Fixed-amount coupons
- Category/product targeting
- Admin-created coupons
- Automatic coupon discovery
