# Stage 20 — Marketplace Security

## Price & totals

Client cannot set authoritative:

- `sale_price`, `subtotal`, `discount_total`, `shipping_total`, `vat_amount`, `grand_total`

All computed in checkout preview and order placement services.

## Stock

- Reservations during checkout
- Vendor cannot purchase own product (`SelfPurchaseTest`)

## Vendor isolation

- Dashboard routes scoped to authenticated vendor's `vendor_account_id`
- Regression: `OrderAuthorizationTest::test_vendor_cannot_view_another_vendors_vendor_order`

## Customer isolation

- `OrderAuthorizationTest::test_customer_cannot_view_another_customers_order`
- Dual-role admin cannot view others' orders via marketplace API

## Coupons

Validated server-side: expiry, vendor scope, usage limits, minimum order — see checkout tests.

## Affiliate

- Click tracking throttled (`throttle:affiliate-click`)
- Link resolution throttled (`throttle:affiliate-resolve`)
- Commission calculated server-side from order data
