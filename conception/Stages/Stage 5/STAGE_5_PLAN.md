# Stage 5 — Inventory Implementation Plan

> **Date:** 2026-08-16  
> **Authorization:** PO authorized Stage 5 — Inventory  
> **Baseline:** Backend 96 tests, Frontend 45 tests (Stage 4 finalized)

---

## Objective

Production-safe inventory foundation: stock, reserved, available quantities; auditable manual adjustments; atomic reservation for future checkout; out-of-stock and preorder behavior.

---

## Scope

- [x] Entry audit
- [x] Service category correction
- [x] Phase 5.1 — Inventory model
- [x] Phase 5.2 — Manual adjustments
- [x] Phase 5.3 — Reservation
- [x] Phase 5.4 — Stock availability (out-of-stock / preorder)
- [x] Full backend tests
- [x] Full frontend tests
- [x] TypeScript
- [x] Build
- [x] Formatting (Pint + Prettier)
- [x] Documentation
- [x] CURRENT_STATE.md
- [x] Final audit
- [x] Completion report

---

## Non-Goals

- Full cart / checkout / payment (Stage 6+)
- Order lifecycle
- Full storefront mock replacement
- Vendor dashboard full API wiring (deferred)
- Physical inventory for **services**

---

## Existing Architecture

- One `product_inventory` row per product
- `InventoryService` with `lockForUpdate()` transactions
- Vendor inventory API: `PATCH /api/v1/dashboard/vendor/inventory/{product}`
- `AvailabilityMode` on products (separate from `ProductStatus`)

---

## Phase Sequence

1. **5.1** — Invariants, model helpers, factories, tests  
2. **5.2** — Movement audit columns, adjustment tests, controller refresh fix  
3. **5.3** — `inventory_reservations`, reserve/finalize/release, timeout command  
4. **5.4** — `expected_available_at`, availability enforcement, product detail UI gating  

---

## Dependencies

- Stage 4 product/inventory schema
- Sanctum auth + vendor ownership patterns
- `config/diyar.php` for timeout

---

## Security Requirements

- [x] Authentication on vendor routes
- [x] Vendor ownership / IDOR protection
- [x] Server-authoritative quantities (never trust client reserved/available)
- [x] Transaction + row locking for reserve/adjust
- [x] Double finalize/release prevention

---

## Concurrency Requirements

- [x] `lockForUpdate()` on inventory during adjust/reserve/finalize/release
- [x] `reserved_quantity <= stock_quantity` invariant
- [x] Competing reservation test

---

## Testing Requirements

- Backend: `php artisan test` — **128 / 128**
- Frontend: `npm test -- --run` — **45 / 45**
- TypeScript, build, Pint, Prettier — all pass

---

## Completion Criteria

All phase completion reports finalized; inventory invariants enforced; documentation reconciled with code.

---

## Deferred Items

| Item | Notes |
|------|-------|
| Vendor dashboard inventory UI | Backend API ready; `VendorProducts.tsx` still mock |
| Public reservation HTTP API | Service-layer only; Stage 6 checkout consumes |
| Homepage mock sections | Documented in entry audit |
| Service catalog items | Categories seeded; no service SKUs yet |

---

## Stage 6 Boundary

Stage 5 delivers `InventoryService::reserve/finalize/release` and expiration command. Stage 6 implements checkout/cart/payment and binds reservations to orders.
