# Phase 26.9 — Advanced Search Baseline Audit

**Date:** 2026-08-26  
**Status:** Baseline complete — implementation in progress  
**Foundation:** Stage 20 catalog search (products + services)

---

## Executive Summary

DIYAR has a **production-ready Stage 20 catalog search** (SQL `LIKE`, facets, autocomplete, storefront UX). There is **no search engine**, **no unified global index**, **no search analytics**, and **no indexing pipeline**. Phase 26.9 is ~25% pre-built (API shell + UX); engine, unification, analytics, and hardening are greenfield.

---

## Existing Search

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/catalog/search` | Products + services + facets |
| `GET /api/v1/catalog/search/suggestions` | Autocomplete (4 entity types) |
| `GET /api/v1/search` | Legacy product-only |
| `GET /api/v1/vendors` | Store search (separate) |
| `GET /api/v1/blog/articles` | Blog search (separate) |

**Rate limits:** `catalog-search` 60/min, `catalog-search-suggestions` 90/min (`config/diyar.php`).

### Services

| Service | Pattern |
|---------|---------|
| `CatalogSearchService` | Orchestrates product/service search; Redis facet cache 5min |
| `CatalogSearchSuggestionService` | Prefix/contains LIKE; manual score ranking; cache 45s |
| `ProductService` | LIKE on `name`, `description` |
| `ServiceCatalogService` | LIKE on `title`, `description`, provider name |
| `VendorService`, `BlogQueryService`, etc. | Siloed LIKE queries |

### Frontend

- `SearchPage.tsx` — unified catalog UI (products/services tabs)
- `SearchAutocomplete.tsx` — debounced suggestions, navigates to `/search`
- Siloed: `BlogPage`, `B2BPage`, `ServicesPage` use local `q` params

### Tests

- `CatalogSearchTest.php`, `CatalogSearchSecurityTest.php`, `CatalogSearchSuggestionsTest.php`
- k6 hot path in `scripts/performance/profiles.js`

---

## Indexing

| Capability | Status |
|------------|--------|
| Meilisearch / Elasticsearch / Scout | **Missing** |
| MySQL FULLTEXT | **Missing** |
| Outbox → search index | **Missing** (outbox exists for notifications) |
| Reindex commands | **Missing** |
| Facet/suggestion cache | **Exists** |

---

## Missing (26.9 scope)

| Requirement | Status |
|-------------|--------|
| Unified search (products, services, stores, blog) | Partial — products/services only |
| Typo tolerance | Missing |
| Search analytics + admin dashboard | Missing |
| Ranking formula (text relevance) | Missing — sort by price/date only |
| Indexing pipeline + reconciliation | Missing |
| Circuit breaker + DB fallback | Missing |
| Product `rating` sort in UI | Broken — no backend branch |
| Image/visual search | UI stub only |

---

## Performance Risks

- `LIKE '%term%'` cannot use B-tree indexes — full table scans at scale
- Facet queries run on every search (cached 5min mitigates)
- No query budget enforcement beyond rate limits

---

## Security (existing)

- `CatalogSearchRequest` — max 120 chars, allowlisted sort/filters
- Visibility filters in `ProductService` / `ServiceCatalogService` (active/published only)
- Rate limiting tested in `CatalogSearchSecurityTest.php`

---

## Recommended Strategy

See [SEARCH_STRATEGY.md](./SEARCH_STRATEGY.md).

**Phase 1 (this increment):** Search analytics table + logging; extend unified API to include stores; abstraction layer; feature flags.

**Phase 2:** MySQL FULLTEXT indexes + improved ranking; optional Meilisearch behind flag.

**Phase 3:** Outbox indexing pipeline; reindex/reconcile commands; admin analytics dashboard.

---

## Files Reference

```
backend/app/Services/Catalog/CatalogSearchService.php
backend/app/Services/Catalog/CatalogSearchSuggestionService.php
backend/app/Http/Controllers/Api/V1/Catalog/CatalogSearchController.php
frontend/src/pages/SearchPage.tsx
frontend/src/components/search/SearchAutocomplete.tsx
conception/Stages/Stage 20/CATALOG_SEARCH.md
```
