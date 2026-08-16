# Phase 5.3 — Reservation Plan

## Objective
Atomic reservation foundation for Stage 6 checkout.

## Tasks
- [x] `inventory_reservations` migration + model
- [x] `ReservationStatus` enum
- [x] `reserve()`, `finalize()`, `release()` with locking
- [x] Configurable timeout (`diyar.inventory.reservation_timeout_minutes`)
- [x] `inventory:release-expired` command + scheduler
- [x] Tests: `InventoryReservationTest`
