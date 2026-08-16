# Phase 4.4 — Product Detail — Plan

> **Stage:** Stage 4 — Catalog & Products  
> **Phase:** 4.4 — Product Detail  
> **Status:** Pending  
> **Depends on:** Phase 4.3 (product CRUD + public API)

---

## Objective

Deliver a complete product detail API and connect `/product/:id` to real backend data.

---

## Tasks

### Task 4.4.1 — Product detail API

**Endpoint:** `GET /api/v1/products/{id}`

**Response structure:**

```json
{
  "success": true,
  "data": {
    "product": {
      "id", "name", "slug", "description",
      "sale_price", "compare_price",
      "product_type", "availability_mode", "status",
      "dimensions", "materials", "warranty",
      "colors": [{ "name", "hex_code" }],
      "images": [{ "url", "sort_order" }],
      "inventory": { "available_quantity", "availability_mode" },
      "rating_avg": null,
      "reviews_count": 0,
      "vendor": { "id", "store_name", "slug" },
      "category": { "id", "name", "slug" }
    }
  }
}
```

**Checklist:**

- [ ] `ProductDetailResource`
- [ ] Eager load all relations (no N+1)
- [ ] 404 for missing/archived/inactive
- [ ] Do not expose private vendor fields (user_id, internal status)

---

### Task 4.4.2 — Reviews boundary

**Decision:** Reviews subsystem is **deferred**.

**Checklist:**

- [ ] Return `rating_avg: null`, `reviews_count: 0` (or seeded placeholder if product has fields)
- [ ] Do not implement review CRUD
- [ ] Document in completion report
- [ ] Frontend: keep aggregate rating UI; hide review list if empty

---

### Task 4.4.3 — Related products

**Endpoint:** included in detail response as `related_products[]` OR separate query param

**Logic:**

- Same `category_id`
- `status=active`
- Exclude current product ID
- Limit 4–8 items
- Order by recency or random with limit

**Checklist:**

- [ ] Efficient query with limit
- [ ] `ProductCardResource` lightweight shape

---

### Task 4.4.4 — Frontend product detail page

**File:** `frontend/src/pages/ProductDetailsPage.tsx`

**Checklist:**

- [ ] Remove `MOCK_PRODUCT`, `SIMILAR_PRODUCTS`
- [ ] Use `useParams().id` to fetch product
- [ ] `useProduct(id)` hook via TanStack Query
- [ ] Loading skeleton
- [ ] Not found state
- [ ] API error + retry
- [ ] Image gallery from API URLs (`resolveMediaUrl`)
- [ ] Colors, dimensions, materials, warranty from API
- [ ] Vendor link → `/store/{vendor.slug}`
- [ ] Related products rail from API
- [ ] Preserve existing UI layout
- [ ] Breadcrumbs from category data
- [ ] Vitest: product detail loading/error/render tests

---

## Phase 4.4 Checklist

- [ ] Detail API complete
- [ ] Related products implemented
- [ ] Reviews boundary documented
- [ ] Frontend wired to API
- [ ] No mock fallback on product page
- [ ] Tests passing
- [ ] Regression pass
- [ ] Phase completion report

---

## Completion Criteria

- `/product/:id` renders real product data
- Related products from API
- Reviews explicitly deferred
- Frontend tests for critical paths

---

## Next Phase

[Phase 4.5 — Storefront](../Phase%204.5%20-%20Storefront/PHASE_4.5_PLAN.md)
