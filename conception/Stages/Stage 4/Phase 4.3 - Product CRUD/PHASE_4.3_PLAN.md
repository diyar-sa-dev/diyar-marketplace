# Phase 4.3 — Product CRUD — Plan

> **Stage:** Stage 4 — Catalog & Products  
> **Phase:** 4.3 — Product CRUD  
> **Status:** Pending  
> **Depends on:** Phase 4.2 (product model)

---

## Objective

Allow authorized vendors to manage their own products with strict ownership protection, inventory adjustments, and image/color management.

---

## Tasks

### Task 4.3.1 — Product creation

**Endpoint:** `POST /api/v1/dashboard/vendor/products`

**Validation:**

- Category exists and is active
- Name, description, sale_price required
- Compare price optional
- Dimensions, materials, warranty optional
- Colors array (name + hex)
- Initial stock quantity
- Images (multipart, max 5)
- availability_mode, product_type

**Security:**

- Derive `vendor_account_id` from authenticated vendor user
- Prohibit `vendor_account_id` in request body
- V1: create with `status=active` (immediate publish)

**Checklist:**

- [ ] `StoreProductRequest`
- [ ] `ProductService::create()`
- [ ] Transaction: product + colors + inventory + images
- [ ] `ProductResource` response

---

### Task 4.3.2 — Product retrieval / listing

**Endpoints:**

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/products` | Public |
| GET | `/api/v1/products/{id}` | Public |
| GET | `/api/v1/dashboard/vendor/products` | Vendor |

**Public filters:** `q`, `category_id`, `vendor_id`, `min_price`, `max_price`, `sort`, `page`, `per_page`

**Visibility rules:**

- Public: `status=active`, vendor `status=active`, not soft-deleted
- Vendor dashboard: own products only (all statuses)

**Checklist:**

- [ ] Pagination via `ApiResponse`
- [ ] Eager load vendor, category, images, colors, inventory
- [ ] Search: `LIKE` on name/description (V1 DB search)
- [ ] Sort: price asc/desc, newest

---

### Task 4.3.3 — Product update

**Endpoint:** `PATCH /api/v1/dashboard/vendor/products/{id}`

**Checklist:**

- [ ] `UpdateProductRequest`
- [ ] Ownership via `ProductPolicy` + service assert
- [ ] Partial updates supported
- [ ] Color sync (replace set)
- [ ] Price/dimensions/materials/warranty updates

---

### Task 4.3.4 — Product archive

**Endpoint:** `DELETE /api/v1/dashboard/vendor/products/{id}` (archive, not hard delete)

**Decision:** Set `status=archived` + soft delete

**Checklist:**

- [ ] Archived products excluded from public listings
- [ ] Vendor can still view archived in dashboard
- [ ] Admin override if needed later

---

### Task 4.3.5 — Inventory adjustment

**Endpoint:** `PATCH /api/v1/dashboard/vendor/inventory/{productId}`

**Body:** `{ "type": "adjustment|increase|decrease", "quantity": N, "note": "..." }`

**Checklist:**

- [ ] `InventoryService::adjust()` — transactional
- [ ] Creates `inventory_movements` record with `created_by`
- [ ] Validates quantity bounds
- [ ] Updates `available_quantity`
- [ ] Ownership check on product

---

### Task 4.3.6 — Image management

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/dashboard/vendor/products/{id}/images` | Add image |
| DELETE | `/api/v1/dashboard/vendor/products/{id}/images/{imageId}` | Remove image |
| PATCH | `/api/v1/dashboard/vendor/products/{id}/images/reorder` | Reorder |

**Checklist:**

- [ ] Max 5 enforced
- [ ] Ownership on product and image
- [ ] Clean up media file on delete

---

### Task 4.3.7 — Vendor authorization / IDOR tests

**Mandatory test cases:**

- [ ] Vendor A creates product
- [ ] Vendor B cannot update/archive/adjust inventory/delete images on Vendor A's product
- [ ] Unauthenticated public read works for active products
- [ ] Archived/inactive products hidden from public
- [ ] Invalid product ID → 404
- [ ] Inactive vendor products hidden from public

---

## Phase 4.3 Checklist

- [ ] ProductService implemented
- [ ] ProductPolicy implemented
- [ ] Vendor dashboard routes registered
- [ ] Public product routes registered
- [ ] All form requests + resources
- [ ] Image endpoints
- [ ] Inventory adjustment endpoint
- [ ] IDOR tests complete
- [ ] Category `/items` endpoint returns real products
- [ ] Regression pass
- [ ] Phase completion report

---

## Completion Criteria

- Vendor can full CRUD own products
- Public can list/filter/view active products
- All IDOR tests pass
- No Stage 3 regression

---

## Next Phase

[Phase 4.4 — Product Detail](../Phase%204.4%20-%20Product%20Detail/PHASE_4.4_PLAN.md)
