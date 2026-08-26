# Phase 26.5 — Advanced Coupons Audit

**Date:** 2026-08-26  
**Branch:** `dev`  
**Baseline:** Stage 15 (vendor-scoped percentage coupons)

---

## Executive summary

Coupons are **vendor-scoped**, **percentage-only**, one code per vendor at checkout. Usage is recorded on **payment success** with row-level locking. Stage 26.5 extends the engine with stackability, scopes, exclusions, per-user limits, fixed discounts, and refund-safe discount allocation — without breaking existing coupon API responses.

---

## Existing capabilities (Stage 15)

| Area | Status | Location |
|------|--------|----------|
| Coupon model | ✅ | `VendorCoupon`, `VendorCouponUsage` |
| Validation | ✅ | `VendorCouponValidationService` |
| Calculation | ✅ | `VendorCouponCalculationService` (percentage + max cap) |
| Checkout apply | ✅ | `CheckoutCouponService` |
| Usage on payment | ✅ | `VendorCouponUsageService` (lock + unique constraint) |
| Vendor CRUD UI | ✅ | `VendorCoupons.tsx` |
| Admin list/detail API | ✅ | `AdminCouponController` |
| Snapshots on order | ✅ | `vendor_orders.vendor_coupon_id`, `discount_amount`, `coupon_percent_snapshot` |
| Tests | ✅ | 8 tests in `VendorCouponTest.php` |

### V1 behavior preserved

- One coupon code per vendor group at checkout.
- Discount applied to **vendor subtotal** (pre-shipping, pre-VAT).
- Commission base = **pre-discount line subtotals** (`CommissionResolver` comment).
- Vendor absorbs discount (platform commission unchanged).
- Affiliate commission on pre-discount line base.
- Preview does **not** consume usage; payment finalization records usage.

---

## Gaps for 26.5

| Requirement | V1 | Gap |
|-------------|-----|-----|
| Stackability | One coupon per vendor | No `stackable`, `exclusive_group` |
| Exclusions | N/A | No category/product/vendor exclusions |
| Category/product scope | Vendor-wide only | No scoped eligible subtotal |
| Per-user limits | Global `usage_limit` only | No `usage_limit_per_user` |
| Fixed discount type | Percentage only | `VendorCouponType::Percentage` only |
| Free shipping coupon | N/A | Not implemented |
| Payment re-validation | Lock at usage time | Gap if limit hit between order and pay |
| Refund discount allocation | Uses gross line subtotals | Partial refund can over-refund vs paid amount |
| Admin UI routes | Pages exist | `App.tsx` redirects `/admin/coupons/*` to `/admin` |
| Feature flag | `coupons_enabled` in config | Not enforced at checkout |
| Rate limiting coupon tries | N/A | Add checkout coupon rate limit |

---

## Commission contract (confirmed)

From `CommissionResolver`:

> Commission base = vendor line subtotals (product value). Precedence: Product > Vendor > Category > Global.

**26.5 behavior:** Commission remains on **pre-discount** line subtotals. Coupon discount reduces vendor payable, not platform commission rate base.

---

## Order splitting

Mixed-vendor cart with vendor-scoped coupon:

- Vendor A subtotal discounted; Vendor B unchanged.
- Each `vendor_order` stores its own `discount_amount` snapshot.
- `CheckoutCouponService` resolves per `vendor_account_id`.

Category/product scope requires **eligible subtotal** computed from cart line items before discount calculation.

---

## Domain invariants (must preserve)

1. Coupon cannot be applied twice (unique `vendor_coupon_id + order_id`).
2. Usage limits enforced atomically (`lockForUpdate` + increment).
3. Expired / future / inactive coupons rejected server-side.
4. Discount cannot exceed eligible subtotal or create negative totals.
5. Exclusions win over inclusions.
6. Stacking rules deterministic (exclusive > non-stackable > stackable).
7. Historical coupon rules not reconstructed at refund — use `vendor_order.discount_amount` snapshot.

---

## Implementation plan (26.5)

1. **Schema:** Extend `vendor_coupons`; add `vendor_coupon_scopes`, `vendor_coupon_exclusions`; extend `VendorCouponType` (fixed).
2. **Pipeline:** `CouponEvaluationService` with testable stages.
3. **Calculation:** Scoped eligible subtotal; fixed + percentage; free shipping hook (future).
4. **Checkout:** Pass cart items to coupon service; enforce `coupons_enabled` flag.
5. **Usage:** Re-validate limits at payment finalization before increment.
6. **Refunds:** Proportional discount adjustment in `RefundCalculationService`.
7. **Admin UI:** Wire coupon routes in `App.tsx`.
8. **Tests:** Stackability, exclusions, scopes, per-user limits, race, mixed vendor, refunds.

---

## Security notes

| Threat | Mitigation |
|--------|------------|
| Brute-force discovery | Generic "invalid" message; rate limit on preview |
| Race on usage limit | `lockForUpdate` + unique constraint |
| Vendor scope bypass | Scope validation against cart line ownership |
| Replay / double apply | Idempotent order creation + unique usage row |
| Percentage > 100 | Validation on create/update |

---

## Verdict

**Ready to implement.** Extend existing services; do not replace checkout coupon contract.
