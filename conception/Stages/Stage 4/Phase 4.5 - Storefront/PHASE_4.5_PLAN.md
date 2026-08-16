# Phase 4.5 — Storefront — Plan

> **Stage:** Stage 4 — Catalog & Products  
> **Phase:** 4.5 — Storefront  
> **Status:** Pending  
> **Depends on:** Phase 4.4 (product detail API)

---

## Objective

Connect the existing catalog storefront to real backend data across homepage, category, store, and search routes.

---

## Tasks

### Task 4.5.1 — API client / types / hooks

**Deliverables:**

```
frontend/src/types/catalog.ts
frontend/src/api/catalog.ts
frontend/src/hooks/catalog/queryKeys.ts
frontend/src/hooks/catalog/useCatalog.ts
frontend/src/hooks/catalog/useProducts.ts
frontend/src/lib/media.ts          (reuse resolveMediaUrl)
```

**Patterns:** Mirror Stage 3 profile architecture

**Query keys:**

```typescript
categoryKeys.all / list / detail(slug) / items(slug, filters)
productKeys.all / list(filters) / detail(id)
vendorKeys.detail(slug)
searchKeys.query(q, filters)
```

**Checklist:**

- [ ] Typed API responses matching backend resources
- [ ] CSRF only on mutating vendor calls (storefront is read-only)
- [ ] Error handling via existing axios interceptors
- [ ] Map API DTO → ProductCard props helper

---

### Task 4.5.2 — Category page

**Route:** `/category/:id` → use slug from param

**File:** `frontend/src/pages/CategoryPage.tsx`

**Checklist:**

- [ ] Remove `MOCK_PRODUCTS`, `MOCK_SERVICES`, inline `CATEGORIES`
- [ ] Fetch categories from API for nav/filters
- [ ] Fetch `/categories/{slug}/items` with pagination
- [ ] Price filter, sort (client or server — prefer server)
- [ ] Loading / empty / error states
- [ ] Service categories: show empty or defer (document)
- [ ] Align sidebar + CategoriesStrip slugs with backend seeder

---

### Task 4.5.3 — Store page

**Route:** `/store/:id` — use **vendor slug** (Decision: extend vendor_accounts.slug)

**File:** `frontend/src/pages/StorePage.tsx`

**API:** `GET /api/v1/vendors/{slug}` + vendor products

**Checklist:**

- [ ] Remove `STORE_INFO`, `PRODUCTS` mocks
- [ ] Store header from vendor API
- [ ] Product grid paginated
- [ ] Reviews tab: empty state (deferred)
- [ ] Loading / not found / error states

---

### Task 4.5.4 — Search page

**Route:** `/search?q=`

**File:** `frontend/src/pages/SearchPage.tsx`

**API:** `GET /api/v1/search?q=&category_id=&min_price=&max_price=&sort=&page=`

**Checklist:**

- [ ] Remove `allProducts`, `allStores`, `allServices` mocks
- [ ] Products tab wired to search API
- [ ] Stores tab: vendor search or filter (if API supports)
- [ ] Services tab: empty/deferred (out of Stage 4 scope)
- [ ] Pagination
- [ ] Rename local `useQuery` URL helper if colliding with TanStack

---

### Task 4.5.5 — Homepage catalog sections

**Orchestrator:** `frontend/src/pages/HomePage.tsx`

**Connect (catalog scope only):**

| Component | API source |
|-----------|------------|
| `CategoriesStrip` | `GET /categories` |
| `FeaturedDeals` | `GET /products?sort=...&limit=5` |
| `BestSellers` | `GET /products?sort=popular` |
| `NewArrivals` | `GET /products?sort=-created_at` |
| `SuggestedForYou` | `GET /products?limit=8` (or featured flag) |
| `MostInteractiveProducts` | `GET /products?limit=4` |
| `FeaturedStores` | `GET /vendors?featured=true` or top vendors |

**Do not connect (out of scope):**

- Services, blog, reviews testimonials, loyalty, AI, affiliate

**Checklist:**

- [ ] Shared `ProductCard` typed props
- [ ] Loading skeletons per section
- [ ] Graceful empty sections
- [ ] Update `SidebarMenu` categories from API or shared hook

---

### Task 4.5.6 — Frontend tests

**Minimum coverage:**

- [ ] `useProducts` / `useProduct` hook tests
- [ ] ProductCard rendering with API-shaped data
- [ ] Category page loading/error states
- [ ] Search page query param → API call

---

## Phase 4.5 Checklist

- [ ] Types + API client + hooks
- [ ] CategoryPage connected
- [ ] ProductDetailsPage connected (Phase 4.4)
- [ ] StorePage connected
- [ ] SearchPage connected
- [ ] Homepage catalog sections connected
- [ ] Sidebar/categories strip aligned
- [ ] No production mock catalog on connected paths
- [ ] Loading/error/empty on all connected pages
- [ ] Frontend tests added
- [ ] Full regression + build pass
- [ ] Phase completion report

---

## Out of Scope Reminder

Do not wire: checkout, wishlist persistence, cart, services marketplace, blog, affiliate dashboard mocks.

---

## Completion Criteria

- All Stage 4 storefront routes use real APIs
- Homepage product sections use real data
- Full test suite + TypeScript + build pass
- Ready for STAGE_4_COMPLETION_REPORT.md

---

## Next Step

Final regression → [STAGE_4_COMPLETION_REPORT.md](../STAGE_4_COMPLETION_REPORT.md)
