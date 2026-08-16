# Phase 5.2 — Manual Adjustments Plan

## Objective
Auditable vendor stock adjustments with full test coverage.

## Tasks
- [x] Migration: `previous_stock_quantity`, `resulting_stock_quantity` on movements
- [x] Record audit fields in `InventoryService::adjust()`
- [x] Zero-delta adjustment handling (no-op)
- [x] Allow adjustment target quantity `0`
- [x] Fix stale product model in `VendorInventoryController` after adjust
- [x] Tests: `InventoryAdjustmentTest`
