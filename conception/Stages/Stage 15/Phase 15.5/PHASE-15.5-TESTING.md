# Phase 15.5 — Testing & Verification

> **Status:** **Complete**

---

## Automated tests

`tests/Feature/Api/V1/Coupon/VendorCouponTest.php`:

| Test | Covers |
|------|--------|
| `test_vendor_can_create_and_manage_coupon` | CRUD + activate/deactivate |
| `test_customer_cannot_create_vendor_coupon` | Authorization |
| `test_invalid_percentage_is_rejected` | 5–90% bounds |
| `test_duplicate_code_within_store_is_rejected` | Normalization + unique |
| `test_checkout_preview_applies_store_scoped_coupon_without_consuming_usage` | Apply ≠ consume |
| `test_coupon_usage_is_recorded_after_successful_payment` | Snapshot + usage row |
| `test_store_mismatch_coupon_is_rejected` | Cross-vendor block |
| `test_vendor_cannot_access_other_vendor_coupon` | IDOR |

---

## Verification commands (2026-08-19)

```text
php artisan migrate --force          → vendor_coupons migration OK
php artisan test --filter=VendorCouponTest → 8/8 PASS
php artisan test                     → 374/375 PASS (1 flaky direct-booking idempotency)
npm run build                        → PASS
```

---

## Regression scope

Checkout preview, order creation, payment finalization, vendor portal nav — no intentional breaking changes to Stage 12–13 flows.
