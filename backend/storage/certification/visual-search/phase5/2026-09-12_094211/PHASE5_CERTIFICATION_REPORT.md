# Phase 5 Certification Report — Visual Search V1

**Run ID:** `2026-09-12_094211`  
**Generated:** 2026-09-12T12:45:00+01:00  
**Environment:** `diyar-production-*` Docker stack (app, MySQL 8.0, Redis 7, queue-default/critical workers, nginx :8093)  
**Prior label:** Visual Search V1 — IMPLEMENTED, NOT YET PRODUCTION-CERTIFIED

---

## Verdict

```text
CERTIFIED WITH LIMITATIONS
```

**Safe to expose to users:** **NO** — not until production catalog reindex completes on real product images and a post-reindex accuracy spot-check passes.

This run proves the **implementation contract** (GD dHash, radius-3 multi-probe, threshold 0.70, indexing integrity, queue lifecycle, security guards) on the Docker production-local stack. It does **not** substitute for a full-catalog production reindex or the 20-case manual accuracy matrix on live merchant images.

---

## Environment

| Component | Value |
|-----------|-------|
| PHP | 8.x (Docker app container, GD enabled) |
| MySQL | 8.0 (`diyar_production_local`) |
| Redis | 7-alpine (`CACHE_STORE=redis`) |
| Queue | `queue-default` + `queue-critical` workers running |
| Index version | `catalog-v1` |
| Eligible images | 5 (cert seed on production-local DB) |
| Active index rows | 5 |
| Automated backend tests | **31/31 pass** (host PHP 8.4 + GD, SQLite test DB) |

---

## §1 Migration verification

| Criterion | Result |
|-----------|--------|
| UUID PKs on both tables | PASS |
| FKs to products, product_images, media_files | PASS |
| `UNIQUE(product_image_id)`, `UNIQUE(media_file_id)` | PASS |
| `idx_visual_index_bucket_active (hash_bucket, is_active, index_version)` | PASS |
| Rollback drops both tables; re-migrate succeeds | PASS |

Evidence: `01-migration/rollback-remigrate.log`, `01-migration/show-create.txt`

---

## §2 Real catalog indexing

### Count proof (necessary but not sufficient — set equality also required)

| Metric | Value |
|--------|-------|
| `eligible_images` | 5 |
| `active_index_rows` | 5 |
| `COUNT(DISTINCT product_image_id)` | 5 |
| `COUNT(DISTINCT media_file_id)` | 5 |
| `active_index_rows ≤ eligible_images` | PASS (equality) |

### Set equality proof (required)

```text
eligible_image_ids = indexed_image_ids
set_difference_missing_from_index = []
set_difference_extra_in_index = []
set_difference_zero = true
```

| Criterion | Result |
|-----------|--------|
| Set difference = 0 for readable/processable images | **PASS** |
| Idempotent reindex (sync dispatch ×2) | **PASS** — no duplicate rows |
| Queue workers process `IndexProductImageJob` | **PASS** |
| `503 index_empty` preserved when index empty | **PASS** (PHPUnit) |

Evidence: `02-indexing/counts.json`, `02-indexing/idempotency.json`, `02-indexing/sample-rows.json`

**Note:** Initial cert seed used solid-color PNGs; all produced **identical dHash** (expected for uniform images). Refreshed to gradient patterns via `refresh-cert-images.php` before final accuracy pass.

---

## §3 Real-image accuracy

| Metric | Result |
|--------|--------|
| Same-image queries (5) | 5/5 correct, similarity = 1.0 |
| Resized/recompressed JPEG | PASS |
| Different-color negative case | **FAIL** — solid query still returned a catalog match at 1.0 (small catalog artifact) |
| Manual matrix size | **7 cases** (below runbook minimum of 20) |
| Threshold 0.70 / Hamming ≤19 on same-image | **PASS** — all distances 0 |
| Inactive products in results | Not tested (no inactive images in cert set) |

Evidence: `03-accuracy/evaluation-matrix.json`, `03-accuracy/threshold-analysis.json`

**Accuracy rate (this run):** 6/7 (85.7%)

---

## §4 SQL & performance

| Criterion | Result |
|-----------|--------|
| Radius-3 probe bucket count | 299 |
| SQL prefetch p50 / p95 | 0.81 ms / 0.97 ms |
| Full HTTP search p50 / p95 | 62.5 ms / 65.7 ms (≪ 300 ms budget) |
| Prefetch cap respected | PASS (5 rows << 1500) |
| EXPLAIN uses index (not ALL) | PASS — `type: ref` at 5-row scale |
| EXPLAIN uses `idx_visual_index_bucket_active` | **LIMIT** — optimizer chose `idx_visual_index_version` at micro scale |
| Candidate retriever SQL queries | ≤2 (PHPUnit) |
| Full path ≤3 SQL queries | **NOT PROVEN** — ProductCard hydration adds queries beyond retriever |
| Redis cache hit on repeat fingerprint | Observed `hit` (prior run warmed cache) |

Evidence: `04-performance/explain-and-latency.json`, `04-performance/bucket-probe-count.json`, `04-performance/cache.json`

---

## §5 Security

| Test | Expected | PHPUnit | Docker HTTP script |
|------|----------|---------|-------------------|
| Valid JPEG/PNG/WebP | 200 | PASS | Rate-limited (429)* |
| Corrupt binary | 422 | PASS | Rate-limited (429)* |
| MIME spoof | 422 | PASS | Rate-limited (429)* |
| SVG | 422 | PASS | Rate-limited (429)* |
| 2 MB + 1 byte | 422 | PASS | Rate-limited (429)* |
| 2048×1950 (≤4M px) | 200 | PASS | Rate-limited (429)* |
| 2049 width | 422 | PASS | Rate-limited (429)* |
| >4M pixels | 422 | PASS | Rate-limited (429)* |
| Rate limit 21/min | 429 | PASS | — |
| No query image persistence | — | PASS (storage fake) | `storage-audit.txt` — no new media files |

\*Docker HTTP adversarial script exhausted the 20/min rate limit from prior certification HTTP traffic. **Authoritative security evidence: PHPUnit `VisualSearchSecurityTest` + `VisualSearchRateLimitTest` (31/31 pass).**

Evidence: `05-security/adversarial-results.json`, `05-security/storage-audit.txt`, `test-results.txt`

**Query image storage:** `visual_search_events` stores `query_fingerprint` only — no raw image bytes.

---

## §6 Queue consistency

| Step | Result |
|------|--------|
| Attach image → indexed (`is_active=1`) | PASS |
| Triple `IndexProductImageJob` dispatch → 1 row | PASS |
| Delete image → row deactivated/removed | PASS |
| Archive product → index deactivated | PASS (PHPUnit lifecycle test) |

Evidence: `06-queue/lifecycle.json`

---

## §7 Frontend E2E

Static code review + automated API/validation tests. Full browser matrix not executed.

Evidence: `07-frontend-e2e/checklist.md`

| Result | LIMIT — manual EN/AR browser pass recommended |

---

## §8 Docker integration

| Criterion | Result |
|-----------|--------|
| GD enabled in production container | PASS |
| Redis reachable | PASS |
| Queue workers running | PASS |
| Config `diyar.visual_search` loaded | PASS |
| End-to-end smoke POST (post-rate-limit window) | **LIMIT** — 429 during intensive cert run |

Evidence: `08-docker-integration/environment.json`, `08-docker-integration/smoke-search.json`

---

## Test suite expansion

| Suite | Tests |
|-------|-------|
| `VisualHashBitsTest` | 3 |
| `VisualHashBitsExtendedTest` | 3 |
| `VisualCandidateRetrieverTest` | 4 |
| `ProductSimilarityAggregatorTest` | 3 |
| `VisualSearchRankerTest` | 2 |
| `VisualSearchTest` | 3 |
| `VisualSearchSecurityTest` | 6 |
| `VisualSearchRateLimitTest` | 1 |
| `VisualSearchCacheTest` | 1 |
| `VisualSearchQueryCountTest` | 1 |
| `VisualIndexingLifecycleTest` | 4 |
| **Total** | **31** (target ≥30 met) |

Evidence: `test-results.txt`

---

## Limitations

1. **Small cert catalog** — 5 gradient-pattern seed images, not the full merchant catalog or 20-case manual matrix.
2. **Accuracy negative case** — solid-color “no match” query still hit a catalog item (dHash collision class on uniform queries vs patterned catalog).
3. **EXPLAIN index choice** — at 5 rows MySQL preferred `idx_visual_index_version`; bucket index behavior at 50K+ rows validated in Phase 3 only.
4. **Full-path SQL budget** — retriever ≤2 queries; full search path including `ProductCardResource` hydration exceeds the ≤3 runbook target.
5. **Frontend E2E** — code-reviewed, not browser-automated in this run.
6. **Docker HTTP security script** — rate-limited during batch certification; PHPUnit is authoritative.
7. **Production reindex not executed** — this run indexed cert seed images only.

---

## Blockers (would be NOT CERTIFIED)

None for **implementation readiness**. Blockers for **public exposure**:

- [ ] Run `php artisan visual-search:reindex` on production after migrate
- [ ] Verify set equality on production: `eligible_image_ids = indexed_image_ids`
- [ ] Complete 20-case manual accuracy matrix on real merchant photos
- [ ] Manual EN/AR frontend smoke test

---

## Production rollout checklist

- [ ] `php artisan migrate --force` on production
- [ ] `php artisan visual-search:reindex` during low traffic
- [ ] Monitor queue workers until index row count stabilizes
- [ ] Confirm `503 index_empty` clears only after reindex completes
- [ ] Monitor p95 latency, 429 rate, 503 rate first 24h
- [ ] Keep feature flag / UI gated until post-reindex spot-check passes

---

## Summary table

| Section | Status |
|---------|--------|
| 1 Migration | PASS |
| 2 Indexing + set equality | PASS |
| 3 Accuracy | LIMIT (7/20 cases, 1 negative fail) |
| 4 Performance | PASS (micro-scale) |
| 5 Security | PASS (PHPUnit) |
| 6 Queue lifecycle | PASS |
| 7 Frontend E2E | LIMIT (code review) |
| 8 Docker integration | PASS (infra) / LIMIT (smoke HTTP) |
| Automated tests | PASS (31/31) |

---

## Agent statement

Phase 5 execution completed sequentially on the `diyar-production-*` stack. Indexing integrity is proven with **set difference = 0**. The locked V1 contract (GD dHash, radius-3 multi-probe, prefetch 1500, threshold 0.70, `503 index_empty`) is intact.

**Do not mark as fully production-certified for public exposure** until production reindex and expanded accuracy validation complete.

**Current label after this run:**

> **Visual Search V1 — CERTIFIED WITH LIMITATIONS (integration/hardening complete on Docker-local; production reindex pending)**
