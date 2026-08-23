# Catalog Search Architecture

## Endpoint

`GET /api/v1/catalog/search` (public, `throttle:60,1`)

Legacy `GET /api/v1/search` remains for backward-compatible product-only search.

## Request validation

Validated by `CatalogSearchRequest`:

- `q` max 120 chars, whitespace-normalized
- `type`: `all` | `products` | `services`
- `sort`: allowlisted values only
- `per_page`: max 50
- `vendor_slug`, `category_slug`, `color`, `material`, price range, `discounted`

## Service layer

`CatalogSearchService` orchestrates:

- `ProductService::listPublic()` for products
- `ServiceCatalogService::listPublic()` for services

Facets (Redis-cached 5 minutes):

- **vendors**: top 20 by product count in current filter context (not all merchants)
- **categories**: active product/service categories
- **colors**: distinct colors from matching products (max 12)

## Frontend

- `useCatalogSearch()` — React Query with `keepPreviousData`, namespaced keys `['marketplace','catalog','search', filters]`
- URL-synchronized state (`q`, `type`, filters, `sort`, `page`, `per_page`)
- 300ms debounced `q` before API requests
- Mobile filter drawer + desktop filter panel
- Visual/image search remains disabled (`q=visual_search_results`)

## Intentionally excluded

- **style** / **space** filters — no dedicated product attributes in schema; category slug covers room/space browsing
- **Elasticsearch/Meilisearch** — not introduced; DB-backed search with indexes + Redis facet cache

## Tests

`tests/Feature/Api/V1/Catalog/CatalogSearchTest.php`
