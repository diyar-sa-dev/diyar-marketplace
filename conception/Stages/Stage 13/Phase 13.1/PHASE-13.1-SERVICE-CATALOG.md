# Phase 13.1 — Service Catalog

> **Status:** **COMPLETE**  
> **Scope:** Service categories, provider accounts, services, portfolio, follow, public catalog APIs, storefront pages.

---

## Objective

Expose a browsable service marketplace: categories, provider profiles, service cards, filters, sorting, pagination, and provider follow — mirroring commerce catalog patterns.

---

## Domain model

| Entity | Table | Notes |
|--------|-------|-------|
| `ServiceCategory` | `service_categories` | slug, AR/EN names, icon_key, sort |
| `ProviderAccount` | `provider_accounts` (extended) | bio, location, remote flag, rating aggregates |
| `Service` | `services` | category, pricing mode, starting price, cover |
| `ServicePortfolioItem` | `service_portfolio_items` | provider showcase images |
| `ProviderFollow` | `provider_follows` | customer ↔ provider |

**Enums:** `ServicePricingMode`, `ProviderAccountStatus`

**Migration:** `2026_08_18_220000_create_service_marketplace_catalog.php`

---

## API (public)

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/v1/service-categories` | — |
| GET | `/api/v1/services` | — (filter, sort, paginate) |
| GET | `/api/v1/services/{slug\|id}` | — |
| GET | `/api/v1/services/{slug\|id}/related` | — |
| GET | `/api/v1/providers/{slug}` | — |
| GET | `/api/v1/providers/{slug}/services` | — |
| GET | `/api/v1/providers/{slug}/portfolio` | — |
| POST/DELETE | `/api/v1/providers/{slug}/follow` | customer |

---

## Backend services

| Service | Responsibility |
|---------|----------------|
| `ServiceCatalogService` | List/filter/sort/paginate services (SQL pagination) |
| `ServiceCategoryService` | Active categories |
| `ProviderProfileService` | Public provider + services + portfolio |
| `ProviderFollowService` | Follow/unfollow |

**Controllers:** `ServiceCategoryController`, `ServiceController`, `ProviderController`, `ProviderFollowController`

**Seeder:** `ServiceMarketplaceSeeder` — 6 categories, 4+ providers, 10 services (إيوان للتصميم featured)

---

## Frontend

| Route | Page | API client |
|-------|------|------------|
| `/services` | `ServicesPage` | `api/services.ts` |
| `/service/:id` | `ServicePage` | `hooks/services/useServices.ts` |
| `/provider/:id` | `ProviderPage` | same |

No hardcoded catalog arrays in wired pages.

---

## Authorization & security

- Public read endpoints; follow requires authenticated customer
- Provider slug resolution; inactive providers hidden from catalog queries

---

## Tests

`backend/tests/Feature/Api/V1/ServiceMarketplace/ServiceCatalogTest.php` — **12/12 pass**

---

## Acceptance criteria

- [x] Categories seeded and listed
- [x] Services filterable by category, price, sort
- [x] DB-level pagination (not client-side full fetch)
- [x] Provider public profile with services + portfolio
- [x] Follow toggle for authenticated users

---

## Deferred / future

- Service reviews on catalog cards (Stage 14.2)
- Admin category CRUD for services (Stage 14)
