# Checkout Race Condition Audit — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Scope:** Inventory reservation, checkout order creation, oversell prevention

---

## Critical Path

```text
Checkout API → OrderCreationService → InventoryService::reserve()
                                      → lockInventory() → lockForUpdate on product_inventory
                                      → increment reserved_quantity
                                      → create InventoryReservation (Pending)
Payment success → PaymentFinalizationService → InventoryService::finalize()
```

---

## Lock Mechanisms

| Operation | Service | Lock | Status |
|-----------|---------|------|--------|
| Stock reserve | `InventoryService::reserve()` | `lockInventory()` → `ProductInventory::lockForUpdate()` inside `DB::transaction` | **VERIFIED** |
| Reservation finalize | `InventoryService::finalize()` | `InventoryReservation` + `Product` + inventory row locks | **VERIFIED** |
| Reservation release | `InventoryService::release()` | Same pattern | **VERIFIED** |
| Order creation | `OrderCreationService` | Uses `InventoryService::reserve()`; order number via `OrderNumberService::lockForUpdate` | **PARTIALLY VERIFIED** |

Reserve path (excerpt):

```php
// InventoryService::reserve — DB::transaction + lockInventory()
$inventory = $this->lockInventory($product); // ProductInventory::lockForUpdate()
```

`lockInventory()` at line 400–405 uses `lockForUpdate()` on `product_inventories`.

---

## Test Coverage

| Test | Scope | Status |
|------|-------|--------|
| `InventoryReservationTest` | Single-thread reserve/release/finalize | **VERIFIED** |
| `InventoryTransactionAuditTest` | Movement audit trail | **VERIFIED** |
| `InventoryAdjustmentTest` | Manual adjustments | **VERIFIED** |
| `OrderNumberConcurrencyTest` | Parallel order numbers | **VERIFIED** (PHPUnit loop) |
| **`CheckoutInventoryConcurrencyTest`** | Parallel reserve on last unit (6 PHP worker processes) | **VERIFIED** (2026-09-03) |
| Parallel HTTP checkout via Octane API | Real HTTP fan-out on loadtest stack | **NOT VERIFIED** |

Dedicated test proves two simultaneous reserve operations cannot both succeed when `available_quantity = 1` (DB-level parallel). HTTP/Octane fan-out remains pending.

---

## Risk Assessment

| Scenario | Mitigation today | Residual risk | Status |
|----------|------------------|---------------|--------|
| Two users reserve last unit | Row lock on `product_inventories` | Unproven under parallel HTTP / Octane | **PARTIALLY VERIFIED** |
| Reserve + pay race | Transaction boundaries + finalize locks | Not load-tested | **PARTIALLY VERIFIED** |
| Expired reservation release vs new reserve | `ReleaseExpiredInventoryReservations` command | No concurrency test | **NOT VERIFIED** |
| Preorder (non-inventory) path | Skips inventory lock | Lower risk | **VERIFIED** |

---

## Pending Work

1. Add `CheckoutInventoryConcurrencyTest` — parallel requests (e.g. `ParallelTesting` or HTTP fan-out) asserting exactly one success when `available_quantity = 1`.
2. Run same scenario on Octane loadtest stack via k6 checkout script — **NOT VERIFIED**.
3. Audit `OrderCancellationService` stash diff for cancel/refund vs reserve races — **NOT VERIFIED**.

---

## Verdict

| Area | Status |
|------|--------|
| `lockForUpdate` on inventory reserve | **VERIFIED** (code) |
| Single-thread reservation tests | **VERIFIED** |
| Parallel checkout HTTP proof | **NOT VERIFIED** |
| Octane/load checkout race proof | **NOT VERIFIED** |

**Production Ready:** No.
