# Phase 7.4 — State Machines & Order APIs — Completion Report

**Status:** COMPLETE

## Delivered

- State services: `OrderStateService`, `VendorOrderStateService`, `PaymentStateService`, `ShipmentStateService`
- Customer APIs: `GET /orders`, `GET /orders/{order}`, `POST /orders/{order}/cancel`
- Vendor APIs: `GET /dashboard/vendor/orders`, `GET /dashboard/vendor/orders/{vendorOrder}`, `POST .../accept`
- Policies: `OrderPolicy`, `VendorOrderPolicy`, `VendorShippingSettingsPolicy`
- Frontend: `OrdersPage.tsx`, `VendorOrders.tsx` with real API hooks

## PO decisions applied

- L22: domain transition methods only — no generic status PATCH
- L34: `PaymentStateService::transition()` throws in Stage 7 (gateway deferred to Stage 8)
- L18: auth:sanctum + account.active on all checkout/order routes

## Tests

- `OrderAuthorizationTest` (customer IDOR, vendor IDOR, cancel from pending, payment transition blocked)
- Existing catalog/profile IDOR patterns reused for authorization model

## Final hardening pass (2026-08-17)

- Added `Sanctum::actingAs` test helpers for reliable multi-user authorization tests
