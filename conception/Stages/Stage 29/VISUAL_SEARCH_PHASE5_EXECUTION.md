# Visual Search V1 — Phase 5 Execution Prompt

**Stage:** 29 — Enterprise Visual Search  
**Date:** 2026-09-12  
**Status:** **IMPLEMENTED — NOT YET PRODUCTION-CERTIFIED**  
**Prerequisite:** Phase 4 complete ([VISUAL_SEARCH_BENCHMARK.md](./VISUAL_SEARCH_BENCHMARK.md), implementation in repo)  
**Purpose:** Integration, hardening, and production certification — **actions and evidence only**

---

## Current label

> **Visual Search V1 — IMPLEMENTED, NOT YET PRODUCTION-CERTIFIED**

Phase 4 preserved the locked V1 contract. Phase 5 proves it under real infrastructure, real catalog data, and adversarial conditions. **Do not rewrite architecture.** **Do not remove `503 index_empty`.** **Do not simplify bucket retrieval to single-bucket + 500 rows.**

---

## Certification gate

Execute in order. Record evidence paths. End with exactly one verdict:

```text
CERTIFIED
```

or

```text
CERTIFIED WITH LIMITATIONS
```

or

```text
NOT CERTIFIED
```

```text
PHASE 4 IMPLEMENTED
        ↓
PHASE 5 INTEGRATION + HARDENING  ← this document
        ↓
REAL CATALOG REINDEX (Docker production stack)
        ↓
SECURITY + PERFORMANCE + E2E
        ↓
CERTIFIED | CERTIFIED WITH LIMITATIONS | NOT CERTIFIED
```

---

## Hard rules (Phase 5)

### Do

* Run all validation inside **`diyar-production-*` Docker stack** (app, MySQL, Redis, queue workers)
* Collect command output, SQL EXPLAIN, timing JSON, test reports, screenshots where useful
* Expand test coverage beyond the initial 6/6 proof
* Keep `503 index_empty` until index is populated
* Keep Hamming-radius-3 multi-probe + `sql_prefetch_cap=1500`

### Do not

* Change locked V1 API contract without measured failure evidence
* Remove fail-safe behaviors to “make tests pass”
* Certify on host PHP without GD if production uses Docker GD
* Certify on empty/synthetic index only
* Store query images in logs, storage, or events

---

## Evidence output layout

Write artifacts under:

```text
backend/storage/certification/visual-search/phase5/{YYYY-MM-DD_HHMMSS}/
├── 01-migration/
├── 02-indexing/
├── 03-accuracy/
├── 04-performance/
├── 05-security/
├── 06-queue/
├── 07-frontend-e2e/
├── 08-docker-integration/
└── PHASE5_CERTIFICATION_REPORT.md
```

Each section below lists **actions → expected evidence → pass criteria**.

---

## 1. Migration verification

### Actions

```bash
# Inside diyar-production-app container
cd /var/www/diyar/backend
php artisan migrate:fresh --force   # isolated cert DB only — NOT production data
php artisan migrate:rollback --step=2
php artisan migrate --force
```

```sql
-- Verify schema
SHOW CREATE TABLE visual_index_entries\G
SHOW CREATE TABLE visual_search_events\G
SHOW INDEX FROM visual_index_entries;
```

### Evidence to capture

| File | Content |
|------|---------|
| `01-migration/migrate-fresh.log` | Exit code 0 |
| `01-migration/rollback-remigrate.log` | Exit code 0 |
| `01-migration/show-create.txt` | Both tables |
| `01-migration/index-inventory.txt` | `idx_visual_index_bucket_active`, uniques |

### Pass criteria

- [ ] UUID PKs on both tables
- [ ] FKs: `products`, `product_images`, `media_files` with cascade/null per Phase 4 migration
- [ ] `UNIQUE(product_image_id)`, `UNIQUE(media_file_id)`
- [ ] `idx_visual_index_bucket_active (hash_bucket, is_active, index_version)`
- [ ] Rollback drops both tables cleanly; re-migrate succeeds

---

## 2. Real catalog indexing (Docker)

### Actions

```bash
# Production-local stack (existing env)
docker exec diyar-production-app-1 php artisan migrate --force
docker exec diyar-production-app-1 php artisan visual-search:reindex
# Ensure queue worker running:
docker exec diyar-production-worker-1 php artisan queue:work --once   # or verify supervisor
```

```sql
SELECT COUNT(*) AS eligible_images
FROM product_images pi
JOIN products p ON p.id = pi.product_id AND p.deleted_at IS NULL AND p.status = 'active'
JOIN vendor_accounts va ON va.id = p.vendor_account_id AND va.status = 'active'
JOIN media_files mf ON mf.id = pi.media_file_id;

SELECT COUNT(*) AS active_index_rows
FROM visual_index_entries
WHERE is_active = 1
  AND index_version = '<current config value>';

SELECT COUNT(*) AS inactive_rows FROM visual_index_entries WHERE is_active = 0;
```

Re-run reindex twice; compare row counts and `updated_at` distribution.

### Evidence

| File | Content |
|------|---------|
| `02-indexing/reindex-dispatch.log` | Job count dispatched |
| `02-indexing/counts.json` | eligible vs indexed vs inactive |
| `02-indexing/idempotency.json` | counts before/after 2nd reindex |
| `02-indexing/sample-rows.json` | 5 random active rows (no raw image bytes) |

### Pass criteria

- [ ] `active_index_rows ≤ eligible_images` (equality when all media readable)
- [ ] No duplicate `product_image_id` or `media_file_id`
- [ ] Archived/deleted product images → `is_active = 0` or row removed
- [ ] Second full reindex does not duplicate rows
- [ ] Until index populated, API returns **503 `index_empty`** — **keep this behavior**

---

## 3. Real-image accuracy (DIYAR catalog)

### Actions

Build a **manual evaluation set** (minimum 20 query cases) from real product images in the environment:

| Case type | Min count |
|-----------|----------|
| Same product, different photo angle | 3 |
| Same image resized/recompressed | 3 |
| Visually similar, different product | 3 |
| Different category product | 3 |
| No reasonable match | 3 |
| Multi-image product (max score wins) | 2 |
| Inactive product image (must not appear) | 3 |

For each query:

1. POST `/api/v1/search/visual` with query image
2. Record top-5: `product_id`, `similarity`, rank
3. Mark expected: `match | no_match | ambiguous`

Compute on evaluation set:

- Precision@5, Recall@5 (manual labels)
- Distance distribution at threshold 0.70 (Hamming ≤19)
- False positive rate on `no_match` cases

### Evidence

| File | Content |
|------|---------|
| `03-accuracy/evaluation-matrix.csv` | query_id, expected, top1_id, similarity, correct Y/N |
| `03-accuracy/threshold-analysis.json` | distance histogram, FP/FN at 0.70 |
| `03-accuracy/multi-image-aggregation.json` | max-score examples |

### Pass criteria

- [ ] Threshold 0.70 validated against **real** catalog (not synthetic-only)
- [ ] No inactive/archived products in top results
- [ ] Multi-image products use **max similarity** correctly
- [ ] Document any FP/FN that require threshold tuning → `CERTIFIED WITH LIMITATIONS` only if bounded and documented

---

## 4. SQL & performance

### Actions

```sql
EXPLAIN
SELECT id, product_id, product_image_id, hash_bits
FROM visual_index_entries
WHERE is_active = 1
  AND index_version = ?
  AND hash_bucket IN (/* radius-3 probe set, ~299 buckets max */)
LIMIT 1500;
```

Benchmark inside Docker app container:

- GD decode+hash p50/p95/p99 (20 real product images)
- Full search path p50/p95/p99 (10 queries)
- Hamming over 1500 candidates (timed)
- 10 concurrent POST searches (same/different fingerprints)
- Cache: same image twice → 2nd request `meta.cache = hit`; bump `index_version` → miss

Enable query log for one request; assert **≤ 3 SQL queries** on cache miss (index prefetch + product fetch + optional session).

### Evidence

| File | Content |
|------|---------|
| `04-performance/explain.json` | index used, rows examined, no full scan |
| `04-performance/bucket-probe-count.json` | buckets probed, rows returned per query |
| `04-performance/latency.json` | p50/p95/p99 server phases |
| `04-performance/concurrency.json` | 10 parallel requests |
| `04-performance/cache.json` | hit/miss/version invalidation |
| `04-performance/query-count.json` | assert ≤3 |

### Pass criteria

- [ ] Uses `idx_visual_index_bucket_active`; not `type: ALL` at catalog scale
- [ ] Prefetch returns ≤1500 rows
- [ ] Server p95 within Phase 2 budget (~300 ms) for typical images on Docker hardware
- [ ] Hamming 1500 ≪ decode time
- [ ] Query count bounded; no N+1 on product cards

---

## 5. Security

### Actions

| Test | Input | Expected |
|------|-------|----------|
| Valid JPEG/PNG/WebP | real small image | 200 |
| Corrupt binary | random bytes as .jpg | 422 |
| MIME spoof | PHP/HTML with image extension | 422 |
| SVG | `.svg` | 422 |
| 2 MB + 1 byte | oversized | 422 |
| 2048×2048 OK | within limits | 200 or 503 if index empty |
| 2049×2048 | dimension cap | 422 |
| >4M pixels | e.g. 3000×2000 if over cap | 422 |
| Decompression bomb | if feasible in isolated env | 422/503, no OOM kill |
| Rate limit | 21 requests/min same IP | 429 on 21st |
| Storage audit | after 10 searches | no new files in media disk; no query bytes in `visual_search_events` |
| Log audit | grep app logs | no base64 image payloads |

### Evidence

| File | Content |
|------|---------|
| `05-security/adversarial-results.json` | each case: status, message key |
| `05-security/storage-audit.txt` | file count before/after |
| `05-security/log-grep.txt` | no raw image content |

### Pass criteria

- [ ] All adversarial cases behave as expected
- [ ] Temp upload files cleaned up
- [ ] **No persistent query image storage**
- [ ] Rate limiter enforced at 20/min

---

## 6. Queue consistency

### Actions

Using a test vendor product in staging/local Docker:

1. **Attach image** → wait for job → assert new `visual_index_entries` row, `is_active=1`
2. **Attach second image** → two rows, same `product_id`
3. **Delete one image** → corresponding row inactive/removed
4. **Archive product** → all rows inactive
5. **Dispatch same `IndexProductImageJob` 3×** → still one row per `product_image_id`

### Evidence

| File | Content |
|------|---------|
| `06-queue/lifecycle.json` | step-by-step DB snapshots (counts + ids) |
| `06-queue/idempotency.json` | triple dispatch result |

### Pass criteria

- [ ] attach → indexed
- [ ] delete/archive → deactivated
- [ ] repeated jobs → no duplicates
- [ ] jobs retry-safe (failed hash → logged, no corrupt row)

---

## 7. Frontend E2E

### Actions

Manual or automated (Playwright/Cypress if available) against frontend + Docker API:

| Flow | Verify |
|------|--------|
| Open image search modal | camera UI, focus trap |
| Upload valid image | preview object URL renders |
| Remove / reselect | preview cleared, no leak |
| Submit success | navigates to visual results, similarity badges |
| Empty results | empty state copy |
| 422 | inline error (AR + EN) |
| 429 | error toast/message |
| 503 (empty index) | graceful unavailable message |
| RTL (Arabic) | layout, labels |
| LTR (English) | layout, labels |
| Keyboard | Esc closes modal; tab order reachable |

### Evidence

| File | Content |
|------|---------|
| `07-frontend-e2e/checklist.md` | pass/fail per flow |
| `07-frontend-e2e/screenshots/` | optional AR/EN/RTL |

### Pass criteria

- [ ] All flows pass in both locales
- [ ] FormData upload works through axios client
- [ ] Object URLs revoked on remove (not on successful submit handoff)

---

## 8. Production Docker integration

### Actions

Verify in **`diyar-production-*`** containers:

```bash
docker exec diyar-production-app-1 php -r "echo extension_loaded('gd')?'GD yes':'GD no';"
docker exec diyar-production-app-1 php artisan config:show diyar.visual_search
docker exec diyar-production-redis-1 redis-cli ping
docker exec diyar-production-app-1 php artisan queue:monitor   # or inspect worker logs
```

Confirm:

- App uses Redis cache (`CACHE_STORE=redis`)
- Queue worker processes `IndexProductImageJob`, `RecordVisualSearchEventJob`
- MySQL 8.x matches EXPLAIN from Phase 3
- Endpoint reachable: `POST http://<host>:8093/api/v1/search/visual`

### Evidence

| File | Content |
|------|---------|
| `08-docker-integration/environment.txt` | PHP, GD, MySQL, Redis, queue driver |
| `08-docker-integration/config-dump.json` | visual_search keys (no secrets) |
| `08-docker-integration/smoke-search.json` | one successful search after reindex |

### Pass criteria

- [ ] GD enabled in production container (not host)
- [ ] Full path works: reindex → search → ProductCard results
- [ ] Workers + Redis + MySQL integrated

---

## Test suite expansion (required before certification)

Initial proof: **6 tests**. Phase 5 minimum additional coverage:

### Backend — add

| Suite | Cases |
|-------|-------|
| `VisualCandidateRetrieverTest` | radius-3 probe size, prefetch cap, threshold filter |
| `VisualSearchQueryCountTest` | ≤3 queries on miss |
| `VisualSearchSecurityTest` | MIME, dimensions, pixels, SVG |
| `VisualSearchRateLimitTest` | 429 at limit |
| `VisualIndexingLifecycleTest` | attach/delete/archive via jobs |
| `VisualSearchCacheTest` | hit, version miss |

### Target

**≥ 30 automated backend tests** touching the full pipeline, plus manual accuracy matrix.

Record:

```text
backend/storage/certification/visual-search/phase5/{run}/test-results.txt
```

---

## Final report template

Create `PHASE5_CERTIFICATION_REPORT.md`:

```markdown
# Phase 5 Certification Report

## Verdict
[CERTIFIED | CERTIFIED WITH LIMITATIONS | NOT CERTIFIED]

## Environment
- Docker image / PHP / GD / MySQL / Redis
- Index version, row counts
- Test counts (automated + manual)

## Summary tables
(migration, indexing, accuracy, performance, security, queue, frontend, docker)

## Limitations (if any)
## Blockers (if NOT CERTIFIED)
## Production rollout checklist
- [ ] migrate production
- [ ] reindex during low traffic
- [ ] monitor p95 / 429 / 503 rate first 24h
- [ ] keep index_empty until reindex completes
```

---

## Agent execution instructions

When running Phase 5:

1. **Start** by creating the timestamped evidence directory.
2. **Use Docker production stack** for all runtime commands.
3. **Run real reindex** before accuracy/performance/search tests.
4. **Expand tests** — do not rely on 6/6 alone.
5. **Record failures honestly** — prefer `CERTIFIED WITH LIMITATIONS` over silent threshold changes.
6. **Do not** remove `503 index_empty` or weaken bucket retrieval.
7. **End** with verdict + explicit “safe to expose to users: yes/no”.

---

## Reference (locked V1 contract)

```text
query image
    ↓
GD normalization (256×256 letterbox grayscale)
    ↓
dHash-64 (BINARY(8) big-endian)
    ↓
12-bit prefix
    ↓
Hamming-radius-3 multi-probe
    ↓
MySQL indexed lookup (≤1500 rows)
    ↓
exact 64-bit Hamming
    ↓
similarity ≥ 0.70 (Hamming ≤19)
    ↓
MAX similarity per product
    ↓
ranked product IDs
    ↓
ProductService::listPublicByIds()
    ↓
ProductCard + similarity
```

**No Intervention. No vector DB. No LLM. No query image persistence.**

---

## Related documents

| Doc | Role |
|-----|------|
| [VISUAL_SEARCH_AUDIT.md](./VISUAL_SEARCH_AUDIT.md) | Phase 1 |
| [VISUAL_SEARCH_ARCHITECTURE.md](./VISUAL_SEARCH_ARCHITECTURE.md) | Phase 2 (locked) |
| [VISUAL_SEARCH_BENCHMARK.md](./VISUAL_SEARCH_BENCHMARK.md) | Phase 3 (approved) |
| [VISUAL_SEARCH_IMPLEMENTATION_PLAN.md](./VISUAL_SEARCH_IMPLEMENTATION_PLAN.md) | Phase 4 plan |
| **This document** | Phase 5 execution prompt |
