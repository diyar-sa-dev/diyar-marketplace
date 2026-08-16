# Phase 4.2 — Product Model — Plan

> **Stage:** Stage 4 — Catalog & Products  
> **Phase:** 4.2 — Product Model  
> **Status:** Pending  
> **Depends on:** Phase 4.1 (categories)

---

## Objective

Create the production product domain: schema, colors, images, inventory, vendor account extension, and model-level tests.

---

## Tasks

### Task 4.2.1 — Product schema

**Deliverables:**

- Migration: `products`
- Model: `App\Models\Product` (SoftDeletes)
- Factory: `ProductFactory`

**Schema (UUID PKs):**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| vendor_account_id | UUID FK | Ownership key |
| category_id | UUID FK | |
| name | string | |
| slug | string | UNIQUE per vendor |
| description | text | |
| sale_price | decimal(12,2) | |
| compare_price | decimal(12,2) NULL | |
| width, height, depth | decimal NULL | cm |
| materials | json | |
| warranty | string NULL | |
| product_type | enum | single, bundle |
| availability_mode | enum | in_stock, out_of_stock, preorder |
| status | enum | draft, active, archived |
| deleted_at | timestamp NULL | |
| timestamps | | |

**Checklist:**

- [ ] Unique index on `(vendor_account_id, slug)`
- [ ] Index on `(category_id, status)`
- [ ] Index on `(vendor_account_id, status)`
- [ ] FK constraints with appropriate onDelete

---

### Task 4.2.2 — Vendor account extension

Extend `vendor_accounts` for storefront (Decision D2):

| Column | Notes |
|--------|-------|
| slug | UNIQUE — for `/store/:slug` |
| description | TEXT NULL |
| location | VARCHAR NULL |
| status | enum: pending, active, suspended |
| logo_path | VARCHAR NULL (or media_file_id later) |
| cover_path | VARCHAR NULL |

**Checklist:**

- [ ] Migration to extend vendor_accounts
- [ ] Update `VendorAccount` model
- [ ] Slug generation on create
- [ ] Only `active` vendors visible on storefront

---

### Task 4.2.3 — Product colors

**Deliverables:**

- Migration: `product_colors`
- Model: `App\Models\ProductColor`

| Column | Notes |
|--------|-------|
| product_id | FK |
| name | string |
| hex_code | char(7) — validate `#RRGGBB` |

---

### Task 4.2.4 — Product images + media_files

**Deliverables:**

- Migration: `media_files`
- Migration: `product_images`
- Extend `MediaUploadService`:
  - `storeProductImage(Product, UploadedFile)`
  - Enforce max 5 images per product
  - Support sort_order

**media_files schema:**

| Column | Notes |
|--------|-------|
| id | UUID PK |
| disk | string |
| path | string |
| mime_type | string |
| size_bytes | unsigned int |
| uploaded_by | FK users |
| timestamps | |

**product_images schema:**

| Column | Notes |
|--------|-------|
| id | UUID PK |
| product_id | FK |
| media_file_id | FK |
| sort_order | int |

**Checklist:**

- [ ] Do not duplicate avatar upload logic
- [ ] MIME validation (JPEG, PNG, WEBP)
- [ ] Max 5 enforcement in service layer
- [ ] URL generation via existing `MediaUploadService::url()`

---

### Task 4.2.5 — Inventory

**Deliverables:**

- Migration: `product_inventory`
- Migration: `inventory_movements`
- Models + `InventoryService`

**product_inventory:**

| Column | Notes |
|--------|-------|
| product_id | FK UNIQUE |
| stock_quantity | int unsigned |
| reserved_quantity | int unsigned default 0 |
| available_quantity | int unsigned |

**inventory_movements:**

| Column | Notes |
|--------|-------|
| product_id | FK |
| type | enum: increase, decrease, adjustment, sale, return, reservation, release |
| quantity | int (signed) |
| reference_type, reference_id | nullable morph |
| note | string NULL |
| created_by | FK users |

**Checklist:**

- [ ] `available_quantity = stock_quantity - reserved_quantity`
- [ ] Prevent negative available unless availability_mode allows
- [ ] All mutations transactional
- [ ] Movement audit on every change

---

### Task 4.2.6 — Model relationships + tests

**Relationships to verify:**

```
Product → VendorAccount
Product → Category
Product → ProductColor (hasMany)
Product → ProductImage → MediaFile
Product → ProductInventory (hasOne)
Product → InventoryMovement (hasMany)
```

**Checklist:**

- [ ] Unit/feature tests for relationships
- [ ] Constraint tests (unique slug, FK integrity)
- [ ] Soft delete behavior
- [ ] Factory creates valid product with inventory
- [ ] Regression: Phase 4.1 + Stage 3 tests pass

---

## Phase 4.2 Checklist

- [ ] Vendor account extension migration
- [ ] Product migration
- [ ] Product colors migration
- [ ] media_files migration
- [ ] product_images migration
- [ ] Inventory migrations
- [ ] All models + relationships
- [ ] MediaUploadService extended
- [ ] InventoryService created
- [ ] Factories + seeders (sample products)
- [ ] Model tests passing
- [ ] Phase completion report

---

## Completion Criteria

- Full product domain schema in database
- MediaUploadService handles product images with max-5 rule
- Inventory model with movement audit
- All model tests pass

---

## Next Phase

[Phase 4.3 — Product CRUD](../Phase%204.3%20-%20Product%20CRUD/PHASE_4.3_PLAN.md)
