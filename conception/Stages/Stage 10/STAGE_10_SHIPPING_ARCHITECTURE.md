# Stage 10 — Shipping Architecture (V1)

## Status

| Area | Status |
|------|--------|
| Per-vendor shipping configuration | **IMPLEMENTED** |
| Flat rate + free threshold + pickup | **IMPLEMENTED** |
| Checkout per-vendor selection | **IMPLEMENTED** |
| Server-authoritative calculation | **IMPLEMENTED** |
| Historical shipping snapshots | **IMPLEMENTED** |
| Shipment + tracking foundation | **IMPLEMENTED** |
| Vendor fulfillment API | **IMPLEMENTED** |
| Vendor order management UI | **IMPLEMENTED** |
| Carrier API integrations | **DEFERRED** |
| External tracking sync | **DEFERRED** |
| `shipping_methods` / `shipping_rules` / `shipping_rates` tables | **DEFERRED** (V1 uses `vendor_shipping_settings`) |

## Business model

```
DIYAR Platform
    ├── Vendor A → Shipping Config → Carrier (25 SAR) + Pickup
    ├── Vendor B → Shipping Config → Carrier (15 SAR)
    └── Vendor C → Shipping Config → Free above threshold + Pickup
```

**There is no global marketplace shipping rate.** Each vendor sub-order is quoted independently; order `shipping_total = SUM(vendor shipping)`.

## Repository inspection summary

Stage 7 already implemented core checkout shipping. Stage 10 completed:

- Fulfillment lifecycle API (accept → process → ship → deliver → cancel)
- Shipment tracking fields (`tracking_number`, `carrier`, `shipped_at`, `delivered_at`)
- Vendor dashboard order management UI (rebuilt from historical mock patterns)
- Expanded automated test coverage
- Explicit `ShippingCalculatorInterface` contract

## Database model (V1)

### `vendor_shipping_settings`

Per-vendor configuration (one row per vendor):

| Column | Purpose |
|--------|---------|
| `carrier_enabled` | Delivery method on/off |
| `carrier_flat_rate` | Flat delivery price |
| `carrier_free_shipping_enabled` | Threshold toggle |
| `carrier_free_shipping_threshold` | Sub-order subtotal threshold |
| `pickup_enabled` | Store pickup on/off |
| `pickup_location_label` | Pickup address label |

### `vendor_orders` (historical snapshot)

Immutable at order creation:

- `shipping_method` (`carrier` \| `pickup`)
- `shipping_cost`
- `pickup_location_label`
- `free_shipping_applied`

### `shipments`

One shipment per vendor order (created at order placement):

- `status`: `pending` → `prepared` → `shipped` → `delivered` (or `cancelled`)
- `tracking_number`, `carrier`, `shipped_at`, `delivered_at`

### Deferred tables

`shipping_methods`, `shipping_rules`, `shipping_rates`, dedicated `tracking` entity — not required for V1; `vendor_shipping_settings` + strategy interface is sufficient.

## Calculation architecture

```
CheckoutPreviewService
    └── VendorGroupService (group cart by vendor)
            └── ShippingQuoteService
                    └── ShippingMethodStrategy (ShippingCalculatorInterface)
                            ├── CarrierFlatRateStrategy
                            └── PickupStrategy
```

Future:

```
ShippingQuoteService
    └── ShippingProviderInterface (DEFERRED)
            ├── FlatRateProvider (V1)
            ├── CarrierApiProvider (Aramex, SMSA, DHL…)
            └── DistanceProvider
```

Checkout, order totals, and payment allocation **do not change** when a carrier adapter is added.

## Checkout flow

1. Cart grouped by `vendor_account_id`
2. Load each vendor's `VendorShippingSettings`
3. Customer selects method **per vendor** (`vendor_delivery_selections`)
4. Backend recalculates shipping (frontend never sends amounts)
5. VAT computed on `subtotal + shipping` per vendor
6. Order + vendor_orders store snapshots

## Security

- Frontend submits only `{ vendor_account_id, method }` selections
- Backend validates method ownership, availability, and recalculates cost
- Vendor shipping settings scoped to authenticated vendor account
- Vendors cannot fulfill another vendor's orders (policy + FK scope)

## Stage 9 financial integration

- Shipping included in `vendor_total` and `order.grand_total`
- `PaymentVendorAllocation.shipping_cost` snapshotted at payment initiation
- Commission calculated on product subtotals only (shipping excluded)
- Escrow release on `VendorOrder.delivered`
- **Existing paid orders are never recalculated**

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET/PUT | `/api/v1/dashboard/vendor/shipping-settings` | Vendor config |
| POST | `/api/v1/checkout/preview` | Per-vendor quote |
| POST | `/api/v1/orders` | Create order with snapshots |
| GET | `/api/v1/dashboard/vendor/orders` | Vendor order list |
| GET | `/api/v1/dashboard/vendor/orders/{id}` | Vendor order detail |
| POST | `.../accept` | Accept order |
| POST | `.../process` | Start preparing (+ shipment `prepared`) |
| POST | `.../ship` | Mark shipped (+ tracking) |
| POST | `.../deliver` | Mark delivered |
| POST | `.../cancel` | Cancel order + shipment |

## Frontend

- **CheckoutPage** — per-vendor method selection, cost display, pickup label
- **VendorShippingSettingsPanel** — carrier + pickup configuration (API-backed)
- **VendorOrders** — filters, search, detail view, fulfillment actions
- **OrdersPage** — customer shipment progress + tracking number when available

## Payment independence

Stage 10 does not modify `PaymentGatewayInterface`. Local/test gateway remains the default for development; MyFatoorah is an optional future adapter.

## Testing

`php artisan test` — 232 tests including:

- `VendorShippingSettingsTest`
- `ShippingCheckoutIntegrationTest` (multi-vendor, pickup, threshold, immutability)
- `ShippingStage101HardeningTest` (tampering, idempotency, allocation, cancel)
- `Stage101ManualE2eVerificationTest` (full multi-vendor E2E with evidence)
- `VendorOrderFulfillmentTest` (lifecycle, tracking, authorization)
- Existing checkout/payment/finance tests

## Future boundary (Stage 11)

V1 uses `ShippingCalculatorInterface` for local per-vendor quotes (flat rate, pickup, threshold).

Stage 11 carrier integrations implement `ShippingProviderInterface` — live quotes, label creation, tracking sync — without replacing checkout snapshot logic or recalculating historical orders.

```
ShippingService (future orchestrator)
        │
        ├─ ShippingCalculatorInterface   ← V1 (FlatRate, Pickup)
        └─ ShippingProviderInterface   ← Stage 11 (Manual, Aramex, SMSA, …)
```

See `STAGE_10_1_VERIFICATION_REPORT.md` for hardening evidence and E2E results.

## Deferred (Stage 11+)

- Aramex / SMSA / DHL / FedEx carrier APIs
- Real-time carrier quotes
- Automatic tracking synchronization
- Weight/dimension/distance pricing
- Admin-defined global shipping rules
- Pickup branch CRUD (V1 uses single label)
