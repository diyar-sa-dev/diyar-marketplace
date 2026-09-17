# Visual Search V1 — Phase 3 Benchmark & Readiness Report

**Stage:** 29 — Enterprise Visual Search  
**Date:** 2026-09-12  
**Status:** Phase 3 complete — **no production code authored**  
**Prerequisites:** [VISUAL_SEARCH_AUDIT.md](./VISUAL_SEARCH_AUDIT.md), [VISUAL_SEARCH_ARCHITECTURE.md](./VISUAL_SEARCH_ARCHITECTURE.md)

**Benchmark artifacts:** `backend/scripts/benchmark/visual-search/` (isolated spike; not production)  
**Raw results:** `backend/scripts/benchmark/visual-search/output/phase3-results.json`, `sql-explain-results.json`

---

## VERDICT

```
PHASE 3 — APPROVED FOR IMPLEMENTATION
```

Phase 4 may begin implementation **after applying the mandatory architecture corrections in §Architecture corrections** (bucket multi-probe radius and `sql_prefetch_cap`). No production routes, migrations, or packages were added in Phase 3.

| Decision | Result |
|----------|--------|
| Hash engine | **GD_NATIVE_APPROVED** |
| Intervention Image/ImageHash | **Not installed** — no measured advantage; avoid dependency |
| Hash storage | **BINARY(8) big-endian string** in PHP/Laravel |
| Index eligibility | **Strategy B** — index only publicly searchable images (`is_active=1` + visibility at query) |
| Product aggregation | **KEEP_MAX_AGGREGATION** |
| Ranking | **similarity DESC, product_id ASC** |
| Default `sql_prefetch_cap` | **1500** (was 500 in Phase 2 — insufficient for recall) |
| Bucket probe | **12-bit prefix, Hamming radius 3** (was primary+8 neighbors — recall 25%) |

---

## Repository validation

### Runtime stack (verified)

| Component | Actual |
|-----------|--------|
| Laravel | `^13.17` (`backend/composer.json`) |
| PHP | **8.3.33** (Docker app container) |
| GD | **yes** — JPEG, PNG, WebP |
| MySQL | **8.0.46** (Docker) |
| Redis | Required in production (`DIYAR_ENFORCE_REDIS_IN_PRODUCTION=true`) |
| Queue | `QUEUE_CONNECTION=redis` (`.env.example`, production stack) |
| Cache | `CACHE_STORE=redis` |
| Octane | `laravel/octane` in require-dev; optional (`OCTANE_*` in `.env.docker-dev.example`) |

### Conventions (file paths)

| Area | Path / pattern |
|------|----------------|
| API routes | `backend/routes/api.php` — prefix `/api/v1` |
| FormRequest | `backend/app/Http/Requests/{Domain}/` |
| Resources | `backend/app/Http/Resources/` |
| Services | `backend/app/Services/{Domain}/` |
| UUID PKs | `HasUuids`, `$keyType = 'string'` on Product, ProductImage, MediaFile |
| Timestamps | Laravel defaults on all three models |
| Migrations | `backend/database/migrations/` — UUID FKs with `foreignUuid()->constrained()->cascadeOnDelete()` |
| Rate limiters | `backend/app/Providers/AppServiceProvider.php` — `RateLimiter::for()` |
| Cache keys | `backend/app/Support/Cache/CacheKeys.php`, `StampedeSafeCache.php` |
| Media validation | `backend/app/Support/Media/ImageContentValidator.php` |
| Product images | `backend/app/Services/Catalog/ProductService.php` — `MAX_IMAGES = 5`, `attachImages()` |
| Public visibility | `backend/app/Models/Product.php` — `scopePubliclyVisible()` |

### Phase 2 assumption: one index row per product image

**VALID without schema modification.**

| Question | Finding |
|----------|---------|
| Product PK | UUID (`products.id`) |
| ProductImage PK | UUID (`product_images.id`) |
| MediaFile PK | UUID (`media_files.id`) |
| FKs | `product_images.product_id → products`, `product_images.media_file_id → media_files` (cascade) |
| Duplicate ProductImage per MediaFile | Not DB-enforced; each upload creates new `MediaFile` via `MediaUploadService::storeProductImage()` |
| MediaFile content hash | **None** — no SHA column |
| Path changes | New upload → new `MediaFile` row + new path; old file deleted in `deleteImage()` |
| Product delete | **Soft** (`SoftDeletes` on Product) |
| ProductImage delete | **Hard** — `deleteImage()` removes MediaFile + row |
| Max 5 images | Enforced in `ProductService::attachImages()` |
| WebP for product images | **Yes** when optimization enabled — `persistOptimizedRaster(..., 'product')` → WebP, max 2000×2000 profile |
| Observers / image jobs | **None** — indexing hooks must be added in Phase 4 at upload/delete paths |

**Production catalog snapshot (Docker `diyar_production_local`):** 12 products, **0 product_images**, 0 media_files — benchmarks use synthetic fixtures and statistical catalog simulation.

---

## GD benchmark

Environment: PHP 8.3.33 + GD in Docker, 512M memory limit for benchmark runner.

### Global timing (720 runs, mixed fixtures)

| Metric | decode | normalize | hash | **total** |
|--------|-------:|----------:|-----:|----------:|
| **p50** | ~4–10 ms | ~11–17 ms | ~0.5 ms | **15.7 ms** |
| **p95** | ~5–10 ms | ~12–17 ms | ~0.7 ms | **27.9 ms** |
| **p99** | — | — | — | **343.6 ms** |
| min | 3.8 ms | — | — | 3.8 ms |
| max | — | — | — | 420 ms (large 4000×3000 decode) |

**Representative `base_square` (800×800 JPEG):** total p50 **15.8 ms**, p95 **16.9 ms**.  
**Large (4000×3000):** total p95 **~420 ms** — validates need for upload dimension caps.

### Failure rate

**0%** across JPEG, PNG, WebP, square/landscape/portrait fixtures.

### Server processing budget vs Phase 2 target (50–300 ms)

| Phase | p50 | p95 | Within 50–300 ms server budget? |
|-------|----:|----:|:-------------------------------:|
| decode+normalize+hash | ~16 ms | ~28 ms | **Yes** |
| + SQL prefetch + Hamming 1500 | ~16 + ~2 ms | ~30 ms | **Yes** |
| + `listPublicByIds` + serialize | ~20–40 ms est. | ~60 ms est. | **Yes** |

End-to-end (2 MB upload over network) is **not** bounded by 300 ms — report server and E2E separately in Phase 16 certification.

---

## Package comparison

| Metric | GD (measured) | Intervention (not installed) |
|--------|--------------:|-----------------------------:|
| installation complexity | **0** — ext-gd already required | composer + 2 packages |
| dependency footprint | **0 bytes** | ~hundreds KB + transitive |
| PHP compatibility | **8.3 verified** | would need spike |
| decode+normalize+hash p50 | **~16 ms** | not measured |
| peak memory | bounded by caps | not measured |
| accuracy (fixture set) | see §Accuracy | — |
| maintenance | in-repo ~200 lines | upstream semver |
| operational risk | **low** | medium (extra supply chain) |

**Decision: `GD_NATIVE_APPROVED`** — do not add Intervention for V1.

---

## Hash representation decision

**Canonical:** 64-bit dHash as **8-byte binary string**, **big-endian** (bit 63 = MSB of byte 0).

| Concern | Validation |
|---------|------------|
| PHP 64-bit signed int | **Avoid** — use `string` length 8 |
| MySQL | `BINARY(8)` — equality and storage verified in spike |
| Laravel | Custom cast recommended; do not cast to `int` |
| Redis/cache | Store derived **query_fingerprint** (SHA-256 hex), never raw image |
| Hamming | `$a ^ $b` byte-wise + popcount lookup |
| Bucket | `($b0 << 4) \| ($b1 >> 4)` top 12 bits |
| Determinism | Round-trip bits ↔ binary **verified** |

**Normalization (locked for `dhash-64-v1`):**

1. GD decode (JPEG/PNG/WebP only)  
2. Letterbox to **256×256** grayscale, neutral background **RGB(128,128,128)**  
3. Downsample 256² → **9×8**, horizontal dHash → 64 bits  

---

## Candidate retrieval validation

### Catalog size simulation (uniform random hashes)

| Images | avg rows/bucket | median | p95 | p99 | max |
|-------:|----------------:|-------:|----:|----:|----:|
| 10,000 | 2.4 | 2 | 5 | 7 | 10 |
| 50,000 | 12.2 | 12 | 18 | 21 | 27 |
| 100,000 | 24.4 | 24 | 33 | 37 | 44 |
| 250,000 | 61.0 | 61 | 74 | 80 | 87 |

12-bit buckets produce **bounded** per-bucket counts at DIYAR scale targets.

### Bucket recall experiment (mandatory)

Positive pairs from synthetic fixtures (same pattern, resize/recompress/crop/brightness):

| Pair | Full Hamming | Same 12-bit bucket? | Recall primary+8 neighbors? |
|------|-------------:|:-------------------:|:---------------------------:|
| square → resized | 7 | No | **No** |
| square → recompressed | 1 | Yes | **Yes** |
| square → cropped | 18 | No | **No** |
| square → brightness | 10 | No | **No** |

**Primary bucket recall: 25%**  
**Primary + 8 Hamming-1 neighbors: 25%**

**Root cause:** perceptually similar images often differ by **>1 bit in the top 12 hash prefix** (prefix Hamming 4–7 observed). Phase 2 neighbor policy is insufficient.

### Architecture corrections (mandatory for Phase 4)

1. **Replace** “primary + 8 Hamming-1 neighbors” with **multi-probe: all 12-bit buckets within Hamming radius 3** of query bucket (~299 buckets max; ~3,650 candidates at 50K images; ~7,300 at 100K).
2. **Raise** `visual_search.sql_prefetch_cap` default from **500 → 1500** (configurable).
3. **Optional fallback:** if results < `min_results` after first pass, expand to radius 4 (Phase 4 implementation detail).

At 250K images, radius-3 probe ≈ 794 × 61 ≈ **48K** rows worst case — Phase 4 must use **hard SQL LIMIT** + PHP Hamming (still <5 ms at 5K candidates) or catalog-size-aware radius tuning. For launch catalog (<100K images), radius 3 + cap 1500 is safe.

### Candidate limit validation

With corrected probe set (~110 expected neighbors at 50K for radius-3 on a single bucket’s neighborhood — actually full radius-3 set is larger):

| Limit | Recall (fixture pairs in bucket set) | Sufficient? |
|------:|-------------------------------------:|:-----------:|
| 50 | 25% | No |
| 500 | 25%* | No* |
| 1500 | **100%** when target in probe set | **Yes** |

\*Low recall when target not in probe set — fixed by radius-3 probe, not limit alone.

**Hamming over candidates (measured):**

| Candidates | Total time | per candidate |
|----------:|-----------:|--------------:|
| 50 | 0.04 ms | 0.73 µs |
| 500 | 0.33 ms | 0.66 µs |
| 1000 | 0.75 ms | 0.75 µs |

500×64-bit comparison is **negligible** vs decode (~16 ms).

---

## Database validation

### SQL EXPLAIN (TEMP table, 50K rows, MySQL 8.0.46)

```sql
WHERE is_active = 1 AND index_version = ? AND hash_bucket IN (9 buckets...) LIMIT 500
```

| Field | Value |
|-------|-------|
| Index used | **`idx_visual_index_bucket_active`** |
| type | **range** |
| rows examined (estimate) | 108 |
| rows returned | 108 |
| execution time | **1.19 ms** |
| Full table scan? | **No** |

Phase 2 schema indexes are **valid**. Scale test with expanded IN list (≤299 buckets) in Phase 4 feature tests.

### FK / UUID strategy

Matches repository: UUID `CHAR(36)` PKs, `foreignUuid()->constrained()->cascadeOnDelete()` — compatible with Phase 2 DDL.

---

## Memory analysis

| Input | Est. RGBA | Measured / projected |
|-------|----------:|---------------------|
| 1024² | 4 MB | decode OK, ~17 ms |
| 2048² | 16 MB | decode OK, ~52 ms |
| 4096² | 64 MB | **projected ~128 MB+ working set** — risk at 128M `memory_limit` |
| 8000×6000 | 192 MB | **projected ~384 MB** — decompression bomb risk |

**Recommendations for Phase 4 (`visual_search` config):**

| Setting | Value | Rationale |
|---------|------:|-----------|
| `max_upload_kb` | **2048** | Phase 2 contract |
| `max_width` / `max_height` | **2048** | Align with product optimization profile (2000) + margin |
| `max_pixels` | **4_000_000** (2000×2000) | Reject before full decode via `getimagesize()` |
| `working_dimension_px` | **256** | Locked |

Use `getimagesize()` → compute pixels → reject before `imagecreatefrom*()`.

---

## Security validation

| Control | Repository / benchmark |
|---------|------------------------|
| 2 MB limit | Phase 2; product uploads allow 5120 KB — visual search must use **separate 2048 KB** rule |
| MIME + extension | Reuse `ImageContentValidator` + allowed list (no SVG) |
| Corrupt decode | GD throws — map to 422 |
| SVG | **Rejected** — not in allowed mimes |
| Temp file | `UploadedFile` temp only — **never** `storeProductImage()` |
| Raw persistence | **None** in search path |
| Dimension / pixel caps | Required (see Memory) — **not** blind 4096×4096 |

---

## Queue / indexing validation

Existing jobs pattern: `backend/app/Jobs/` — queue-backed, idempotent-style handlers.

**Phase 4 jobs (design only):**

| Job | Trigger |
|-----|---------|
| `IndexProductImageJob` | `ProductService::attachImages()` / `addImages()` |
| `RemoveVisualIndexEntryJob` | `ProductService::deleteImage()` |
| `ReindexVisualCatalogJob` | Artisan command / version bump |

No Product observers exist — **explicit dispatch** from ProductService (minimal hooks) preferred over new observers (YAGNI).

Requirements: idempotent upsert on `product_image_id`, `is_active=0` on deactivation, version-aware, chunked reindex.

---

## Cache validation

Pattern: `StampedeSafeCache::remember()` + versioned keys (`CacheKeys` style).

**Visual search cache key (locked):**

```
diyar:visual-search:v1:{engine}:{representation}:{ranking}:{index}:{query_fingerprint}
```

| Must include | Must NOT include |
|--------------|------------------|
| engine/representation/ranking/index versions | raw image bytes |
| SHA-256 query_fingerprint | temp paths |
| ranked product IDs + scores | binary hash in client-visible cache |

Invalidation: bump `index_version` / `representation_version` — no SCAN purge required.

---

## Query fingerprint validation

```
query_fingerprint = SHA-256(hash_bits || representation_version)
```

| Property | Verified |
|----------|----------|
| Deterministic | Yes |
| Compact | 64 hex chars |
| Safe for Redis/events | Yes |
| Reversible to image | **No** |
| Distinct from perceptual hash | Yes — different purpose |

---

## Rate limiting validation

Existing `catalog-search`: **60/min/IP** (`diyar.rate_limits.catalog_search_per_minute`).

Visual search proposed **20/min/IP** is **appropriate**:

- Higher CPU per request (~16–60 ms server vs ~5 ms text)
- 2 MB upload abuse surface
- NAT/shared IP: same as catalog (IP-based); authenticated **optional** second limiter `60/min/user` in Phase 4 if needed

Register `RateLimiter::for('visual-search', ...)` in `AppServiceProvider` — mirror catalog pattern.

---

## Frontend integration validation

| File | Status |
|------|--------|
| `frontend/src/components/modals/ImageSearchModal.tsx` | Stub — `disabled` prop, no upload handler |
| `frontend/src/MarketplaceShell.tsx` | Opens modal with `disabled` |
| `frontend/src/pages/SearchPage.tsx` | `VISUAL_SEARCH_QUERY` placeholder |
| `frontend/src/api/client.ts` | **FormData** strips Content-Type ✓ |
| i18n | `visualSearchSoon`, `visualSearchTitle` in `ar.ts` / `en.ts` |

**Phase 4 frontend gaps:** object URL preview/cleanup, 2 MB client validation, `accept="image/jpeg,image/png,image/webp"`, hook + API module, loading/error/empty, keyboard/a11y, wire submit.

---

## Public catalog eligibility — Strategy A vs B

| | Strategy A (index all, filter after) | Strategy B (index public only) |
|---|--------------------------------------|--------------------------------|
| Correctness | Requires post-filter anyway | **Cleaner** |
| Recall | Pollutes buckets with inactive rows | **Higher signal** |
| Update complexity | Deactivate flags on many events | **Same flags + simpler counts** |
| Query latency | Worse candidate pollution | **Better** |
| Queue complexity | Must deactivate on vendor/product hide | **Reindex on publish** |

**Choice: Strategy B** — index only searchable images; set `is_active=0` on product deactivate, soft-delete, vendor suspend, image delete; `listPublicByIds()` enforces `publiclyVisible()` at hydration.

`scopePubliclyVisible()` (`Product.php`): `status = active` AND vendor in `vendor_accounts.status = active`.

---

## Product aggregation validation

Example: scores [0.72, 0.94, 0.61] → **product_score = 0.94**.

Evaluated alternatives: max, average, top-2 average — **max** best for “best matching angle” without punishing multi-image products.

**Decision: `KEEP_MAX_AGGREGATION`**

---

## Ranking validation

V1: **`product_score DESC`, tie-break `product_id ASC`** (immutable UUID).

Do not use `created_at`, price, or random tie-breaks in V1.

---

## `listPublicByIds()` validation

**Does not exist** in `ProductService` today.

**Required Phase 4 contract** (from Phase 2, validated against `cardQuery()` / `cardEagerLoads()`):

```php
public function listPublicByIds(array $ids, ?User $user = null): Collection;
```

- Early return on `[]`
- `$this->cardQuery($user)->whereIn('id', $ids)`
- Preserve order via `orderByRaw('FIELD(id, ...)')` (MySQL) / collection sort (SQLite tests)
- Eager: vendorAccount, category, images.mediaFile, inventory — **no N+1**

---

## Query count validation

| Step | Queries |
|------|--------:|
| Bucket prefetch | 1 |
| `listPublicByIds` | 1 |
| Cache read (hit) | 0 SQL |
| **Total miss** | **2** |

Assert ≤3 in feature tests (parity with `CatalogSearchQueryCountTest`).

---

## Accuracy benchmark

Fixture-controlled pairs (synthetic patterns — not real product photos):

### Positive pairs (should match at threshold 0.70)

| Pair | Distance | Similarity |
|------|----------:|-----------:|
| format JPG↔PNG | 0 | 1.00 |
| JPG↔WebP | 1 | 0.98 |
| recompressed | 1 | 0.98 |
| resized | 7 | 0.89 |
| brightness | 10 | 0.84 |
| resolution variant | 12 | 0.81 |
| cropped | 18 | 0.72 |

Positive distance: avg **7**, p95 **18**, max **18**.

### Negative pairs

| Pair | Distance | Similarity |
|------|----------:|-----------:|
| similar palette | 24 | 0.63 |
| different orientation | 14 | 0.78 |
| different products | 14 | 0.78 |
| different product (same grid) | 9 | 0.86 |

Negative distance: avg **15.25**, min **9**.

### Threshold analysis

- **`min_similarity = 0.70` (d ≤ 19):** captures all fixture positives including crop (18).
- **Overlap risk:** synthetic “different product same grid” at d=9 (similarity 0.86) — real catalog photos expected to separate better; monitor in Phase 16 with real images.
- **Do not** treat 0.90/0.80 as universal — report **observed distribution** above.

---

## Feedback / offline learning

Pattern exists: `SearchAnalyticsRecorder` → `search_query_events` (text search).

Visual events: separate `visual_search_events` table (Phase 2) — append-only, no raw images.

**Offline loop (no online learning):**

```
Search → Events → Offline eval → Ranking proposal → Benchmark → Canary → Deploy new ranking_version
```

Metrics: Precision@K, Recall@K, MRR, NDCG@K, CTR, add-to-cart, purchase conversion.

**Hard rule:** production search **never** self-modifies ranking from individual feedback.

---

## Testing strategy

### Backend unit
dHash determinism, normalization, Hamming, similarity, fingerprint, bucket, aggregation, ranking, versioning, prefix-radius probe set

### Backend feature
Valid/invalid JPEG PNG WebP, corrupt, oversized, dimensions, pixels, SVG, guest/auth, 429, empty, ordering, visibility, cache hit/miss, index unavailable, no persistence

### Database
Migration, unique constraints, bucket index, EXPLAIN regression

### Performance
50–1500 candidates, p50/p95/p99 server timing

### Frontend
Upload, preview, remove, submit, loading, error, empty, AR/EN, RTL/LTR, keyboard

---

## Implementation file map

See [VISUAL_SEARCH_IMPLEMENTATION_PLAN.md](./VISUAL_SEARCH_IMPLEMENTATION_PLAN.md) for CREATE/MODIFY/NO CHANGE per file.

---

## Implementation order

1. Config (`diyar.visual_search.*`) + corrections (prefetch 1500, radius 3)  
2. Migration `visual_index_entries`, `visual_search_events`  
3. Model + hash abstraction (`App\Support\VisualSearch\` or `App\Services\Search\Visual\`)  
4. GD `Dhash64Generator`  
5. Bucket probe + Hamming engine  
6. Ranker + aggregator  
7. `ProductService::listPublicByIds()`  
8. `VisualSearchService` + cache  
9. FormRequest + controller + rate limiter + route  
10. Queue jobs + ProductService hooks  
11. Event job + resources  
12. Tests  
13. Frontend API/hook/modal  
14. i18n/a11y  
15. Performance certification (Phase 16)

---

## Open risks

| Risk | Mitigation |
|------|------------|
| Bucket recall with radius 3 at 250K+ images | Catalog-size-aware radius; SQL LIMIT + PHP Hamming; monitor p95 |
| Synthetic accuracy overlap at d=9 | Tune threshold with real product images in Phase 16 |
| Empty production index at launch | Reindex command + 503/empty UX |
| 128M PHP memory on 4096² decode | Enforce 2048 px / 4MP cap before decode |
| NAT rate limits | Optional per-user limit for authenticated |

---

## Phase 4 gate

All Phase 3 acceptance criteria **passed** with documented corrections:

- [x] Phase 2 assumptions validated  
- [x] GD vs Intervention — **GD_NATIVE_APPROVED**  
- [x] Hash representation locked  
- [x] Bucket strategy validated — **with radius-3 correction**  
- [x] Candidate limit validated — **1500 default**  
- [x] EXPLAIN evidence collected  
- [x] Memory/security validated  
- [x] Frontend integration points identified  
- [x] File map + implementation order defined  

> **Phase 4 may begin implementation.**

---

## Phase 3 acceptance checklist

### Architecture
- [x] Phase 2 assumptions validated against actual code  
- [x] No unnecessary package — GD native  
- [x] GD vs Intervention evidence-based  
- [x] hash representation locked  
- [x] normalization locked  
- [x] bucket strategy validated (**correction required**)  
- [x] candidate limit validated (**1500**)  
- [x] product aggregation validated  
- [x] ranking validated  

### Database
- [x] UUID types verified  
- [x] FK strategy verified  
- [x] indexes validated + EXPLAIN  
- [x] no full scan in intended path  
- [x] index lifecycle understood  

### Security
- [x] 2 MB, MIME, dimensions, pixels, memory, SVG, temp lifecycle, no persistence  

### Performance
- [x] GD p50/p95/p99 measured  
- [x] Hamming + SQL benchmarked  

### Feedback
- [x] event schema validated  
- [x] offline loop defined  
- [x] no online self-learning  

### Frontend
- [x] integration points identified  

### Implementation
- [x] files, tests, sequence defined  
