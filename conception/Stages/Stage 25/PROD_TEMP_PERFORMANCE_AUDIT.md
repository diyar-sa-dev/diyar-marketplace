# PROD_TEMP Performance Audit

**Branch:** `prod-temp`  
**Verdict:** OPTIMIZATION IMPLEMENTATION COMPLETE (code) · benchmarks LOCAL/CI only

## Hot-path changes (this pass)

### Products

- `ProductService::cardEagerLoads()` — selective columns, first image only
- Review aggregates remain via `withCount` / `withAvg`
- `CatalogCacheVersion::bump()` on product create/update/archive

### Reviews

- `ProductEngagementController::reviews()` — lightweight `resolvePublicProduct()` (no full detail eager load)
- Removed redundant `product.vendorAccount` from review pagination query

### Orders

- Customer list: first product image only; slim payment columns
- Vendor list: removed `payment.attempts`; first image only
- Vendor dashboard overview: 90s Redis cache; slim recent-order query

### Search

- Facet/suggestion caches versioned via `CatalogCacheVersion`
- Keys migrated to `diyar:search:*` namespace

### Dashboard

- `VendorDashboardOverviewService` — Redis cache 90s
- Affiliate/admin daily series — PostgreSQL-safe date grouping

### Frontend React Query

| Domain | staleTime |
|--------|-----------|
| Categories | 15 min |
| Product list / category / vendor products | 2 min |
| Product detail | 3 min |
| Vendor profile | 5 min |
| Catalog search | 30 s |
| Product reviews | 60 s |
| Orders / vendor orders | 30 s |
| Vendor dashboard overview | 90 s |
| Payment | polling (3 s until terminal) |

## Query / payload impact (expected)

| Endpoint | Before (typical) | After (expected) |
|----------|------------------|------------------|
| GET products (20) | 4–6 queries + all images | 3–4 queries + 1 image/product |
| GET product reviews | Full product detail load | 2 queries (lookup + reviews) |
| GET orders (list) | All item images | First image per item |
| GET vendor orders (list) | payment.attempts + all images | Slim payment + first image |
| GET vendor dashboard | 10+ COUNTs every request | Cached 90s |

*Measured numbers require LOCAL profiling or post-deploy APM — not fabricated here.*

## Octane / Render FREE

- `OCTANE_WORKERS=2`, `OCTANE_MAX_REQUESTS=500`
- `DIYAR_MIGRATE_ON_BOOT=false`
- Health probe cache 45s on `/up`

## Not done (non-blocking)

- Route-level code splitting sweep (partial lazy loading exists in App.tsx)
- `pg_trgm` search indexes
- Full load-test matrix on Render FREE
