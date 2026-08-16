# Stage 5 — Entry Audit

> **Date:** 2026-08-16  
> **Authorization:** PO authorized Stage 5 — Inventory on 2026-08-16  
> **Previous stage:** Stage 4 — Catalog & Products — **COMPLETE / FINALIZED**  
> **Auditor role:** Full-stack / architecture / security / QA / PM  
> **Source of truth:** Repository code + tests (not prior reports alone)

---

## 1. Executive Summary

Stage 5 entry baseline verified against the **actual repository**:

| Check | Result (entry) |
|-------|----------------|
| `php artisan test` | **96 / 96 PASS** |
| `npm test -- --run` | **45 / 45 PASS** |

Stage 4 catalog foundation exists. Inventory was **partially implemented** in Stage 4 (schema + manual adjust). Reservation, timeout, and availability enforcement were **missing**. Service categories required by the storefront were **missing from seed data**.

---

## 2. Inventory Schema — VERIFIED

**Table:** `product_inventory` (migration `2026_08_16_140006`)

| Column | Type | Notes |
|--------|------|-------|
| `stock_quantity` | unsigned int | Physical stock |
| `reserved_quantity` | unsigned int | Reserved for checkout |
| `available_quantity` | unsigned int | Stored derived value |

**Relationship:** one `product_inventory` row per product (`product_id` unique FK).

**Invariant (Stage 5 target):** `available_quantity = stock_quantity - reserved_quantity`

**Entry state:** columns exist; invariant enforced in application layer only (not DB constraint). `reserved_quantity` was never modified before Stage 5.

---

## 3. Product ↔ Inventory — VERIFIED

- `Product::inventory()` → `HasOne ProductInventory`
- `Product::inventoryMovements()` → audit trail
- Vendor ownership via `product.vendor_account_id`
- `InventoryService::assertProductOwnership()` used by vendor dashboard

---

## 4. Existing InventoryService — PARTIALLY IMPLEMENTED

**Path:** `backend/app/Services/Catalog/InventoryService.php`

| Method | Entry state |
|--------|-------------|
| `createInitial()` | ✅ Creates inventory + initial movement |
| `adjust()` | ✅ Uses `lockForUpdate()`, prevents negative stock |
| `syncAvailabilityMode()` | ✅ Auto in_stock/out_of_stock (skips Preorder) |
| `reserve()` / `finalize()` / `release()` | ❌ Missing |
| `releaseExpiredReservations()` | ❌ Missing |

**Movement types defined but unused:** `Sale`, `Return`, `Reservation`, `Release`

---

## 5. Manual Adjustments — PARTIALLY IMPLEMENTED

**Route:** `PATCH /api/v1/dashboard/vendor/inventory/{product}`  
**Controller:** `VendorInventoryController`  
**Request:** `AdjustInventoryRequest` (increase/decrease/adjustment)

**Table:** `inventory_movements` — morph reference, `created_by`, quantity delta

**Entry gaps:** no `previous_stock_quantity` / `resulting_stock_quantity`; limited test coverage (1 happy-path in `ProductIdorTest`).

---

## 6. Product Status vs Availability — VERIFIED

| Concept | Enum | Purpose |
|---------|------|---------|
| Lifecycle | `ProductStatus` (active/archived) | Publish/archive |
| Availability | `AvailabilityMode` (in_stock/out_of_stock/preorder) | Purchase behavior |

Stage 4 already distinguishes these. `expected_available_at` was **missing** at entry.

---

## 7. Vendor Ownership / Policies — VERIFIED

- `ProductPolicy` + `InventoryService::assertProductOwnership()`
- IDOR tests in `ProductIdorTest`
- Vendor dashboard routes under `role:vendor,admin`

---

## 8. Product CRUD — VERIFIED

Vendor dashboard CRUD intact (Stage 4). Public catalog APIs intact.

---

## 9. Vendor Dashboard Frontend — PARTIALLY IMPLEMENTED

- `VendorProducts.tsx` — **mock local state** (no API wiring)
- Backend vendor product/inventory routes exist
- Stage 5 scope: minimal storefront availability gating only

---

## 10. Storefront — VERIFIED (Stage 4)

Live API integration for product rails, category/store/search/detail pages. Mock sections documented below (not Stage 5 scope).

---

## 11. Product APIs — VERIFIED

Public: `/products`, `/products/{id}`, category items, search, vendor products  
Vendor: dashboard product CRUD + inventory adjust

---

## 12. Tests (Entry) — PARTIALLY IMPLEMENTED

96 backend tests; catalog IDOR includes one inventory increase test. **No dedicated inventory/reservation suite.**

---

## 13. Media — VERIFIED (Stage 3/4)

`MediaUploadService`, product images via `media_files`. Unchanged in Stage 5.

---

## 14. Mock Data (Storefront) — DEFERRED

Documented for later integration stage:

- Homepage: services strip (static), deals, partners, reviews, room/style sections, some store listings
- `CategoriesStrip.tsx` SERVICES array (static icons; slugs align with seeded service categories after correction)
- Vendor dashboard product management UI

---

## 15. Reservation-Related Code (Entry) — MISSING

No `inventory_reservations` table, model, or service methods. Movement enum values existed as placeholders only.

---

## 16. Concurrency / Race Risks (Entry) — PARTIAL

| Area | Entry state |
|------|-------------|
| Manual adjust | ✅ `lockForUpdate()` |
| Reservation | ❌ Not implemented |
| Read-modify-write without lock | Risk if reservation added without locking |

**Convention:** `DB::transaction()` + `lockForUpdate()` (same as `AddressService`, Stage 4 inventory adjust).

---

## 17. Enums / Constants — VERIFIED

- `InventoryMovementType`, `AvailabilityMode`, `ProductStatus`, `CategoryType`
- **Added in Stage 5:** `ReservationStatus`
- Config: **Added** `diyar.inventory.reservation_timeout_minutes`

---

## 18. Database Conventions — VERIFIED

UUID PKs, soft deletes on products, API prefix `/api/v1`, Sanctum auth.

---

## 19. API Response Conventions — VERIFIED

`ApiResponse::success/error`, JSON resources, paginated product lists.

---

## 20. Localization — VERIFIED

`lang/en/diyar.php`, `lang/ar/diyar.php` — catalog + inventory strings extended in Stage 5.

---

## 21. Stage 4 Gap — Service Categories — MISSING (corrected in Stage 5)

Storefront `CategoriesStrip.tsx` lists 10 service slugs; `CategorySeeder` seeded **product categories only** at entry.

Required service slugs documented in `STAGE_4_CORRECTION_SERVICE_CATEGORIES.md`.

---

## 22. Classification Summary

| Item | Status at entry |
|------|-----------------|
| Inventory schema | PARTIALLY IMPLEMENTED |
| Manual adjustments | PARTIALLY IMPLEMENTED |
| Reservation domain | MISSING |
| Timeout / expiration | MISSING |
| Out-of-stock enforcement | PARTIALLY IMPLEMENTED (sync only) |
| Preorder + expected date | PARTIALLY IMPLEMENTED (enum only) |
| Service category seeds | MISSING |
| Full vendor dashboard UI | DEFERRED |
| Checkout / payment | OUT OF SCOPE |
| Cart | OUT OF SCOPE |

---

## 23. Recommendation

Proceed with Stage 5 per `STAGE_5_PLAN.md`: service category correction → Phases 5.1–5.4 → full validation.
