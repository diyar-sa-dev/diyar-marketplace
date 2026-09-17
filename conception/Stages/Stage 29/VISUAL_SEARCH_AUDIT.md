# Visual Search V1 — Codebase Audit

**Stage:** 29 — Enterprise Visual Search  
**Date:** 2026-09-12  
**Status:** Phase 1 complete — **no implementation code written**  
**Auditors:** Full-stack / search / security / performance review (in-repo inspection)

---

## Executive Summary

DIYAR already has **text catalog search**, **smart filter suggestions**, **product image storage (WebP via GD)**, and **frontend UI stubs** for visual search. There is **no** visual similarity engine, **no** image index, **no** upload endpoint, and **no** vector/embedding infrastructure.

The smallest safe integration surface is:

1. New **`POST /api/v1/search/visual`** (multipart) — parallel to existing GET search routes, not a rewrite of `/catalog/search`.
2. New **`VisualSearchService`** pipeline with **`VisualSearchEngineInterface`** — separate from text `SearchEngineInterface` (which is unbound and text-only today).
3. **Perceptual hash index table** in MySQL (V1) — Redis cache for query results; **no** vector DB, **no** LLM, **no** Python service.
4. **Reuse** `ProductService::cardQuery()` + `ProductCardResource` for final relational fetch (`WHERE id IN (...)`).
5. **Wire** existing `ImageSearchModal` + enable camera button in `MarketplaceShell` (currently hard-disabled).

---

## A. Backend Platform

| Item | Finding |
|------|---------|
| **Laravel** | `^13.17` (`backend/composer.json`) |
| **PHP** | `^8.3`, requires `ext-gd`, `ext-intl` |
| **API prefix** | `/api/v1` via `bootstrap/app.php` |
| **Response envelope** | `App\Support\Api\ApiResponse` — `{ success, data, message?, meta? }` |
| **Form requests** | `app/Http/Requests/...` with dedicated rule builders for catalog |
| **Resources** | `JsonResource` subclasses (`ProductCardResource`, `ServiceCardResource`) |
| **Policies** | Used on dashboard/vendor routes; **public catalog search is unauthenticated** |
| **Queues** | Redis-backed (`QUEUE_CONNECTION=redis`); jobs in `app/Jobs/` — **no catalog indexing jobs today** |
| **Cache** | Redis + `StampedeSafeCache`, `VersionedCache`, `CacheKeys` builders |
| **Octane** | Supported (`laravel/octane` in dev); stateless request design required |

### Relevant routes (catalog/search today)

| Method | Path | Controller | Throttle |
|--------|------|------------|----------|
| GET | `/search` | `SearchController` | none |
| GET | `/catalog/search` | `CatalogSearchController` | `catalog-search` (60/min/IP) |
| GET | `/catalog/search/suggestions` | `CatalogSearchSuggestionsController` | `catalog-search-suggestions` |
| GET | `/catalog/search/filter-suggestions` | `FilterSuggestionsController` | `catalog-filter-suggestions` |
| GET | `/products`, `/products/{id}` | `ProductController` | none |
| GET | `/services`, `/services/{identifier}` | `ServiceController` | none |

**Gap:** No `POST` search route exists. Visual search should be a **new POST** endpoint, not overload GET `/catalog/search`.

### Rate limiting conventions

Registered in `AppServiceProvider::boot()`:

- Named limiters: `api`, `catalog-search`, `catalog-search-suggestions`, `catalog-filter-suggestions`, `auth`, `otp`, `wishlist-toggle`, `webhooks`, etc.
- Config source: `config/diyar.php` → `rate_limits.*`
- Catalog search uses **IP-only** keying (`$request->ip()`)
- Global `api` limiter: user ID or IP, default 60/min

**Recommendation:** Add `visual-search` limiter in same pattern; config key `diyar.rate_limits.visual_search_per_minute`. Consider stricter guest limits vs authenticated (auth optional for catalog today — match product listing policy).

### Existing search architecture (text)

```
GET /catalog/search
  → CatalogSearchRequest
  → CatalogSearchService::search()
      → ProductService::listPublic()   (FULLTEXT/LIKE on name+description)
      → ServiceCatalogService::listPublic()
      → facets (cached)
  → ProductCardResource / ServiceCardResource
```

- **Ranking:** Sort param only (`price`, `popular`, `latest`, etc.) — **no relevance score** for text.
- **Pagination:** `PaginationBounds` — max page 200, max per_page 50.
- **SearchEngineInterface** exists (`app/Contracts/Search/SearchEngineInterface.php`) with `MysqlCatalogSearchEngine` stub — **not bound in container**; controllers call services directly.

**Do not conflate** text `SearchEngineInterface` with visual search. Introduce **`VisualSearchEngineInterface`** as specified.

---

## B. Catalog & Models

### Product (`app/Models/Product.php`)

- UUID PK, `SoftDeletes`
- **Visibility:** `scopePubliclyVisible()` — `status = Active` + vendor account active
- **Status enum:** `draft | active | archived`
- **Images:** `hasMany ProductImage` → `MediaFile` (up to 5 per product, enforced in `ProductService::attachImages`)
- **Card query:** `ProductService::cardQuery()` eager-loads `vendorAccount`, `category`, `images.mediaFile`, `inventory`, review aggregates — **N+1 safe pattern to reuse**

### Service (`app/Models/Service.php`)

- UUID PK, no soft deletes
- **Visibility:** `ServiceCatalogService::publicQuery()` — `is_active` + active provider with slug
- **Image:** single `cover_path` string (not `MediaFile` relation)
- **V1 scope decision:** Index **product images first** (richer, multi-image, existing `MediaFile` pipeline). Service cover images can be Phase 29.1 with same index abstraction.

### ProductImage / MediaFile

- `ProductImage`: `product_id`, `media_file_id`, `sort_order`
- `MediaFile`: `disk`, `path`, `mime_type`, `size_bytes`
- Public URL: `/storage/media/{path}` via `MediaUploadService::url()`

---

## C. Image / Media Infrastructure

### Current processing stack

| Component | Path | Notes |
|-----------|------|-------|
| Upload | `MediaUploadService` | JPEG/PNG/WebP → optimized WebP, max 5120 KB (config) |
| Optimization | `MediaOptimizationService` | **PHP GD only** — resize, WebP encode |
| Validation | `ImageContentValidator` | `getimagesize()` binary verify, MIME cross-check |
| SVG | `SvgSafetyValidator` | Vendor logos only — **exclude from visual search uploads** |

### Not present

- ❌ Intervention Image
- ❌ `intervention/imagehash`
- ❌ Imagick
- ❌ Thumbnail variants (single WebP per upload)
- ❌ CDN integration beyond URL prefix config
- ❌ Image embeddings / vectors

### Implications for V1 engine

- **GD is already a production dependency** (`ext-gd` required).
- Perceptual hashing can use:
  - **Option A:** `intervention/image` + `intervention/imagehash` (needs compatibility audit before install)
  - **Option B:** Minimal native GD hash in-house (smaller surface, more maintenance)
- **Prefer Option A only if** PHP 8.3 + Laravel 13 compatibility and maintenance status pass audit (Phase 3).

### Upload limits (existing product uploads)

- Max KB: `config('diyar_media.max_upload_kb', 5120)` — visual search needs **separate 2048 KB (2 MB) limit**
- Max dimensions: product profile 2000×2000 — visual search should use **bounded working resolution** (e.g. 256×256 for hash input)

---

## D. Frontend

### Search UI

| File | Role |
|------|------|
| `frontend/src/pages/SearchPage.tsx` | Main search page; stub for `q=visual_search_results` |
| `frontend/src/components/search/SearchAutocomplete.tsx` | Header search + **camera button (disabled)** |
| `frontend/src/components/modals/ImageSearchModal.tsx` | Modal UI — **no file handler, no API call** |
| `frontend/src/MarketplaceShell.tsx` | Opens modal with `disabled={true}` |
| `frontend/src/hooks/catalog/useCatalogSearch.ts` | TanStack Query for text search |

### Visual search stub state

- Constant `VISUAL_SEARCH_QUERY = 'visual_search_results'` in `SearchPage.tsx`
- i18n keys exist: `catalog.search.imageSearch`, `visualSearchSoon`, etc. (ar + en)
- **No** `frontend/src/api/visualSearch.ts`
- **No** TanStack Query hook for visual search
- **No** E2E or unit tests for visual flow

### Upload patterns to reuse

- `FormData` + axios with `Content-Type` deletion: `frontend/src/api/client.ts` → `prepareRequestBody()`
- Reference: `partnerB2b.ts`, `vendorSettings.ts`, `chat.ts` multipart uploads
- **No react-dropzone** — dashed-border + hidden `<input type="file">` is the DIYAR pattern

### i18n / RTL

- `useLocale()` → `{ t, locale, dir }`
- Document `dir` via `applyDocumentLocale()` on `<html>`
- Search page already sets `dir={dir}` on containers
- API sends `Accept-Language` header from stored locale

### Accessibility (existing)

- `SearchAutocomplete`: combobox ARIA, keyboard nav
- `ImageSearchModal`: `role="dialog"`, `aria-modal`, labelled title
- **Gap:** No focus trap in modal; grid/list toggle uses hard-coded English `aria-label`

---

## E. Performance & Testing Infrastructure

### Backend

| Tool | Location / usage |
|------|------------------|
| PHPUnit 12 | `backend/tests/` — Feature + Unit + Integration |
| Catalog query count tests | `CatalogSearchQueryCountTest.php` |
| Rate limit tests | `tests/Feature/Security/RateLimitingTest.php` |
| Cache stampede | `StampedeSafeCache` + certification scripts under `backend/storage/certification/` |
| k6 | Referenced in `conception/optimization/` — load scripts exist |
| Query logging | No dedicated APM; structured `Log::info` patterns in catalog services |

### Frontend

| Tool | Usage |
|------|-------|
| Vitest 3 | `src/**/*.test.ts(x)` |
| Playwright | `frontend/e2e/` — `customer-journey.spec.ts` covers `/search?q=...` text only |
| TanStack Query | Default staleTime 60s global; catalog search 30s |

### Certification precedent

- Smart filters: Phase 7/8 certification under `backend/storage/certification/phase8/`
- Pattern: benchmark JSON, query budgets, stampede tests, PHPUnit regression filters
- **Visual search should follow same certification folder pattern** (Phase 16)

---

## F. Existing Search — Duplication Risk

| Capability | Exists? | Visual search must… |
|------------|---------|---------------------|
| Text product search | ✅ `ProductService::applyFilters(q)` | Not duplicate — complementary |
| Unified catalog search | ✅ `CatalogSearchService` | Return products via same card resource |
| Filter suggestions | ✅ `FilterSuggestionService` | Remain independent |
| Service text search | ✅ LIKE on title/description | Defer V1 service images |
| Image metadata search | ❌ | New index required |
| Visual similarity | ❌ | Core new feature |

---

## G. Security & Privacy Baseline

| Requirement | Current state | Gap |
|-------------|---------------|-----|
| MIME validation | `ImageContentValidator` for uploads | Reuse + tighten for search-only 2 MB |
| SVG blocked | Not in product upload mimes | Explicitly reject SVG for visual search |
| Permanent storage | Product images → `MediaFile` | Search uploads must **not** use `MediaUploadService::store*` |
| Temp file cleanup | Standard PHP upload temp | Must `unlink` / discard after hash |
| Auth for search | Public catalog | Match public listing (guest allowed) unless product policy changes |
| Rate limits | Catalog search 60/min | Need dedicated visual-search limiter (CPU-heavy) |
| Logging | Structured logs, no binary | Never log raw search images |

---

## H. Scalability Observations

- **Catalog scale:** Certification dataset references 100K products — index must be **bounded lookup**, not O(n) PHP compare across full catalog.
- **Horizontal scaling:** Redis cache + stateless Laravel workers — visual index in **MySQL table** (or Redis sorted set later) avoids per-node memory index.
- **Indexing:** No async product-index jobs exist — new `IndexVisualRepresentationJob` should follow `DeliverNotificationChannelJob` pattern (`ShouldQueue`, configurable tries/timeout).
- **Reindex:** Use chunked `Product::publiclyVisible()->cursor()` / `chunkById()` — consistent with existing catalog invalidation patterns.

---

## I. Prior Art in Repository

| Document | Note |
|----------|------|
| `conception/Stages/Stage 26/Phase 26.9 - Advanced Search/AUDIT.md` | Lists "Image/visual search \| UI stub only" |
| `conception/Stages/Stage 20/CATALOG_SEARCH.md` | Documents disabled `q=visual_search_results` |
| `conception/STAGE_2_5.5_RECONCILIATION_AUDIT.md` | Visual search listed as **Future (D)** |

---

## J. Architecture Fit Assessment (Phase 2 Preview)

**Verdict: Preferred architecture FITS DIYAR with minimal new surface.**

```
React ImageSearchModal
  ↓ POST multipart /api/v1/search/visual
VisualSearchController
  ↓ VisualSearchRequest (2MB, jpg/jpeg/png/webp, dimension cap)
VisualSearchService
  ↓ decode → normalize → VisualSearchEngineInterface
PerceptualHashEngine (V1)
  ↓ PerceptualIndex (MySQL: entity_id, hash, engine_version, index_version)
CandidateRetriever → top-K IDs + scores
VisualSearchRanker (V1: score = hash distance only)
  ↓
ProductService::listPublicByIds($ids)  [new bounded method]
  ↓ ProductCardResource + similarity in meta/data
```

### What NOT to do (confirmed by audit)

| Anti-pattern | Reason |
|--------------|--------|
| LLM description pipeline | Not visual search; adds latency + cost |
| Scan all products in PHP | Fails at 100K scale |
| Store search images | Privacy + storage policy violation |
| Algolia / Meilisearch for V1 | Text engine unbound; visual ≠ text |
| Vector DB | Premature; perceptual hash sufficient for V1 |
| Rewrite CatalogSearchService | Text search works; extend in parallel |
| Bind into SearchEngineInterface | Different contract (multipart vs filters) |

### New database objects (proposed)

1. **`visual_index_entries`** — product_id, media_file_id, representation (binary/hash string), engine_version, index_version, indexed_at
2. **`visual_search_events`** — append-only feedback (Phase 11 foundation); no raw image blob

### New config keys (proposed — `config/diyar.php`)

```php
'visual_search' => [
    'enabled' => env('DIYAR_VISUAL_SEARCH_ENABLED', true),
    'max_upload_kb' => 2048,
    'max_dimension_px' => 4096,
    'working_dimension_px' => 256,
    'candidate_limit' => env('VISUAL_SEARCH_CANDIDATES', 50),
    'result_limit' => env('VISUAL_SEARCH_RESULTS', 20),
    'cache_ttl_seconds' => 300,
    'engine_version' => 'perceptual-v1',
    'representation_version' => 'phash-64-v1',
    'rate_limit_per_minute' => env('DIYAR_VISUAL_SEARCH_RATE_LIMIT', 20),
],
```

### Dependency decision (Phase 3 — pending)

| Package | Purpose | Status |
|---------|---------|--------|
| `intervention/image` | Image decode/resize abstraction | **Not installed** — evaluate vs raw GD |
| `intervention/imagehash` | dHash/pHash | **Not installed** — evaluate maintenance + PHP 8.3 |

**Interim recommendation:** Audit package advisories before `composer require`. If rejected, implement GD-based dHash in `App\Support\VisualSearch\` (~80 lines) to avoid new dependency.

---

## K. Frontend Integration Points (Phase 12 Preview)

1. Enable `ImageSearchModal` (`disabled={false}`) when feature flag on.
2. Add `useVisualSearch` hook → `POST /search/visual` via FormData.
3. Navigate to `/search?visual=1&session={id}` or dedicated results view with similarity badges.
4. Remove `VISUAL_SEARCH_QUERY` placeholder stub path once API live.
5. Add i18n keys for validation errors (invalid type, oversized, no results, searching).
6. Object URL preview with `URL.revokeObjectURL` on unmount.

---

## L. Test Inventory Gap (Phase 14–15)

**Backend tests needed:** 25 cases listed in spec — none exist today.  
**Frontend tests needed:** upload, preview, RTL, loading states — none exist.  
**E2E needed:** upload → search → results — none exist.

**Reuse patterns from:**

- `CatalogSearchQueryCountTest.php` — query count assertions
- `MediaUploadServiceTest.php` — image validation tests
- `RateLimitingTest.php` — throttle verification
- `SuggestedFiltersSection.test.tsx` — loading/error/empty states
- `filter-suggestions.spec.ts` — Playwright search page patterns

---

## M. Acceptance Criteria — Audit Phase

| Criterion | Status |
|-----------|--------|
| Existing codebase audited | ✅ |
| Architecture compatibility assessed | ✅ (fits, with boundaries above) |
| No unnecessary framework identified | ✅ |
| Duplication risks documented | ✅ |
| Security/privacy gaps documented | ✅ |
| Implementation **not** started | ✅ |

---

## N. Recommended Implementation Order (Next Steps)

1. **Phase 2** — `VISUAL_SEARCH_ARCHITECTURE.md` (detailed contracts)
2. **Phase 3** — Package compatibility decision (Intervention vs GD-native)
3. **Phase 4** — Migration + config + interfaces only
4. **Phase 5–9** — Engine, index, controller, product query integration
5. **Phase 10–13** — Cache, events foundation, frontend, i18n
6. **Phase 14–20** — Tests, benchmark, certification report

---

## O. Files to Touch (Estimated — Not Yet Changed)

### Backend (new)

- `app/Contracts/VisualSearch/VisualSearchEngineInterface.php`
- `app/Contracts/VisualSearch/VisualIndexInterface.php`
- `app/Services/VisualSearch/VisualSearchService.php`
- `app/Services/VisualSearch/Engines/PerceptualHashEngine.php`
- `app/Services/VisualSearch/Indexing/VisualIndexingService.php`
- `app/Http/Controllers/Api/V1/Search/VisualSearchController.php`
- `app/Http/Requests/Search/VisualSearchRequest.php`
- `database/migrations/*_create_visual_index_entries_table.php`
- `database/migrations/*_create_visual_search_events_table.php`

### Backend (modify)

- `routes/api.php` — one route + throttle
- `config/diyar.php` — visual_search block
- `app/Providers/AppServiceProvider.php` — rate limiter + bindings
- `app/Services/Catalog/ProductService.php` — `listPublicByIds()` ordered preserve

### Frontend (modify)

- `ImageSearchModal.tsx`, `MarketplaceShell.tsx`, `SearchPage.tsx`
- New: `api/visualSearch.ts`, `hooks/catalog/useVisualSearch.ts`

---

*End of Phase 1 audit. Proceed to Phase 2 architecture document before writing production code.*
