# Phase 7.2 — Order Schema & Split — Completion Report

**Status:** COMPLETE

## Delivered

- Order domain migrations: `orders`, `vendor_orders`, `order_items`, `payments`, `shipments`, `order_number_sequences`
- Enums: `OrderStatus`, `VendorOrderStatus`, `PaymentStatus`, `ShipmentStatus`, `ShippingMethod`
- `OrderNumberService` — atomic `lockForUpdate` sequence allocation (`DYR-{YYYYMMDD}-{SEQUENTIAL}`)
- `VendorGroupService`, `OrderTotalsReconciliationService` for split and invariant checks
- Shipping snapshots on `vendor_orders`: method, cost, pickup label, free-shipping flag
- Constraints: `UNIQUE(orders.order_number)`, `UNIQUE(user_id, idempotency_key)`

## PO decisions applied

- L8: Order → VendorOrder → OrderItem + Payment + Shipment stub
- L16: immutable shipping snapshots on vendor order rows
- L20: decimal(12,2) money columns
- L28: concurrency-safe sequence table (no COUNT/MAX)

## Tests

- `OrderNumberConcurrencyTest` (sequential format/uniqueness)
- `OrderNumberParallelAllocationTest` (6 parallel PHP worker processes, shared sqlite file)

## Final hardening pass (2026-08-17)

- Added `tests/Scripts/allocate_order_number_worker.php` for true multi-process stress test
