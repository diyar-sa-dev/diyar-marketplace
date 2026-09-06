# Phase 26.4 — Advanced Shipping Audit

**Date:** 2026-08-26  
**Branch:** `dev`  
**Baseline:** Stage 10 (V1 shipping)

---

## Executive summary

V1 shipping is **flat-rate + pickup per vendor** with server-side quotes in checkout preview and order creation. Stage 26.4 extends this with **carrier → zone → method → rule → rate** without breaking existing behavior. When `use_advanced_rules` is false (default), the legacy `CarrierFlatRateStrategy` path remains authoritative.

---

## Existing capabilities (Stage 10)

| Area | Status | Location |
|------|--------|----------|
| Vendor shipping settings | ✅ | `vendor_shipping_settings`, `VendorShippingSettings` |
| Flat-rate carrier | ✅ | `CarrierFlatRateStrategy` |
| Pickup | ✅ | `PickupStrategy` |
| Quote service | ✅ | `ShippingQuoteService` |
| Checkout preview integration | ✅ | `CheckoutPreviewService` |
| Order creation recalc | ✅ | `OrderCreationService` calls preview inside transaction |
| Per-vendor shipping snapshots | ✅ | `vendor_orders.shipping_*`, `Shipment` |
| Vendor dashboard UI | ✅ | `VendorShippingSettingsPanel.tsx` |
| Customer checkout UI | ✅ | `CheckoutPage.tsx` |
| Admin shipments (read-only) | ✅ | `AdminShipmentController`, shipments list |
| Policies | ✅ | `VendorShippingSettingsPolicy` |
| Tests | ✅ | 26 tests under `tests/Feature/Api/V1/Shipping/` |

### V1 behavior preserved

- Shipping cost is **never** accepted from the frontend; only method selection per vendor.
- Free-shipping threshold evaluated **per vendor subtotal**.
- Multi-vendor carts sum independent vendor shipping quotes.
- Pickup shipping cost = `0.00` with location label snapshot.

---

## Gaps for 26.4

| Requirement | V1 | Gap |
|-------------|-----|-----|
| Carrier / zone rules | Flat rate only | No `shipping_carriers`, `shipping_zones`, rule engine |
| Weight tiers | N/A | No `products.weight_kg`; weight not in quote math |
| Dimension / volumetric tiers | Columns exist (`width`, `height`, `depth`) | Unused in shipping |
| Vendor shipping profiles | Single settings row per vendor | No profile / tier configuration |
| Destination-aware quotes | Address stored but ignored for rates | `Address` has city/district only |
| Admin shipping configuration | Shipments read-only | No CRUD for carriers/zones/tiers |
| Quote expiration | N/A | Not required for MVP; recalc on order create suffices |
| Structured logging | Partial | No `shipping_quote_failed` events |

---

## Code inventory

### Backend

- `app/Services/Shipping/ShippingQuoteService.php` — strategy registry
- `app/Services/Shipping/Strategies/CarrierFlatRateStrategy.php`
- `app/Services/Shipping/Strategies/PickupStrategy.php`
- `app/Services/Shipping/DTO/ShippingQuote.php`
- `app/Services/Shipping/VendorShippingSettingsService.php`
- `app/Http/Controllers/Api/V1/Dashboard/VendorShippingSettingsController.php`

### Frontend

- `frontend/src/hooks/vendor/useVendorShippingSettings.ts`
- `frontend/src/components/dashboard/vendor/VendorShippingSettingsPanel.tsx`
- `frontend/src/pages/CheckoutPage.tsx`

### Config

- `config/diyar.php` → `shipping.default_carrier_flat_rate`

---

## Domain invariants (must preserve)

1. Frontend cannot set shipping amounts — server calculates.
2. Shipping belongs to the correct vendor split.
3. Checkout preview and order creation use the **same** quote pipeline.
4. Shipping cannot be negative.
5. Unsupported zones / weight / dimensions fail safely (422, not silent zero).
6. Vendor A cannot read or modify vendor B profiles (IDOR).
7. Order totals remain consistent with `OrderTotalsReconciliationService`.
8. Refunds use historical `vendor_orders.shipping_cost` snapshot (unchanged).

---

## Implementation plan (26.4)

1. **Schema:** `shipping_carriers`, `shipping_zones`, `shipping_methods`, `shipping_rate_rules`, `vendor_shipping_profiles`; add `products.weight_kg`; extend `vendor_shipping_settings`.
2. **Engine:** `ShippingContext` → `ZoneResolver` → `ShippingRuleEngine` → `RateCalculator` → `ShippingQuote`.
3. **Integration:** Extend `ShippingQuoteService::quoteVendorGroupWithContext()`; `CheckoutPreviewService` passes address + cart items.
4. **Fallback:** `use_advanced_rules=false` → existing flat-rate strategy.
5. **Admin API + UI:** CRUD for carriers, zones, methods, rate rules, vendor profiles.
6. **Tests:** Zone resolution, weight/volumetric tiers, mixed vendor cart, invalid weight, IDOR, regression on flat-rate.

---

## Security notes

| Threat | Mitigation |
|--------|------------|
| Vendor profile IDOR | Policy scoped to `vendor_account_id` |
| Rate tampering | No client-supplied amounts |
| Negative weight/dimensions | Validation + bcmath guards |
| Oversized payloads | Request validation limits |
| Unauthorized admin config | `admin.permission:shipping.manage` |

---

## Performance notes

- Cache carrier/zone/rule config (Redis, TTL) — immutable between admin edits.
- Eager-load product weight/dimensions in checkout preview (avoid N+1).
- Batch vendor profile lookup for multi-vendor carts.

---

## Verdict

**Ready to implement.** V1 baseline is stable; extension is additive with explicit fallback.

---

## Hardening pass (post `aa6843c`)

**Date:** 2026-08-26

| Gap found | Resolution | Status |
|-----------|------------|--------|
| Zone resolver picked first DB row | Specificity scoring + priority + id tie-break | ✅ FIXED |
| Cache key used address ID | Location-scoped v2 cache key | ✅ FIXED |
| Rate rule ambiguity | Vendor/zone specificity before sort_order | ✅ FIXED |
| No admin shipping security tests | `AdminShippingSecurityTest` | ✅ FIXED |
| Admin zones list missing | `GET /admin/shipping/zones` | ✅ FIXED |
| Admin UI incomplete | Carriers only — zones/rules UI deferred | ⚠️ DEFERRED |
| Postal zone matching | Resolver supports prefix; Address lacks postal_code | ⚠️ DEFERRED |
| Query-count performance gate | Not measured | ⚠️ DEFERRED |
