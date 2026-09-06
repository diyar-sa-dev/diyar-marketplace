# Query Complexity Audit — Stage 26.4

**Date:** 2026-08-26

## Shipping checkout preview

| Scenario | Query budget | Result |
|----------|--------------|--------|
| 1 cart item (advanced rules) | baseline | measured in test |
| 10 cart items (same vendor) | baseline + 5 max | VERIFIED (`CheckoutShippingQueryCountTest`) |

## Optimizations applied

1. **`ShippingRuleCatalog`** — single `whereIn(shipping_method_id)` load per preview
2. **`VendorShippingSettingsService::batchForVendors`** — batch settings + profile eager load
3. **Preloaded rules passed via `ShippingQuoteContext`** — avoids per-vendor rule query

## Index additions

| Table | Index | Pattern |
|-------|-------|---------|
| `vendor_coupon_usages` | `(vendor_coupon_id, user_id)` | per-user limit checks |

## Not measured

- 50-item cart (test uses bounded +5 gate instead)
- Multi-vendor advanced shipping simultaneously
