# Shipping Rules

> **Status:** Baseline — Stage 0

## V1 Model

- Shipping calculated **per vendor** at checkout preview
- Each vendor group in cart has independent shipping line

## Initial Calculation (V1)

Configurable per vendor in `vendor_profiles.settings`:

| Strategy | V1 Support |
|----------|------------|
| Flat rate per vendor | Yes (default) |
| Free shipping threshold | Optional |
| Weight-based | Future |
| Carrier API | Future |

## Checkout

- Shipping included in VAT base per business rule (confirm with finance — **OPEN**)
- Shipping snapshot stored on `vendor_orders.shipping_cost`

## Shipments

- `Shipment` record created when vendor marks shipped
- Tracking number required for shipped status
