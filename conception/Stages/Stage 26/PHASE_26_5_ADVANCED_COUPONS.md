# Phase 26.5 — Advanced Coupons

**Status:** COMPLETE  
**Date:** 2026-08-26

## Evaluation pipeline

```
CouponEvaluationService
    ↓
VendorCouponValidationService (active, schedule, limits, feature flag)
    ↓
CouponEligibleSubtotalService (scope + exclusions)
    ↓
VendorCouponCalculationService (percentage / fixed / free_shipping)
    ↓
CouponEvaluationService::assertStackingRules
```

## Extensions

| Feature | Implementation |
|---------|----------------|
| Scope | `scope_type` + `vendor_coupon_scopes` (category, product) |
| Exclusions | `vendor_coupon_exclusions` (category, product, vendor) |
| Fixed discount | `VendorCouponType::Fixed` + `fixed_amount` |
| Per-user limits | `usage_limit_per_user` + validation at preview & payment |
| Stackability | `stackable`, `exclusive_group`, config max per vendor |
| Refunds | Proportional discount in `RefundCalculationService` |
| Snapshots | `coupon_discount_snapshot`, `coupon_type_snapshot` on `vendor_orders` |

## Commission

Unchanged: commission base remains **pre-discount line subtotals** (`CommissionResolver`).

## Order splitting

Scoped coupons compute eligible subtotal from cart lines per vendor; discount stored on each `vendor_order`.

## Admin UI

- `/admin/coupons` and `/admin/coupons/:id` routes wired in `App.tsx`.

## Tests

`tests/Feature/Api/V1/Coupon/AdvancedCouponTest.php` (4 cases) + 8 existing coupon tests.
