# Phase 15.1 — Coupon Domain

> **Status:** **Complete**

---

## Database

Migration: `2026_08_19_280000_create_vendor_coupons.php`

### `vendor_coupons`

| Column | Notes |
|--------|-------|
| `vendor_account_id` | FK, cascade delete |
| `code` | Unique per vendor, normalized uppercase |
| `type` | `percentage` (enum-ready for `fixed`) |
| `value` | 5–90 |
| `minimum_order` | decimal, default 0 |
| `maximum_discount` | nullable cap |
| `starts_at` / `ends_at` | nullable window |
| `usage_limit` | nullable = unlimited |
| `used_count` | aggregate cache |
| `is_active` | boolean |

### `vendor_coupon_usages`

Unique `(vendor_coupon_id, order_id)` — idempotent consumption.

### `vendor_orders` extensions

`vendor_coupon_id`, `coupon_code`, `coupon_percent_snapshot`

---

## Services

| Service | Role |
|---------|------|
| `VendorCouponManagementService` | CRUD, activate/deactivate |
| `VendorCouponValidationService` | Effective status, checkout rules |
| `VendorCouponCalculationService` | Percentage + max cap |
| `CheckoutCouponService` | Per-vendor resolution |
| `VendorCouponUsageService` | Record on paid order, lock + limit check |

---

## Config

`config/diyar.php` → `coupons.percentage_min/max`

Lang: `diyar.coupons.*` (EN + AR)
