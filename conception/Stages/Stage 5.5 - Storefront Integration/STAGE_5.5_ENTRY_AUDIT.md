# Stage 5.5 — Entry Audit

> **Date:** 2026-08-16  
> **Previous stage:** Stage 5 — Inventory — **COMPLETE / FINALIZED**  
> **Source of truth:** Repository code (not prior reports alone)

---

## 1. Executive Summary

At entry, Stage 4 catalog APIs existed and **partial** storefront wiring was in place. Large UI surfaces still used **local mock arrays**, **fake pagination/filter counts**, or **decorative filters** that did not call the API.

| Area | Entry state |
|------|-------------|
| Product list API | ✅ Exists (`GET /api/v1/products`) |
| Category products API | ✅ Exists |
| Vendor public API | ⚠️ Single-vendor only (`/vendors/{slug}`) |
| Vendor directory API | ❌ Missing |
| Product filters (availability, vendor, discounted) | ⚠️ Partial / missing |
| Homepage sections | ⚠️ Mix of API + mock |
| CategoryPage | ⚠️ API products; mock sidebar filters |
| StorePage | ⚠️ API vendor + products; no pagination/sort |
| SearchPage | ⚠️ Product search only; stub store/service tabs |
| VendorProducts dashboard | ❌ 100% local mock state |
| CatalogSeeder | ⚠️ Minimal sample; not scenario-rich |
| Service categories | ✅ Seeded in Stage 5 correction |
| Service product marketplace | ❌ Not in domain (by design) |

**Baseline tests:** 128 backend / 45 frontend PASS.

---

## 2. Mock Data Inventory (Storefront / Catalog Scope)

### REMOVE / REPLACE (production flows)

| Location | Mock type |
|----------|-----------|
| `VendorProducts.tsx` | Full local product CRUD state |
| `Sections.tsx` — FeaturedStores | Hardcoded store cards |
| `Sections.tsx` — ServicesSection | Static service list |
| `Sections.tsx` — MostInteractiveProducts | Fake views/likes |
| `FeaturedDeals.tsx` | Static deal products (partially wired) |
| `CategoryPage.tsx` | FILTER_GROUPS, fake counts, static `/category/all` stores |
| `ProductCard.tsx` | Fake 20% discount, fake ratings |
| `CategoriesStrip.tsx` | Static service row fallback |
| `SearchPage.tsx` | Store/service tab stubs |
| `StorePage.tsx` | Non-functional sort; single-page product load |

### DEFERRED (later stages — documented)

| Location | Reason |
|----------|--------|
| `CartContext` SEED items | Stage 6 cart |
| `CheckoutPage`, `OrdersPage` | Stage 6 orders |
| `WishlistPage` mock items | Stage 6+ wishlist API |
| Affiliate/service dashboard pages | Not in Stage 5.5 scope |
| `StorePage` reviews tab | Reviews subsystem not built |
| Blog, B2B, notifications | Content/marketing placeholders |

### LEGITIMATE

| Location | Classification |
|----------|----------------|
| `AuthContext.test.tsx` vi.mock | Test fixture |
| `routes.test.tsx` mockAuth | Test fixture |
| Placeholder images (Unsplash) | Image fallback |
| `/app mockup.png` | Marketing static asset |
| Store about/reviews static copy | UI placeholder until reviews API |

---

## 3. Backend API Gaps (Entry)

| Gap | Required for UI |
|-----|-----------------|
| `GET /vendors` directory | Homepage stores, search stores tab |
| `discounted`, `availability_mode`, `vendor_id` filters | Deals, filters |
| `sort=popular` fallback | Best sellers / suggested (V1) |
| `CategoryService::listActiveTree(?type)` | Product vs service categories |
| Rich `CatalogSeeder` | Pagination/filter/availability test scenarios |

---

## 4. Security / Regression Constraints

Must preserve:

- Product IDOR protection (`ProductIdorTest`)
- Vendor ownership on dashboard mutations
- Inventory invariants and reservation logic (Stage 5)
- Published vs archived visibility rules

Must **not** implement Stage 6 checkout/cart/payment.

---

## 5. Entry Validation

```text
php artisan test     → 128 PASS
npm test -- --run    → 45 PASS
npx tsc --noEmit     → PASS
npm run build        → PASS
```

---

## 6. Audit Conclusion

Stage 5.5 authorized to:

1. Extend catalog/vendor APIs where UI requires it
2. Wire vendor dashboard product management to existing dashboard API
3. Replace storefront mock catalog data with TanStack Query + API
4. Seed deliberate demo scenarios (not hundreds of random rows)
5. Add filter/pagination tests and frontend mapper tests
