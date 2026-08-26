# Phase 26.4 & 26.5 — Completion Report

**Date:** 2026-08-26  
**Branch:** `dev`  
**Verdict:** COMPLETE (acceptance gates passed)

---

## Summary

Extended V1 shipping and coupon systems additively:

- **26.4:** Modular carrier → zone → method → rule → rate engine with weight/volumetric tiers, vendor profiles, admin configuration, checkout integration with V1 fallback.
- **26.5:** Scoped/exclusion coupons, fixed discounts, per-user limits, stackability rules, refund-safe discount allocation, admin coupon routes restored.

---

## Verification evidence

| Gate | Result |
|------|--------|
| Backend tests | **650/650 passed** |
| Pint | **pass** (6 files auto-fixed) |
| Frontend tests | **120/120 passed** |
| ESLint | **pass** |
| TypeScript | **pass** |
| Production build | **pass** |

### New backend tests

- `AdvancedShippingTest` — 4 tests
- `AdvancedCouponTest` — 4 tests

**Total new tests:** 8 (642 → 650)

---

## Database migrations

1. `2026_08_26_260400_create_advanced_shipping_tables.php`
2. `2026_08_26_260500_extend_vendor_coupons_advanced.php`

MySQL index name length issue resolved (`vendor_ship_profiles_vendor_idx`).

---

## Remaining limitations

1. **Admin shipping UI** — carrier list + create; zone/rule/profile management via API only (no full wizard UI yet).
2. **Free shipping coupons** — type exists; applies $0 product discount (shipping waiver hook deferred).
3. **Multi-coupon stack per vendor** — pipeline supports rules; checkout still accepts one code per vendor (V1 contract).
4. **Address geocoding** — zone match uses city/district string equality, not postal ranges.
5. **Vendor self-service profiles** — admin creates profiles; vendor dashboard toggle for `use_advanced_rules` via existing settings API field only.

---

## Files of note

### Backend

- `app/Services/Shipping/ShippingRuleEngine.php`
- `app/Services/Shipping/ZoneResolver.php`
- `app/Services/Shipping/ShippingWeightCalculator.php`
- `app/Services/Coupon/CouponEligibleSubtotalService.php`
- `app/Services/Coupon/CouponEvaluationService.php`
- `app/Http/Controllers/Api/V1/Admin/AdminShippingConfigurationController.php`

### Frontend

- `frontend/src/admin/pages/AdminShippingConfigurationPage.tsx`
- `frontend/src/App.tsx` — coupon + shipping admin routes

### Documentation

- `PHASE_26_4_SHIPPING_AUDIT.md`
- `PHASE_26_5_COUPONS_AUDIT.md`
- `PHASE_26_4_5_ACCEPTANCE_MATRIX.md`
- `PHASE_26_4_ADVANCED_SHIPPING.md`
- `PHASE_26_5_ADVANCED_COUPONS.md`

---

## Security improvements

- Structured logging: `shipping_quote_failed`, `coupon_validation_failed`, `coupon_redemption_conflict`, `coupon_limit_reached`
- Payment-time coupon re-validation before usage increment
- Proportional refund prevents over-refunding pre-discount line amounts

---

## Performance

- Zone config cached (10 min TTL, flush on admin mutation)
- Coupon scopes/exclusions eager-loaded in validation query
- Product weight loaded with existing cart item eager load in checkout
