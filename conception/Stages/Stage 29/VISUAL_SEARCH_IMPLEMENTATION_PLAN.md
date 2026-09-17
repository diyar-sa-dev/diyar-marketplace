# Visual Search V1 — Phase 4 Implementation Plan

**Stage:** 29  
**Date:** 2026-09-12  
**Prerequisite:** [VISUAL_SEARCH_BENCHMARK.md](./VISUAL_SEARCH_BENCHMARK.md) — **APPROVED FOR IMPLEMENTATION**

This document is the executable file map and sequence for Phase 4. No code in this phase.

---

## Mandatory deltas from Phase 2 architecture

Apply before or during step 1:

| Setting | Phase 2 | Phase 4 (evidence-based) |
|---------|---------|--------------------------|
| Bucket probe | primary + 8 Hamming-1 neighbors | **all buckets within Hamming radius 3 on 12-bit prefix** |
| `sql_prefetch_cap` | 500 | **1500** (configurable) |
| `max_dimension_px` | 4096 | **2048** |
| `max_pixels` | (implicit) | **4_000_000** |

---

## Implementation file map

### Backend — CREATE

| Path | Purpose |
|------|---------|
| `database/migrations/YYYY_MM_DD_create_visual_index_entries_table.php` | Index table per Phase 2 DDL |
| `database/migrations/YYYY_MM_DD_create_visual_search_events_table.php` | Append-only events |
| `app/Models/VisualIndexEntry.php` | Eloquent model, BINARY(8) cast |
| `app/Models/VisualSearchEvent.php` | Event model |
| `app/Support/VisualSearch/VisualHashBits.php` | 8-byte string helpers, bucket, Hamming |
| `app/Support/VisualSearch/Dhash64Generator.php` | GD normalize + dHash (port from benchmark spike) |
| `app/Support/VisualSearch/VisualQueryFingerprint.php` | SHA-256 fingerprint |
| `app/Support/VisualSearch/BucketProbe.php` | 12-bit prefix radius-N probe set |
| `app/Support/VisualSearch/VisualSearchRanker.php` | similarity DESC, product_id ASC |
| `app/Support/VisualSearch/ProductSimilarityAggregator.php` | max(image_score) |
| `app/Services/Search/Visual/VisualSearchService.php` | Orchestration |
| `app/Services/Search/Visual/VisualIndexingService.php` | Index upsert/deactivate |
| `app/Services/Search/Visual/VisualCandidateRetriever.php` | SQL prefetch + Hamming |
| `app/Contracts/Search/VisualSearchEngineInterface.php` | Engine contract |
| `app/Http/Controllers/Api/V1/Search/VisualSearchController.php` | POST handler |
| `app/Http/Requests/Search/VisualSearchRequest.php` | 2048 KB, mime, dimensions |
| `app/Http/Resources/VisualSearchResultResource.php` | ProductCard + similarity |
| `app/Jobs/Search/IndexProductImageJob.php` | Async index |
| `app/Jobs/Search/RemoveVisualIndexEntryJob.php` | Async remove |
| `app/Jobs/Search/ReindexVisualCatalogJob.php` | Chunked rebuild |
| `app/Jobs/Search/RecordVisualSearchEventJob.php` | Async `search` event |
| `tests/Unit/Support/VisualSearch/Dhash64GeneratorTest.php` | Determinism |
| `tests/Unit/Support/VisualSearch/VisualHashBitsTest.php` | Hamming, bucket, probe |
| `tests/Unit/Support/VisualSearch/VisualSearchRankerTest.php` | Ordering |
| `tests/Feature/Api/V1/Search/VisualSearchTest.php` | End-to-end API |
| `tests/Feature/Api/V1/Search/VisualSearchQueryCountTest.php` | ≤3 queries |

### Backend — MODIFY

| Path | Change |
|------|--------|
| `config/diyar.php` | Add `visual_search` section (versions, limits, threshold, cache TTL) |
| `app/Support/Cache/CacheKeys.php` | Add `visualSearchResult(...)` key builder |
| `app/Providers/AppServiceProvider.php` | `RateLimiter::for('visual-search', ...)` |
| `routes/api.php` | `POST /search/visual` + optional events route V1.1 |
| `app/Services/Catalog/ProductService.php` | Add `listPublicByIds()`; dispatch index jobs in `attachImages` / `deleteImage` |
| `lang/*/diyar.php` or JSON lang files | `visual_search.*` validation messages |

### Backend — NO CHANGE

| Path | Reason |
|------|--------|
| `app/Services/Catalog/CatalogSearchService.php` | Text search isolation |
| `app/Services/Media/MediaUploadService.php` | Visual search uses temp decode only — do not store via product pipeline |
| `Product`, `ProductImage`, `MediaFile` models | FK targets only; no schema change to existing tables |
| `ProductCardResource` | Reuse via wrapper — no fork |

### Frontend — CREATE

| Path | Purpose |
|------|---------|
| `frontend/src/api/visualSearch.ts` | `POST` FormData to `/search/visual` |
| `frontend/src/hooks/useVisualSearch.ts` | TanStack Query mutation |
| `frontend/src/types/visualSearch.ts` | Response types |

### Frontend — MODIFY

| Path | Change |
|------|--------|
| `frontend/src/components/modals/ImageSearchModal.tsx` | Enable upload, preview, 2MB validation, submit |
| `frontend/src/MarketplaceShell.tsx` | Remove `disabled`, wire hook |
| `frontend/src/pages/SearchPage.tsx` | Visual results mode + similarity display |
| `frontend/src/lib/i18n/locales/en.ts` | Upload errors, loading, empty |
| `frontend/src/lib/i18n/locales/ar.ts` | RTL strings |

### Frontend — NO CHANGE

| Path | Reason |
|------|--------|
| `frontend/src/api/client.ts` | FormData handling already correct |
| Catalog text search pages | Isolation |

### Isolated benchmark — NO CHANGE in production

| Path | Note |
|------|------|
| `backend/scripts/benchmark/visual-search/*` | Reference only; do not autoload |

---

## Implementation sequence (30 steps)

1. **Configuration** — `diyar.visual_search` with corrected defaults  
2. **Database migration** — both tables  
3. **Visual index model** — casts for `hash_bits`  
4. **Hash/representation abstraction** — `VisualHashBits`, fingerprint  
5. **Native GD implementation** — `Dhash64Generator`  
6. **Bucket probe** — radius 3 prefix set  
7. **Candidate retrieval** — SQL + LIMIT + Hamming  
8. **Product aggregation** — max score  
9. **Ranker** — deterministic ordering  
10. **`ProductService::listPublicByIds()`**  
11. **`VisualSearchService`** — pipeline + cache  
12. **FormRequest** — security validation (reuse `ImageContentValidator` pattern)  
13. **Controller** — thin delegate  
14. **Rate limiter** — 20/min/IP  
15. **API route** — `POST /api/v1/search/visual`  
16. **Queue jobs** — index / remove / reindex  
17. **Index lifecycle hooks** — ProductService dispatch  
18. **Feedback event job** — `search` event async  
19. **Resources** — API response envelope  
20. **Backend unit tests**  
21. **Backend feature tests**  
22. **Frontend API client**  
23. **Frontend hook**  
24. **ImageSearchModal integration**  
25. **Search results integration**  
26. **i18n / accessibility**  
27. **Frontend tests** (if project convention requires)  
28. **Artisan command** — `visual-search:reindex`  
29. **Performance benchmark** — Phase 16 certification  
30. **Production readiness review**

---

## Index version strategy

| Key | Config | Example | Bump when |
|-----|--------|---------|-----------|
| `engine_version` | `diyar.visual_search.engine_version` | `perceptual-v1` | Engine class swap |
| `representation_version` | `diyar.visual_search.representation_version` | `dhash-64-v1` | Normalization/hash algorithm change |
| `ranking_version` | `diyar.visual_search.ranking_version` | `ranking-v1` | Ranker logic change |
| `index_version` | `diyar.visual_search.index_version` | `catalog-2026-09-15T12:00:00Z` | After bulk reindex completes |

Use ISO8601 compact timestamp from reindex command completion — not calendar date alone.

---

## Reindex strategy (Phase 4 behavior)

| Scenario | Behavior |
|----------|----------|
| Initial indexing | `visual-search:reindex` chunked by product_images |
| Incremental | Job on image create/delete |
| Full rebuild | New `index_version`; old rows deactivated after cutover |
| Failed job | Retry with idempotent upsert |
| Partial rebuild | Resume from last product_image cursor |
| Version migration | Dual-read optional; bump representation → full reindex |
| Rollback | Restore previous `index_version` config pointer |

---

## Query budget (production target)

```
1 × visual_index_entries prefetch (bucket IN + LIMIT)
1 × products listPublicByIds (card eager loads)
0-1 × cache read (StampedeSafeCache)
```

**Max 2 SQL queries** on cache miss.

---

## Phase 4 exit criteria

- [ ] All migrations applied  
- [ ] Reindex command populates index from existing product images  
- [ ] POST `/api/v1/search/visual` returns ProductCard + similarity  
- [ ] Feature tests green including query count  
- [ ] Frontend modal functional AR/EN  
- [ ] No raw image persistence (audit log / storage check)  
- [ ] Rate limit 429 verified  
- [ ] Server p95 < 300 ms on certification fixture set  
