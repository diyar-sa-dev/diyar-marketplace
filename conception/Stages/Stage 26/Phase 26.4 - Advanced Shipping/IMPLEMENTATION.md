# Phase 26.4 — Advanced Shipping

**Status:** COMPLETE  
**Date:** 2026-08-26

## Architecture

```
CheckoutPreviewService
    ↓
ShippingQuoteService::quoteVendorGroup(settings, method, subtotal, ShippingQuoteContext)
    ↓
[use_advanced_rules=false] → CarrierFlatRateStrategy / PickupStrategy (V1)
[use_advanced_rules=true]  → ShippingRuleEngine
    ↓
ZoneResolver → weight/dimension tier rules → ShippingQuote
```

### Domain model

| Table | Purpose |
|-------|---------|
| `shipping_carriers` | Platform carriers |
| `shipping_zones` | City/region matching with priority |
| `shipping_methods` | Carrier methods (`flat`, `weight_tier`, `dimension_tier`) |
| `shipping_rate_rules` | Weight/subtotal tiers, handling fees, free thresholds |
| `vendor_shipping_profiles` | Vendor-specific profile linking to method |
| `products.weight_kg` | Billable weight input |

`vendor_shipping_settings.use_advanced_rules` toggles engine; default `false` preserves V1 flat rate.

## API (admin)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/admin/shipping/carriers` | `shipping.view` |
| POST | `/admin/shipping/carriers` | `shipping.manage` |
| PATCH | `/admin/shipping/carriers/{carrier}` | `shipping.manage` |
| POST | `/admin/shipping/zones` | `shipping.manage` |
| POST | `/admin/shipping/rate-rules` | `shipping.manage` |
| POST | `/admin/shipping/vendor-profiles` | `shipping.manage` |

Checkout preview adds optional fields: `delivery_estimate_days`, `billable_weight_kg`.

## Security

- Vendor profile IDOR blocked by vendor-scoped policies (existing + admin-only config).
- No client-supplied shipping amounts.
- Negative/zero weight and invalid volumetric divisor rejected.

## Caching

- Zone lists cached 10 minutes; flushed on admin shipping config mutations.

## Tests

`tests/Feature/Api/V1/Shipping/AdvancedShippingTest.php` (4 cases) + 26 existing shipping tests.
