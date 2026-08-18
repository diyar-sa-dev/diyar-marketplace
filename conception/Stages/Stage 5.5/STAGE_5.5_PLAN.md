# Stage 5.5 — Implementation Plan

> **Date:** 2026-08-16  
> **Depends on:** Stage 4 Catalog, Stage 5 Inventory

---

## Phase Map

| Phase | Deliverable |
|-------|-------------|
| **5.5.1** | Repository audit (no code changes) |
| **5.5.2** | Catalog API: filters, vendors list, resources |
| **5.5.3** | Server-side filtering, pagination, URL sync |
| **5.5.4** | Homepage rails → real API data |
| **5.5.5** | VendorProducts → dashboard API |
| **5.5.6** | Category, store, search, product detail integration |
| **5.5.7** | CatalogSeeder scenarios + full regression |

---

## Backend

### API extensions

- `ProductService::applyFilters()` — `category_slug`, `vendor_id`, `availability_mode`, `product_type`, `discounted`, sorts
- `GET /api/v1/vendors` — paginated vendor directory with `product_count`
- `CategoryService::listActiveTree(?type)` — `?type=product|service`
- `ProductCardResource` — `discount_percent`, inventory fields, `created_at`
- `CatalogSeeder` — 6 vendors, ~20 products covering stock/preorder/discount/pagination

### Tests

- `ProductFilterTest` — filtering, sorting, pagination, vendor filter, service categories

---

## Frontend

### API layer

- `api/catalog.ts` — `fetchVendors`, typed category fetch
- `api/vendorDashboard.ts` — CRUD, inventory, images
- `hooks/catalog/useCatalog.ts` — `useVendors`, typed categories
- `hooks/vendor/useVendorDashboard.ts` — mutations + cache invalidation

### Storefront

- Homepage: deals, new arrivals, best sellers (V1 popular), suggested, stores, services from API
- `CategoryPage` — URL-synced filters (price, vendor, availability), real pagination
- `StorePage` — sort + pagination
- `SearchPage` — vendor search tab
- `ProductCard` — real discount/availability badges
- `VendorProducts` — full API-driven management

### Tests

- `catalogMappers.test.ts` — mapping + availability labels

---

## V1 Fallbacks (documented)

| UI label | Backend behavior |
|----------|------------------|
| الأعلى مبيعاً / مقترح لك | `sort=popular` → `-created_at` until sales metrics exist |
| Service products in category pages | Empty state — no service SKUs in domain |
| Search services tab | Empty — no service listing API |

---

## Definition of Done

See [STAGE_5.5_COMPLETION_REPORT.md](./STAGE_5.5_COMPLETION_REPORT.md).
