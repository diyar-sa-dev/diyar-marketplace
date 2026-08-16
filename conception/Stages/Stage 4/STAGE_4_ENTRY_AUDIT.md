# Stage 4 — Entry Audit

> **Date:** 2026-08-16  
> **Authorization:** PO authorized Stage 4 — Catalog & Products on 2026-08-16  
> **Previous stage:** Stage 3 — User Profile & Media — **COMPLETE / FINALIZED**  
> **Auditor role:** Full-stack / architecture / security / QA / PM  
> **Source of truth:** Repository code + tests + authoritative architecture docs

---

## 1. Executive Summary

Stage 4 is **greenfield catalog implementation**. The repository has a rich **mock-driven storefront UI** and a **production-ready identity/profile foundation**, but **no catalog backend** (no category/product migrations, models, routes, controllers, or tests).

Stage 3 baseline is intact:

| Check | Result (2026-08-16) |
|-------|---------------------|
| `php artisan test` | **75 / 75 PASS** |
| `npm test -- --run` | **45 / 45 PASS** |
| TypeScript | Pass (Stage 3 baseline) |

**Recommendation:** Proceed with Phase 4.1 after reconciling the architectural decisions documented in §8 below.

---

## 2. Repository Stack

| Layer | Technology | Source |
|-------|------------|--------|
| Backend | PHP ^8.3, Laravel ^13.17, Sanctum ^4.3 | `backend/composer.json` |
| Frontend | React ^19, Vite ^6, TypeScript ~5.8, TanStack Query ^5 | `frontend/package.json` |
| Database | MySQL 8 (ADR-002) | `conception/adr/ADR-002-database.md` |
| API prefix | `/api/v1` | `backend/bootstrap/app.php` |
| Auth | Sanctum session + CSRF | Stage 2 |
| Media | `MediaUploadService` (avatar paths on `users.avatar_path`) | Stage 3 |

---

## 3. What Exists Today

### 3.1 Backend — implemented

| Area | Status | Key paths |
|------|--------|-----------|
| Users, roles, RBAC | ✅ | `app/Models/User.php`, `Role.php` |
| Vendor stub | ✅ | `vendor_accounts` — `id`, `user_id`, `business_name` |
| Profile & addresses | ✅ | `app/Services/Profile/*`, `/api/v1/profile/*` |
| Avatar upload | ✅ | `MediaUploadService`, `/profile/avatar` |
| Authorization patterns | ✅ | Policies, `role:` middleware, service-layer IDOR checks |
| API envelope | ✅ | `App\Support\Api\ApiResponse` |
| Pagination support | ✅ (unused) | `ApiResponse` handles `AbstractPaginator` |

### 3.2 Backend — missing (Stage 4 scope)

| Area | Status |
|------|--------|
| `categories` table / model | ❌ |
| `products` and related tables | ❌ |
| `product_colors`, `product_images` | ❌ |
| `product_inventory`, `inventory_movements` | ❌ |
| `media_files` (design doc) | ❌ |
| Catalog API routes | ❌ |
| Category/product controllers, services, policies | ❌ |
| Product/category API resources | ❌ |
| Catalog tests | ❌ |

### 3.3 Frontend — implemented

| Area | Status | Key paths |
|------|--------|-----------|
| Storefront routes | ✅ | `frontend/src/App.tsx` — `/`, `/category/:id`, `/product/:id`, `/store/:id`, `/search` |
| High-fidelity UI | ✅ | Mock-driven pages and home sections |
| API client pattern | ✅ | `frontend/src/api/client.ts`, `profile.ts` |
| TanStack Query pattern | ✅ | `frontend/src/hooks/profile/*` |
| Profile i18n AR/EN | ✅ | Stage 3 — catalog strings mostly hardcoded Arabic |

### 3.4 Frontend — missing (Stage 4 scope)

| Area | Status |
|------|--------|
| `types/catalog.ts` / product types | ❌ |
| `api/catalog.ts` / `api/products.ts` | ❌ |
| `hooks/catalog/*` | ❌ |
| Real API wiring on catalog pages | ❌ |
| Product detail fetch by `:id` | ❌ (param ignored) |
| Storefront i18n for catalog | ❌ (deferred within Stage 4 unless required) |

---

## 4. Mock Data Inventory

All catalog data is **inline constants** — no shared mocks module.

| Identifier | File | Consumed by |
|------------|------|-------------|
| `MOCK_PRODUCT`, `SIMILAR_PRODUCTS` | `pages/ProductDetailsPage.tsx` | Product detail |
| `MOCK_PRODUCTS`, `MOCK_SERVICES`, `CATEGORIES` | `pages/CategoryPage.tsx` | Category browse |
| `STORE_INFO`, `PRODUCTS` | `pages/StorePage.tsx` | Vendor store |
| `allProducts`, `allStores`, `allServices` | `pages/SearchPage.tsx` | Search |
| `PRODUCTS`, `SERVICES` | `components/home/CategoriesStrip.tsx` | Homepage |
| Multiple `products` arrays | `components/home/Sections.tsx` | Best sellers, new arrivals, etc. |
| `products` | `components/home/FeaturedDeals.tsx` | Featured deals |
| `CATEGORIES` | `components/layout/SidebarMenu.tsx` | Nav sidebar |

**Important:** Category IDs are **inconsistent** across `CategoriesStrip`, `CategoryPage`, and `SidebarMenu`. Stage 4 must use **backend slugs/IDs** as the single source of truth.

**ProductCard** accepts `product: any` — Stage 4 should introduce typed catalog DTOs and map API responses.

---

## 5. Planned API Contract (Authoritative Design)

From `conception/architecture/API_SPECIFICATION.md` and `conception/API/API_CONVENTIONS.md`:

### Public catalog

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/v1/categories` | Optional |
| GET | `/api/v1/categories/{slug}` | Optional |
| GET | `/api/v1/categories/{slug}/items` | Optional |
| GET | `/api/v1/products` | Optional |
| GET | `/api/v1/products/{id}` | Optional |
| GET | `/api/v1/vendors/{slug}` | Optional |
| GET | `/api/v1/search` | Optional |

Query params (products/search): `q`, `category_id`, `vendor_id`, `min_price`, `max_price`, `sort`, `page`, `per_page`.

### Vendor management

| Method | Endpoint | Auth |
|--------|----------|------|
| GET/POST | `/api/v1/dashboard/vendor/products` | Vendor |
| GET/PATCH | `/api/v1/dashboard/vendor/products/{id}` | Vendor |
| DELETE | `/api/v1/dashboard/vendor/products/{id}` | Vendor |
| PATCH | `/api/v1/dashboard/vendor/inventory/{productId}` | Vendor |
| POST/DELETE | Product image endpoints (TBD in Phase 4.3) | Vendor |

### Admin

| Method | Endpoint | Auth |
|--------|----------|------|
| CRUD | `/api/v1/admin/categories` | Admin |

**Implemented today:** None of the above. Only auth, profile, health, and vendor account stub read.

---

## 6. Database Design Reconciliation

Authoritative schema: `conception/architecture/DATABASE_DESIGN.md` §3.2–3.3.

### Planned tables

| Table | Purpose |
|-------|---------|
| `categories` | Hierarchy, slug, type, sort, active flag |
| `products` | Vendor-owned catalog items |
| `product_colors` | Name + hex per product |
| `product_images` | Up to 5 images per product |
| `product_inventory` | Stock / reserved / available |
| `inventory_movements` | Audited quantity changes |
| `media_files` | Canonical uploaded file records |

### Implementation vs design gaps

| Design doc | Current code | Stage 4 decision |
|------------|--------------|------------------|
| BIGINT UNSIGNED PKs | UUID PKs everywhere | **Follow UUID** (consistent with Stages 1–3) |
| `vendor_profiles` | `vendor_accounts` stub | **Extend `vendor_accounts`** with storefront fields (slug, description, status, location). Products FK → `vendor_account_id`. Document alias to design doc's `vendor_profiles`. |
| `media_files` + FK | Avatar uses `users.avatar_path` | **Add `media_files` for product images**; extend `MediaUploadService`. Do not regress avatar flow. |
| Inventory in Stage 5 (`PLAN.md`) | Required in PO Stage 4 prompt | **Implement basic inventory in Stage 4**; checkout reservations remain Stage 5+ |
| Reviews subsystem | UI shows aggregate rating only | **Defer reviews** — expose nullable rating fields; no review CRUD in Stage 4 |

---

## 7. Authorization & Security Baseline (Reuse)

Established patterns to replicate for catalog:

1. **Policies** — `VendorAccountPolicy`: admin OR owner by `user_id`
2. **Route middleware** — `role:vendor,admin`
3. **Service-layer IDOR** — `AddressService::assertOwnership()` pattern
4. **Mass assignment** — prohibit `vendor_account_id`, `user_id` from client input
5. **Form requests** — validation + prohibited fields

Vendor product rule: **derive vendor ownership from authenticated session**, never trust client-supplied vendor IDs.

---

## 8. Architectural Decisions for Stage 4

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | UUID primary keys for all new tables | Matches existing migrations |
| D2 | Extend `vendor_accounts` (not new `vendor_profiles` table) | Avoid duplicate entity; stub already wired to registration |
| D3 | Add `media_files` + `product_images.media_file_id` | Aligns with design doc; supports max-5 enforcement |
| D4 | Implement inventory tables in Stage 4 | PO Stage 4 authorization includes inventory; checkout reservation logic deferred |
| D5 | Category hierarchy: unlimited depth in schema, seed V1 with 1–2 levels | Avoid over-engineering; document actual depth used |
| D6 | Product archive = `status=archived` + soft delete | Archived hidden from public listings |
| D7 | V1 publish immediately (`status=active` on create) | Per REQUIREMENTS_BASELINE / PLAN |
| D8 | Reviews: nullable aggregate fields only | No review subsystem in Stage 4 |
| D9 | Public API uses UUID product IDs | Matches route `/product/:id`; slug optional for SEO later |
| D10 | Pagination via `ApiResponse` + `?page=&per_page=` | Matches `API_CONVENTIONS.md` |

---

## 9. Documentation Conflicts Resolved

| Conflict | Resolution |
|----------|------------|
| `MASTER_DEVELOPMENT_PLAN.md` lists Catalog as Stage 3 | Superseded — Catalog is **Stage 4** per `.agent/*` and PO authorization |
| `PLAN.md` inventory in Stage 5 | Basic inventory in Stage 4 per PO prompt; reservation/checkout in Stage 5+ |
| `API_SPECIFICATION.md` says only health exists | Update during Stage 4 implementation |
| `/user/*` vs `/profile/*` paths | Implemented paths are `/profile/*` — catalog docs use `/api/v1/...` |
| PostgreSQL in `PROJECT_SPECIFICATION.md` | MySQL 8 per ADR-002 |
| Laravel 11 in old docs | Laravel 13 in production code |

---

## 10. Stage 3 Deferred Items (Non-blocking)

These remain deferred and are **not Stage 4 scope**:

- Bio/preferences UI
- In-session password change UI
- Dedicated frontend profile/address tests
- Dashboard sidebar localization
- 2FA / connected devices
- Postman profile endpoints

---

## 11. Stage 4 Implementation Map

```
Phase 4.1 — Categories
    ├── Task 4.1.1 — Category schema + model
    ├── Task 4.1.2 — Category hierarchy
    ├── Task 4.1.3 — Public category API
    ├── Task 4.1.4 — Admin category operations
    └── Task 4.1.5 — Category tests

Phase 4.2 — Product Model
    ├── Task 4.2.1 — Product schema
    ├── Task 4.2.2 — Product colors
    ├── Task 4.2.3 — Product images + media_files
    ├── Task 4.2.4 — Inventory tables
    └── Task 4.2.5 — Model relationships + tests

Phase 4.3 — Product CRUD
    ├── Task 4.3.1 — Product creation
    ├── Task 4.3.2 — Product listing/retrieval
    ├── Task 4.3.3 — Product update
    ├── Task 4.3.4 — Product archive
    ├── Task 4.3.5 — Inventory adjustment
    └── Task 4.3.6 — Vendor authorization / IDOR tests

Phase 4.4 — Product Detail
    ├── Task 4.4.1 — Product detail API
    ├── Task 4.4.2 — Reviews boundary (nullable/deferred)
    ├── Task 4.4.3 — Related products
    └── Task 4.4.4 — Frontend product detail page

Phase 4.5 — Storefront
    ├── Task 4.5.1 — API client + types + hooks
    ├── Task 4.5.2 — Category page
    ├── Task 4.5.3 — Store page
    ├── Task 4.5.4 — Search page
    └── Task 4.5.5 — Homepage catalog sections
```

Additional tasks may be added if discovered during implementation (e.g. vendor account extension, seeders, admin category UI boundary).

---

## 12. Regression Baseline (Pre–Stage 4)

Recorded **2026-08-16** before any Stage 4 code changes:

```text
Backend:  php artisan test          → 75 passed
Frontend: npm test -- --run         → 45 passed
```

Re-run after every phase. Stage 4 is incomplete if Stage 3 tests regress.

---

## 13. Blockers

| Blocker | Status |
|---------|--------|
| PO authorization | ✅ Resolved — authorized 2026-08-16 |
| Stage 3 regression | ✅ Baseline recorded |
| Vendor entity gap | ⚠️ Resolved by decision D2 — extend `vendor_accounts` in Phase 4.2 |
| Media model gap | ⚠️ Resolved by decision D3 — add `media_files` in Phase 4.2 |

**No blocking issues remain.** Phase 4.1 may begin.

---

## 14. Next Step

1. Review [STAGE_4_PLAN.md](./STAGE_4_PLAN.md)
2. Execute [Phase 4.1 — Categories](./Phase%204.1%20-%20Categories/PHASE_4.1_PLAN.md)
3. Update `.agent/CURRENT_STATE.md` after Phase 4.1 completion
