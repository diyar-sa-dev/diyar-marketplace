# Visual Search V1 — Architecture (Phase 2)

**Stage:** 29 — Enterprise Visual Search  
**Date:** 2026-09-12  
**Status:** Architecture locked — **no implementation code**  
**Prerequisite:** [VISUAL_SEARCH_AUDIT.md](./VISUAL_SEARCH_AUDIT.md) (Phase 1 approved)

---

## 1. Purpose

Define contracts for DIYAR visual similarity search so V1 can ship as a **deterministic, perceptual-hash pipeline** inside existing Laravel + React, while remaining evolvable to embeddings, vector retrieval, and offline learned ranking — **without** rewriting catalog search or introducing LLM/vector-DB dependencies prematurely.

**Dependency policy (Phase 3):** Prefer **native GD** + in-repo hash implementation. Do **not** add `intervention/image` or `intervention/imagehash` unless a benchmark proves meaningful accuracy/latency advantage over GD-native dHash/pHash.

---

## 2. System Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│  React (ImageSearchModal → useVisualSearch)                             │
│    POST multipart /api/v1/search/visual                               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│  VisualSearchController → VisualSearchRequest (validate, no persist)  │
│    → VisualSearchService                                              │
│         1. Decode/normalize (GD, temp file only)                        │
│         2. VisualRepresentationGenerator → query fingerprint            │
│         3. Cache lookup (StampedeSafeCache, versioned key)              │
│         4. VisualSearchEngineInterface::retrieveCandidates()            │
│         5. VisualSearchRanker::rank()                                     │
│         6. ProductService::listPublicByIds() + cardQuery eager loads    │
│         7. VisualSearchResultResource (ProductCard + similarity)        │
│         8. Dispatch RecordVisualSearchEventJob (async, no raw image)    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
  MySQL                      Redis                 Queue
  visual_index_entries       result cache          indexing + events
  visual_search_events
```

**Out of scope for request path:** LLM, external APIs, full reindex, model training, permanent upload storage.

---

## 3. API Contract — `POST /api/v1/search/visual`

### 3.1 Route

| Property | Value |
|----------|--------|
| Method | `POST` |
| Path | `/api/v1/search/visual` |
| Prefix | `/api/v1` (existing) |
| Middleware | `throttle:visual-search` |
| Auth | **Optional** (same as public catalog — guests allowed) |
| Content-Type | `multipart/form-data` |

### 3.2 Request

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `image` | file | yes | `jpg`, `jpeg`, `png`, `webp`; max **2048 KB**; MIME + decode validation via `ImageContentValidator` pattern; **no SVG** |
| `page` | int | no | default `1`; max per `PaginationBounds` |
| `per_page` | int | no | default `20`; capped by `visual_search.result_limit` and global max (50) |

**Rejected inputs:** executable masquerading as image, corrupt decode, dimensions above `max_dimension_px` (4096), decompression bombs (pixel count cap enforced after decode).

**Not accepted:** base64 JSON body (frontend uses FormData like existing multipart uploads).

### 3.3 Success response (200)

Uses existing `ApiResponse::success()` envelope.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "…",
        "slug": "…",
        "sale_price": "199.00",
        "compare_price": "249.00",
        "image_url": "/storage/media/products/…/abc.webp",
        "similarity": 0.94,
        "vendor": { "id": "…", "store_name": "…", "slug": "…" }
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 20,
      "total": 12
    }
  },
  "meta": {
    "search_id": "uuid",
    "engine_version": "perceptual-v1",
    "representation_version": "dhash-64-v1",
    "ranking_version": "ranking-v1",
    "index_version": "catalog-2026-09-12",
    "result_count": 12,
    "cache": "hit"
  }
}
```

**Public fields:** `similarity` (0..1, 2 decimal places).  
**Not exposed:** raw hash, hamming distance, bucket id, matched `media_file_id`, internal rank components.

### 3.4 Error responses

| Status | Condition | Body |
|--------|-----------|------|
| 422 | Validation (type, size, corrupt, dimensions) | Laravel validation errors + localized `diyar.visual_search.*` messages |
| 429 | Rate limit | Standard throttle response |
| 503 | Engine/index unavailable (feature disabled, index empty, catastrophic failure) | `{ success: false, message: localized }` — **no stack trace, no paths** |
| 200 + empty | Valid search, no matches above threshold | `{ data: { items: [], pagination: … }, meta: { result_count: 0 } }` |

**Failure isolation:** Text search (`GET /catalog/search`) and storefront remain unaffected.

### 3.5 Headers

| Header | Direction | Purpose |
|--------|-----------|---------|
| `Accept-Language` | Request | Existing axios client — localized errors |
| `X-Visual-Search-Session` | Request (optional) | Anonymous session correlation for feedback (UUID v4, client-generated, no PII) |
| `X-Search-Session` | Request (optional) | Reuse existing analytics session if present |

### 3.6 Frontend contract

- New module: `frontend/src/api/visualSearch.ts` — `FormData`, strip `Content-Type` (existing `client.ts` behavior).
- Hook: `useVisualSearch` — TanStack Query `mutation` (not GET cache) — search is POST + non-idempotent representation.
- Results: navigate to `/search?mode=visual&search_id={uuid}` or inline results in modal — **implementation detail deferred to Phase 12**; API stable regardless.

---

## 4. Database Schema — `visual_index_entries`

One row per **indexed product image** (not per product). Authoritative marketplace data remains on `products` / `product_images` / `media_files`.

```sql
CREATE TABLE visual_index_entries (
    id              CHAR(36) PRIMARY KEY,           -- UUID
    product_id      CHAR(36) NOT NULL,              -- FK products.id
    product_image_id CHAR(36) NOT NULL,             -- FK product_images.id
    media_file_id   CHAR(36) NOT NULL,             -- FK media_files.id (denormalized for reindex)

    -- Representation (V1 perceptual)
    hash_bits       BINARY(8) NOT NULL,             -- 64-bit dHash stored big-endian
    hash_bucket     SMALLINT UNSIGNED NOT NULL,     -- top 12 bits of hash_bits for indexed lookup

    -- Versioning (reproducibility)
    engine_version          VARCHAR(32) NOT NULL,   -- e.g. perceptual-v1
    representation_version  VARCHAR(32) NOT NULL,   -- e.g. dhash-64-v1
    index_version           VARCHAR(64) NOT NULL,   -- e.g. catalog-2026-09-12

    -- Lifecycle
    is_active       TINYINT(1) NOT NULL DEFAULT 1,  -- 0 when product/image removed
    indexed_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,

    UNIQUE KEY uq_visual_index_product_image (product_image_id),
    UNIQUE KEY uq_visual_index_media (media_file_id),
    INDEX idx_visual_index_bucket_active (hash_bucket, is_active, index_version),
    INDEX idx_visual_index_product (product_id, is_active),
    INDEX idx_visual_index_version (index_version, is_active),

    CONSTRAINT fk_visual_index_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_visual_index_product_image
        FOREIGN KEY (product_image_id) REFERENCES product_images(id) ON DELETE CASCADE,
    CONSTRAINT fk_visual_index_media
        FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE
);
```

### 4.1 What is stored per indexed image?

| Field | Meaning |
|-------|---------|
| `hash_bits` | 64-bit **difference hash (dHash)** of normalized 256×256 grayscale image |
| `hash_bucket` | First 12 bits of `hash_bits` — **candidate pre-filter only**, not semantic |
| Foreign keys | Tie index row to live catalog entities |
| Version triple | Which algorithm/build produced this row |

**Not stored:** raw image bytes, thumbnails, embeddings, EXIF, filenames.

### 4.2 Product with up to 5 images

- Each `product_images` row → **at most one** `visual_index_entries` row.
- Enforced by `UNIQUE (product_image_id)`.
- Max **5 index rows per product** (matches `ProductService::MAX_IMAGES = 5`).

### 4.3 Duplicate images

| Scenario | Behavior |
|----------|----------|
| Same `media_file_id` indexed twice | Prevented by `UNIQUE (media_file_id)` |
| Re-upload replacing image | Old row deactivated or deleted; new row on reindex |
| Identical hash, different products (stock photo) | **Both rows kept** — different `product_id`; search returns both if similar |
| Identical hash, same product, different `sort_order` | Should not happen (one media per ProductImage); if media reused, unique constraint on `media_file_id` |

### 4.4 Deactivation vs delete

- Product archived / soft-deleted → set `is_active = 0` (or CASCADE delete via FK).
- Image removed → delete index row or `is_active = 0` + async cleanup.
- Candidate queries always filter `is_active = 1` AND join `products.publiclyVisible()` rules in final SQL.

---

## 5. Database Schema — `visual_search_events`

Append-only feedback / observability. **Never stores raw upload bytes.**

```sql
CREATE TABLE visual_search_events (
    id              CHAR(36) PRIMARY KEY,
    search_id       CHAR(36) NOT NULL,              -- correlates one search request
    event_type      VARCHAR(32) NOT NULL,           -- enum below
    occurred_at     TIMESTAMP NOT NULL,

    -- Query reference (NOT raw image)
    query_fingerprint CHAR(64) NOT NULL,            -- SHA-256 hex of hash_bits + representation_version

    -- Candidate context (nullable for search-level events)
    product_id      CHAR(36) NULL,
    rank_position   SMALLINT UNSIGNED NULL,           -- 1-based position in ranked list
    similarity_score DECIMAL(5,4) NULL,             -- 0.0000–1.0000 at time of event

    -- Version snapshot (reproducibility)
    engine_version          VARCHAR(32) NOT NULL,
    representation_version  VARCHAR(32) NOT NULL,
    ranking_version         VARCHAR(32) NOT NULL,
    index_version           VARCHAR(64) NOT NULL,

    -- Actor (optional)
    user_id         CHAR(36) NULL,
    session_key     VARCHAR(64) NULL,                 -- X-Visual-Search-Session or hashed IP+UA bucket

    -- Payload (sparse JSON for future signals)
    metadata        JSON NULL,

    INDEX idx_vse_search (search_id, occurred_at),
    INDEX idx_vse_product (product_id, event_type, occurred_at),
    INDEX idx_vse_fingerprint (query_fingerprint, occurred_at),
    INDEX idx_vse_type_time (event_type, occurred_at)
);
```

### 5.1 Event types (controlled vocabulary)

| Type | When emitted | Volume |
|------|--------------|--------|
| `search` | Search completed (success or empty) | 1 per request |
| `impression` | Result visible in viewport (frontend batch) | ≤ result_count |
| `click` | User opens product from visual results | sparse |
| `open` | Product detail viewed from visual result | sparse |
| `favorite` | Wishlist add attributed to visual session | sparse |
| `cart` | Add to cart attributed | sparse |
| `purchase` | Order line attributed (future attribution window) | sparse |
| `relevant` | Explicit positive feedback (future UI) | rare |
| `irrelevant` | Explicit negative feedback (future UI) | rare |

**V1 backend emits:** `search` only (sync metadata in response + async job).  
**V1.1 frontend emits:** `impression`, `click` via lightweight `POST /api/v1/search/visual/events` (batch, rate-limited).

### 5.2 Feedback lifecycle (never mutate live scoring)

```
┌──────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Search  │────▶│ visual_search_   │────▶│ Offline evaluation  │
│  (V1)    │     │ events (append)  │     │ (export / SQL / BI) │
└──────────┘     └──────────────────┘     └──────────┬──────────┘
                                                      │
                                                      ▼
                                            ┌─────────────────────┐
                                            │ Propose ranking-v2    │
                                            │ (weights, thresholds) │
                                            └──────────┬──────────┘
                                                      │
                                                      ▼
                                            ┌─────────────────────┐
                                            │ Benchmark vs v1     │
                                            │ (precision@K, latency)│
                                            └──────────┬──────────┘
                                                      │
                                                      ▼
                                            ┌─────────────────────┐
                                            │ Deploy new          │
                                            │ ranking_version     │
                                            │ (config flag/canary)│
                                            └─────────────────────┘
```

**Hard rule:** User feedback **never** updates `hash_bits`, bucket logic, or rank weights in the request path.

---

## 6. Similarity Score Matrix & Normalization

### 6.1 Image-level similarity (V1)

**Algorithm:** 64-bit dHash (GD-native, Phase 3 benchmark confirms implementation).

**Distance:** Hamming distance `d` = count of differing bits between query hash and index hash, `d ∈ [0, 64]`.

**Normalized similarity:**

```
similarity = round(max(0, 1 - (d / 64)), 4)
```

| Hamming d | Similarity | Interpretation (V1) |
|-----------|------------|---------------------|
| 0 | 1.00 | Identical representation |
| 6 | 0.91 | Very strong match |
| 13 | 0.80 | Strong match |
| 32 | 0.50 | Weak / ambiguous |
| 64 | 0.00 | Opposite |

**What `similarity = 0.90` means:** Query image and indexed image produce dHash bitstrings differing by ~6 bits (≈91% bit agreement). It is **not** a probability, not semantic “90% same product”, and not ML confidence.

### 6.2 Product-level aggregation (multi-image)

Each product may have up to 5 index rows. For each candidate product:

```
image_similarity[i] = similarity(query, image_i)   for each indexed image i of product P

product_similarity(P) = max(image_similarity[i])
best_image_id(P)      = argmax image_similarity[i]  (internal only)
```

**V1 ranker input:** `(product_id, product_similarity, best_image_id, d_min)`.

**Future (ranking-v2+):** Weighted aggregation — e.g. `0.7*max + 0.3*mean(top-2)`, category priors, business relevance — implemented only in `VisualSearchRanker`, not in hash engine.

### 6.3 Score matrix (internal record per candidate)

```php
// Conceptual — VisualSearchCandidate value object
[
    'product_id' => 'uuid',
    'product_image_id' => 'uuid',      // best matching image
    'media_file_id' => 'uuid',
    'hamming_distance' => 6,
    'similarity' => 0.9063,            // pre-round internal
    'similarity_public' => 0.91,       // API rounding
    'engine_version' => 'perceptual-v1',
    'representation_version' => 'dhash-64-v1',
]
```

### 6.4 Minimum similarity threshold

Config: `visual_search.min_similarity` default **0.70** (d ≤ 19).  
Candidates below threshold excluded before ranking cap. Prevents noisy tail from filling results.

### 6.5 Determinism

Same `(query hash_bits, index_version, engine_version, representation_version, ranking_version, config)` → **identical** ordered candidate list.

---

## 7. Candidate Retrieval (no full-catalog PHP scan)

### 7.1 Problem

Naive approach — load all hashes, compare in PHP — **rejected** (fails at 100K+ products).

### 7.2 Bucketed index lookup (V1)

```
hash_bits (64) = [ bucket: 12 bits | remainder: 52 bits ]
hash_bucket = hash_bits >> 52
```

**Step 1 — SQL pre-filter:**

```sql
SELECT id, product_id, product_image_id, hash_bits
FROM visual_index_entries
WHERE is_active = 1
  AND index_version = :index_version
  AND hash_bucket IN (:primary_bucket, :neighbor_buckets...)
LIMIT :sql_prefetch_cap   -- default 500, config visual_search.sql_prefetch_cap
```

**Neighbor buckets:** Primary bucket + Hamming-1 bucket variants on top 12 bits (bounded set ≤ 48 buckets worst case — config limits to **primary + 8 neighbors** for latency).

**Step 2 — PHP Hamming (bounded):**

- Compute `d` for each prefetched row only (≤ 500 comparisons).
- Keep rows with `d <= max_hamming` (derived from `min_similarity`).
- Sort by `d` ascending.

**Step 3 — Product aggregation:**

- Group by `product_id`, apply `max(similarity)` rule.
- Take top **`candidate_limit`** products (default 50).

**Complexity:** O(prefetch cap) not O(catalog images).

### 7.3 Future: VectorIndex / ExternalVectorIndex

`VisualIndexInterface`:

```php
interface VisualIndexInterface {
    /** @return list<VisualIndexMatch> */
    public function findNearest(
        string $queryHashBits,
        int $limit,
        IndexQueryContext $context,
    ): array;
}
```

V2 `EmbeddingIndex` replaces bucket SQL with ANN — **same** `VisualSearchRanker` input contract.

---

## 8. Ranking Layer

```
VisualSearchEngineInterface::retrieveCandidates()
        ↓
CandidateSet (image-level, bounded)
        ↓
ProductAggregator (max similarity per product)
        ↓
VisualSearchRanker::rank(CandidateSet, RankContext)
        ↓
RankedCandidateSet (product-level, sorted)
```

### 8.1 V1 ranker (`ranking-v1`)

Primary key: `product_similarity DESC`  
Tie-breakers (stable):

1. Lower `hamming_distance` on best image  
2. Higher `reviews_avg_rating` (if loaded — optional, from join)  
3. `product_id` ASC (deterministic)

**No ML. No feedback weights in V1.**

### 8.2 Future ranker (`ranking-v2`)

```
final_score = w0 * visual_similarity
            + w1 * category_match      (future)
            + w2 * business_boost      (future)
            + w3 * learned_click_prior (offline trained)
```

Weights live in config/versioned JSON — deployed only after offline eval.

---

## 9. Product Query Integration — `ProductService::cardQuery()`

### 9.1 New method (minimal extension)

```php
/**
 * @param  list<string>  $ids  UUIDs in desired result order
 * @return Collection<int, Product>
 */
public function listPublicByIds(array $ids, ?User $user = null): Collection;
```

**Behavior:**

1. Early return empty collection if `$ids === []`.
2. `$query = $this->cardQuery($user)->whereIn('id', $ids)`.
3. **Preserve order:** `orderByRaw('FIELD(id, ?, ?, …)', $ids)` (MySQL) or PHP sort after fetch (SQLite tests).
4. **Visibility:** `cardQuery()` → `publicQuery()` → `Product::publiclyVisible()` — inactive/archived/deleted vendors excluded automatically.
5. **Cap:** Reject or truncate if `count($ids) > candidate_limit`.
6. **Eager loads:** Same as `cardEagerLoads()` — **no N+1**.

### 9.2 Serialization

New resource wrapper or extended meta:

```php
// VisualSearchProductResource wraps ProductCardResource
// Injects similarity from RankedCandidateSet map by product_id
```

Do **not** fork `ProductCardResource` fields — reuse existing card shape for UI consistency.

### 9.3 Query count budget

| Step | Expected queries |
|------|------------------|
| Index prefetch | 1 |
| Product fetch by IDs | 1 |
| **Total** | **2** (+ cache read if hit) |

Integration test: assert query count ≤ 3 (same pattern as `CatalogSearchQueryCountTest`).

---

## 10. Redis Cache Strategy

### 10.1 What is cached

**Only** the ranked **product ID list + scores + versions** — never full product objects, never raw images.

```json
{
  "product_ids": ["uuid", "…"],
  "scores": { "uuid": 0.94 },
  "engine_version": "perceptual-v1",
  "representation_version": "dhash-64-v1",
  "ranking_version": "ranking-v1",
  "index_version": "catalog-2026-09-12",
  "cached_at": "2026-09-12T10:00:00Z"
}
```

### 10.2 Cache key (via `CacheKeys`)

```
diyar:visual-search:v1:{engine_version}:{representation_version}:{ranking_version}:{index_version}:{query_fingerprint}
```

- `query_fingerprint` = `hash('sha256', hash_bits || representation_version)` — **64 hex chars**
- Uses `StampedeSafeCache::remember()` — same stampede protection as catalog facets.

### 10.3 TTL

Default **300 seconds** (`visual_search.cache_ttl_seconds`). Short TTL — visual search is exploratory, index updates must propagate.

### 10.4 Invalidation

| Event | Action |
|-------|--------|
| Single product/image reindexed | No per-key purge required if `index_version` unchanged; row-level `hash_bits` update affects only new queries |
| Bulk reindex / rebuild complete | **Bump `index_version`** globally (e.g. `catalog-2026-09-15`) — all prior cache keys miss automatically |
| Engine/representation change | Bump `engine_version` / `representation_version` in config |
| Ranking deploy | Bump `ranking_version` |

**Pattern:** Version-aware keys (like `CacheKeys::CATALOG_VERSION`) — prefer version bump over SCAN/delete.

Optional: register `visual_index_version` in Redis (`diyar:visual-search:index:version`) read on every request for key suffix.

---

## 11. Engine / Version Contract

| Version key | Config path | Example | When to bump |
|-------------|-------------|---------|--------------|
| `engine_version` | `diyar.visual_search.engine_version` | `perceptual-v1` | New engine class (pHash → embedding hybrid) |
| `representation_version` | `diyar.visual_search.representation_version` | `dhash-64-v1` | Hash algorithm/dimensions/normalization change |
| `ranking_version` | `diyar.visual_search.ranking_version` | `ranking-v1` | Ranker logic/weights change |
| `index_version` | `diyar.visual_search.index_version` | `catalog-2026-09-12` | Reindex complete, bulk rebuild |

**Every** `visual_search_events` row and API `meta` block carries all four versions active at event time.

---

## 12. Indexing & Reindexing

### 12.1 Indexing pipeline

```
ProductImage created/updated
    ↓
IndexVisualRepresentationJob (queue: default or catalog-low)
    ↓
VisualIndexingService::indexProductImage(ProductImage)
    ↓
Read MediaFile from disk (public media disk)
    ↓
GD normalize 256×256 grayscale
    ↓
Compute dHash → upsert visual_index_entries
```

**Triggers:**

| Event | Job |
|-------|-----|
| `ProductImage` created | Index |
| `ProductImage` deleted | Deactivate/delete index row |
| `MediaFile` path replaced | Reindex |
| Product archived | Deactivate all rows for product |
| Product restored | Reindex active images |

**Idempotency:** Upsert on `product_image_id` — same job twice produces identical row.

**Non-blocking:** Vendor image upload API returns before index job completes (eventual consistency ≤ seconds).

### 12.2 Reindex command

```
php artisan visual-search:reindex
  --chunk=200
  --only-missing
  --product-id=
  --dry-run
```

**Behavior:**

- Cursor/chunk over `product_images` joined to publicly visible products (or all active images for full rebuild).
- Bounded memory — one chunk in memory at a time.
- Resumable — `--since-id=` cursor checkpoint file or DB watermark table (optional `visual_index_runs` audit table in V1.1).
- On completion: operator bumps `index_version` in config/env and deploys (or command auto-bumps with `--promote-version` flag, logged).

**Never:** Load entire catalog into memory. Never run full reindex synchronously in HTTP request.

### 12.3 Initial backfill

One-time deploy task: run `visual-search:reindex --only-missing` after migration, before enabling feature flag.

---

## 13. Latency Budget (50–300 ms application target)

Measured **inside Laravel** from request received to response sent (excludes client upload time on slow networks).

| Phase | Target p50 | Target p95 | Measurement hook |
|-------|------------|------------|------------------|
| Validation + temp file | 5–15 ms | 10–25 ms | `visual_search.phase.validate_ms` |
| GD decode + normalize 256² | 10–30 ms | 20–50 ms | `visual_search.phase.normalize_ms` |
| dHash generation | 5–15 ms | 10–30 ms | `visual_search.phase.hash_ms` |
| Cache lookup | 1–5 ms | 2–10 ms | `visual_search.cache_hit` |
| Bucket SQL + Hamming | 5–20 ms | 15–50 ms | `visual_search.phase.retrieve_ms` |
| Rank + aggregate | 1–5 ms | 2–10 ms | `visual_search.phase.rank_ms` |
| Product SQL (cardQuery) | 10–40 ms | 20–80 ms | `visual_search.phase.db_ms` |
| Serialize | 5–10 ms | 10–20 ms | `visual_search.phase.serialize_ms` |
| **Total** | **50–120 ms** | **80–250 ms** | `visual_search.latency_ms` |

**Certification records:** p50, p95, p99 under defined load (k6 or PHP benchmark script) — same pattern as smart filter certification.

**Not guaranteed** — targets for Phase 16 benchmark. Fail certification if p95 > 300 ms under agreed benchmark catalog size without documented bottleneck fix plan.

---

## 14. Security & Privacy Boundaries

| Rule | Implementation |
|------|----------------|
| No permanent search image storage | Process `UploadedFile` temp path only; `@unlink` in `finally` |
| No DB blob of upload | Only `query_fingerprint` in events |
| No raw image in logs | Structured logs: sizes, durations, versions, search_id |
| MIME + decode validation | Reuse `ImageContentValidator` + max pixels (`width*height ≤ 16MP`) |
| SVG rejected | Not in allowed mimes |
| 2 MB max | `VisualSearchRequest` rule + ini check |
| Rate limit | Dedicated `visual-search` limiter — default **20/min/IP** (stricter than text search 60/min) |
| Auth optional | Public endpoint; user_id recorded when authenticated |
| Internal paths hidden | Errors use `__('diyar.visual_search.failed')` |
| Feature flag | `DIYAR_VISUAL_SEARCH_ENABLED=false` → 503 graceful |

---

## 15. Observability

Structured log events (info/warning):

```
visual_search.request
visual_search.success
visual_search.failure
visual_search.cache_hit | cache_miss
visual_search.latency_ms
visual_search.candidate_count
visual_search.db_queries
visual_search.engine_version
```

**Never log:** binary image data, base64, temp file paths in production responses.

---

## 16. Configuration Block (`config/diyar.php`)

```php
'visual_search' => [
    'enabled' => env('DIYAR_VISUAL_SEARCH_ENABLED', true),
    'max_upload_kb' => 2048,
    'max_dimension_px' => 4096,
    'max_pixels' => 16_777_216,           // 4096×4096 cap
    'working_dimension_px' => 256,
    'min_similarity' => 0.70,
    'candidate_limit' => env('VISUAL_SEARCH_CANDIDATES', 50),
    'result_limit' => env('VISUAL_SEARCH_RESULTS', 20),
    'sql_prefetch_cap' => 500,
    'neighbor_bucket_count' => 8,
    'cache_ttl_seconds' => 300,
    'engine_version' => 'perceptual-v1',
    'representation_version' => 'dhash-64-v1',
    'ranking_version' => 'ranking-v1',
    'index_version' => env('DIYAR_VISUAL_SEARCH_INDEX_VERSION', 'catalog-initial'),
    'rate_limit_per_minute' => env('DIYAR_VISUAL_SEARCH_RATE_LIMIT', 20),
],
```

---

## 17. Domain Interfaces (PHP contracts)

```php
interface VisualSearchEngineInterface {
    public function retrieveCandidates(
        VisualQuery $query,
        CandidateRetrievalContext $context,
    ): ImageCandidateSet;
}

interface VisualIndexInterface {
    public function upsert(VisualIndexEntry $entry): void;
    public function deactivateForProductImage(string $productImageId): void;
    public function prefetchByBucket(int $bucket, IndexQueryContext $ctx): array;
}

interface VisualSearchRankerInterface {
    public function rank(ProductCandidateSet $candidates, RankContext $ctx): RankedCandidateSet;
}

interface VisualRepresentationGeneratorInterface {
    public function fromUploadedFile(UploadedFile $file): VisualQuery;
    public function fromMediaFile(MediaFile $file): VisualIndexEntryDraft;
}
```

**V1 implementations:** `GdDHashEngine`, `MysqlBucketVisualIndex`, `MaxSimilarityRanker`, `GdVisualRepresentationGenerator`.

---

## 18. V1 → V2 Evolution Path

| Version | Retrieval | Representation | Ranking | Index storage |
|---------|-----------|----------------|---------|---------------|
| **V1** | Hash buckets + Hamming | dHash 64-bit (GD) | Max similarity, deterministic | `visual_index_entries.hash_bits` |
| **V1.1** | Same | Same | Same + feedback events | Same |
| **V1.2** | Same | Same | Offline-evaluated `ranking-v2` weights | Same |
| **V2** | ANN / vector index | CLIP-style embedding (new column or table) | Learned ranker | `visual_index_embeddings VECTOR(512)` or Redis HNSW |
| **V2.1** | External vector service | Managed embeddings | Same ranker interface | ExternalVectorIndex adapter |
| **V3** | Hard-negative mining | Fine-tuned model | Personalized (still offline train) | Versioned model artifacts |

**Migration strategy:**

1. Add `visual_index_embeddings` table — do not drop hash table.
2. Dual-write indexing jobs populate both during canary.
3. `VisualSearchEngineInterface` implementation selected by config `visual_search.engine` = `perceptual` | `embedding`.
4. Feedback dataset already has `query_fingerprint` — V2 adds `query_embedding_id` column to events (nullable).
5. A/B via `ranking_version` + `engine_version` in meta.

**Do not claim "AI-powered" in V1** — marketing copy: "visual similarity search" or "search by image".

---

## 19. Phase 2 Acceptance Gate — Checklist

| Question | Answer location |
|----------|-----------------|
| What exactly is stored per indexed image? | §4.1 — `hash_bits`, FKs, versions |
| How is a product with 5 images represented? | §4.2 — up to 5 rows, aggregated at rank |
| How are duplicate images handled? | §4.3 — unique on media_file_id; stock photos allowed across products |
| How is similarity normalized to 0..1? | §6.1 — `1 - d/64` |
| How are multiple product-image scores combined? | §6.2 — **max** (V1); ranker extensible |
| What does `score=0.90` mean? | §6.1 — ~6 bit Hamming difference, not probability |
| How are top-K candidates retrieved without full PHP scan? | §7.2 — bucket SQL prefetch + bounded Hamming |
| How are product visibility rules applied? | §9.1 — `publiclyVisible()` via `cardQuery()` |
| How does cache invalidation work? | §10.4 — version bumps on index/engine/ranking |
| How is the index rebuilt safely? | §12.2 — chunked artisan command, idempotent upsert |
| How are feedback events versioned? | §5 — four version columns on every event row |
| How can V1 migrate to embeddings? | §18 — parallel table, interface swap, dual-write |
| What is measured as p50/p95/p99? | §13 — per-phase + total `visual_search.latency_ms` |
| What happens when visual search unavailable? | §3.4 — 503 localized; text search unaffected |

---

## 20. Related Documents (Phase 5+)

To be created during implementation — **not in Phase 2:**

| Document | Phase |
|----------|-------|
| `VISUAL_SEARCH_SECURITY.md` | 17 |
| `VISUAL_SEARCH_PERFORMANCE.md` | 16 |
| `VISUAL_SEARCH_FEEDBACK.md` | 11 (expand §5) |
| `VISUAL_SEARCH_OPERATIONS.md` | 19 |
| `VISUAL_SEARCH_COMPLETION_REPORT.md` | 20 |

---

## 21. Phase 2 Verdict

**ARCHITECTURE APPROVED FOR IMPLEMENTATION PLANNING**

- Contracts locked: index schema, events schema, API, scoring, cache, versioning, indexing, failure modes.
- GD-native path preferred; Intervention deferred to benchmark gate.
- Feedback append-only; no live scoring mutation.
- Multi-image aggregation explicit (max, extensible).
- Evolution path to embeddings documented without V1 over-engineering.

**Next step:** Phase 3 — GD dHash benchmark spike (no production routes) → Phase 4 migration + interfaces only.

---

*End of Phase 2 architecture document.*
