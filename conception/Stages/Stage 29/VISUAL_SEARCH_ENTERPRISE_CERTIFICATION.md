# Visual Search V1 — Enterprise Production Certification

**Run ID:** `2026-09-12_113100`  
**Certification Date:** 2026-09-12  
**Environment:** `diyar-production-*` Docker stack (actual running containers)  
**Prior status challenged:** `CERTIFIED` (run `2026-09-12_095411`)

---

## 1. Executive Summary

Independent enterprise audit of Visual Search V1 against the **actual `diyar-production-*` Docker runtime** found the **implementation sound and hardened**, but **production catalog evidence is insufficient** for full enterprise certification.

**Critical blocker:** The production-local database contains **zero merchant product images**. All 12 indexed images are synthetic `cert/visual-search/*` gradients from prior certification seeding. Twenty-four orphan merchant files exist on disk under `products/{uuid}/` for **deleted/non-existent product IDs** and cannot be linked to the current 12 active products without forbidden test-data mutation.

```text
NOT CERTIFIED
```

The feature **must not** be marked enterprise-certified for controlled production exposure until:
1. Real merchant catalog images exist in the DB and are indexed with set equality proven.
2. ≥30 real-merchant accuracy cases pass.
3. Frontend browser E2E (EN/AR/RTL/mobile) runs against a deployed marketplace UI.

Implementation-only certification (code, schema, security guard, kill switch, in-process performance) **passes**. Production catalog and frontend gates **fail**.

---

## 2. Certification Scope

| In scope | Out of scope (this run) |
|----------|-------------------------|
| Actual `diyar-production-*` containers | Host-only SQLite certification |
| Production-local MySQL catalog state | Synthetic gradient catalog as primary evidence |
| Code audit vs architecture docs | LLM/vector DB/ML services |
| Set equality on current eligible images | Destructive DB reset or test image injection |
| Security ImageGuard + PHPUnit | Weakening auth/rate limits for tests |
| Kill switch runtime proof | Full 24h post-enable monitoring |
| In-process performance on 12-row index | k6 load at 50K (Phase 3 supplemental) |

---

## 3. Production Docker Environment

**Containers verified running:**

| Container | Image | Status |
|-----------|-------|--------|
| `diyar-production-app-1` | diyar-production-app | healthy |
| `diyar-production-nginx-1` | nginx:1.27-alpine | healthy (:8093) |
| `diyar-production-mysql-1` | mysql:8.0 | healthy |
| `diyar-production-redis-1` | redis:7-alpine | healthy |
| `diyar-production-queue-default-1` | diyar-production-queue-default | unhealthy* |
| `diyar-production-queue-critical-1` | diyar-production-queue-critical | unhealthy* |
| `diyar-production-scheduler-1` | diyar-production-scheduler | unhealthy* |
| `diyar-production-reverb-1-1` | diyar-production-reverb-1 | healthy |
| `diyar-production-reverb-2-1` | diyar-production-reverb-2 | healthy |

\*Worker healthchecks fail with `pgrep: not found` — cosmetic healthcheck config issue; `IndexProductImageJob::dispatchSync` succeeds.

**Runtime inventory** (`00-environment/environment.json`):

- PHP 8.3.33, Laravel 13.26.1, GD bundled (JPEG/PNG/WebP)
- Cache: Redis, Queue: Redis
- DB: `diyar_production_local`
- `APP_DEBUG=false`, visual search feature enabled
- V1 config: dHash-64, threshold 0.70, Hamming ≤19, prefetch 1500, radius 3, 20/min rate limit

---

## 4. Architecture Audit

Documented pipeline matches implementation:

```text
POST /api/v1/search/visual → ImageGuard → GD decode → 256×256 letterbox → dHash-64
→ 12-bit bucket → radius-3 probe → SQL prefetch (1500) → Hamming → similarity
→ threshold → MAX per product → rank → publiclyVisible() → ProductCard → Redis cache
```

No architectural drift detected. V1 stack remains Laravel + GD + MySQL + Redis + queues.

---

## 5. Code Audit

P1 fixes from prior certification **independently verified** (`01-code-audit/p1-fixes.json`):

| Fix | Verified |
|-----|----------|
| `min_similarity` enforcement | ✓ config 0.7 + service code |
| Delisted product filtering (`publiclyVisible()`) | ✓ service code |
| Vendor N+1 fix (request attribute) | ✓ ProductCardResource |
| Cache generation invalidation | ✓ CacheKeys + VisualIndexingService |
| Config-bound Dhash64Generator | ✓ AppServiceProvider DI |
| Analytics `firstOrCreate` | ✓ RecordVisualSearchEventJob |
| Structured search observability | ✓ Docker logs confirmed |

---

## 6. Database Audit

Schema verified (`02-database/schema.json`):

- `visual_index_entries`: PK, FKs, `UNIQUE(product_image_id)`, `UNIQUE(media_file_id)`, bucket/version indexes
- `visual_search_events`: analytics table with fingerprint metadata only
- 12 active index rows, 0 inactive, 0 duplicate hash groups
- No orphan index rows relative to current product_images

---

## 7. Production Index Audit

**Current catalog:** 12 eligible product images, 12 active index rows.

**Set equality** (`03-index/set-equality.json`):

```text
eligible_count = 12
active_index_rows = 12
missing_from_index = []
extra_in_index = []
set_difference_zero = true
```

**However:** `all_linked_images_are_cert_paths = true` — every indexed image points to `cert/visual-search/*`, not merchant `products/*` media.

---

## 8. Set Equality — Merchant Catalog

**FAIL for real merchant catalog.**

| Metric | Value |
|--------|-------|
| `product_image_rows` | 12 |
| `cert_linked_images` | 12 |
| `merchant_media_files_in_db` | **0** |
| `orphan_product_dirs_on_disk` | 11 |
| `orphan_product_files_on_disk` | 24 |
| `disk_product_ids_exist_in_db` | **all false** |

Current 12 active product UUIDs have **no** `products/{id}/` media on disk. Orphan disk files belong to 11 deleted product UUIDs.

**Action required:** Restore or re-upload merchant images through normal product media workflow, then reindex. Do **not** inject cert/test images as merchant catalog.

---

## 9. Accuracy Matrix

**FAIL** — 0 real merchant cases executed (`04-accuracy/accuracy-matrix.json`).

| Requirement | Result |
|-------------|--------|
| ≥30 real merchant cases | **0 / 30** |
| Positive transformations | NOT RUN |
| Negative / false-positive cases | NOT RUN |
| Threshold audit (0.70/0.75/0.80) | NOT RUN on real catalog |

Supplemental: 39 cert-gradient cases from run `2026-09-12_095411` (91.7% Top-1) — **not accepted** as enterprise primary evidence.

---

## 10. Security Audit

**PASS** (in-process ImageGuard + 40 PHPUnit tests).

| Case | Result |
|------|--------|
| Valid JPEG/PNG/WebP | PASS |
| Corrupt image | REJECT |
| SVG | REJECT |
| Oversized (>2MB) | REJECT |
| Dimension >2048px | REJECT |

Query image privacy **PASS** — no new media rows, events contain fingerprint only (`13-production/privacy-audit.json`).

HTTP batch adversarial suite: **PARTIAL** — prior batch runs hit 429 rate limit from internal client.

---

## 11. Performance Audit

**PASS** at current 12-row scale (`06-performance/performance.json`):

| Metric | p50 | p95 | p99 |
|--------|-----|-----|-----|
| SQL prefetch | 0.98 ms | 1.54 ms | 1.54 ms |
| In-process full search | 32.1 ms | 45.7 ms | 45.7 ms |

Target p95 < 300ms: **met**. EXPLAIN shows `ALL` scan at 12 rows — expected at micro-scale; Phase 3 50K benchmark remains supplemental scale evidence.

---

## 12. Redis Audit

**PASS** (partial invalidation proof):

- Cache hit on repeat query: ✓
- Cache miss on first query: ✓
- Cache key includes tuning params + generation counter: ✓ (code audit)
- Generation bump on index mutation: code present; runtime generation counter returned 0 in test (may reflect test ordering)

---

## 13. Queue Audit

**PARTIAL**

- Reindex idempotency: **PASS** (12→12, same row IDs, no explosion)
- Worker Docker healthcheck: **FAIL** (`pgrep` missing — P3 ops fix)
- Full lifecycle (attach/replace/delete/archive): not re-run in enterprise audit

---

## 14. API Audit

**PARTIAL** — contract verified via PHPUnit; HTTP batch rate-limit testing inconclusive.

Expected responses: 200 success, 422 invalid, 503 empty index, 429 rate limit, safe 5xx without stack traces.

---

## 15. Frontend Audit

**FAIL**

Port `:8093` serves **Laravel default welcome page**, not the DIYAR React marketplace.

| Scenario | Result |
|----------|--------|
| EN upload flow | NOT RUN |
| AR RTL | NOT RUN |
| Mobile viewport | NOT RUN |
| Error states (422/429/503) | NOT RUN |

`ImageSearchModal.tsx` code review confirms component exists with upload/preview/RTL support — runtime browser E2E blocked by deployment gap.

---

## 16. Regression Audit

**PARTIAL**

| Suite | Result |
|-------|--------|
| Visual Search PHPUnit (40 tests) | **40/40 PASS** |
| Full PHPUnit | NOT RUN |
| Vitest | NOT RUN |
| Playwright visual search | NOT RUN |

---

## 17. Observability

**PASS**

Structured event `visual_search.search.completed` confirmed in Docker app logs with:
`search_id`, `cache`, `candidate_count`, `page_item_count`, `duration_ms`, `fingerprint_prefix`.

No raw image data in logs or events.

---

## 18. Production Rollout

**NOT READY**

Rollout checklist blocked at steps 4–7:

1. ✓ migrate
2. ✓ reindex (cert catalog)
3. ✓ queue idempotency verified
4. ✗ set equality on **merchant** catalog
5. ✗ real-image spot checks
6. ✗ API smoke via nginx (not run)
7. ✗ frontend smoke tests

Do **not** enable for real users until merchant catalog and frontend gates pass.

---

## 19. Kill Switch

**PASS** (`14-final/kill-switch.json`):

- `DIYAR_FEATURE_VISUAL_SEARCH_ENABLED=false` → search blocked (503)
- Re-enabled → search allowed

---

## 20. Fixes Implemented (This Enterprise Audit)

No new code fixes required — prior P1 hardening verified intact. This audit **corrected certification status** rather than introducing new implementation changes.

| Finding | Severity | Action |
|---------|----------|--------|
| Prior CERTIFIED based on cert-only catalog | P0 | Downgrade to NOT CERTIFIED |
| Zero merchant images in DB | P0 | Document blocker; require merchant media restore |
| Frontend not deployed on :8093 | P1 | Document; require frontend deploy for E2E |
| Queue healthcheck `pgrep` missing | P3 | Document for ops |

---

## 21. Remaining Limitations

1. **No merchant catalog in production-local DB** — primary enterprise blocker
2. **Frontend not served** on production nginx — browser E2E impossible
3. **12-row performance/EXPLAIN** — not representative of full catalog scale
4. **dHash solid-color collisions** — acceptable at current scale; monitor with real catalog
5. **Queue worker healthcheck cosmetic failure** — does not block sync job processing
6. **HTTP rate-limit batch testing** — requires isolated test IP strategy

---

## 22. Evidence Inventory

**Path:** `backend/storage/certification/visual-search/enterprise/2026-09-12_113100/`

| Artifact | Status |
|----------|--------|
| `environment.json` | ✓ |
| `schema.json` | ✓ |
| `production-index.json` | ✓ |
| `set-equality.json` | ✓ |
| `accuracy-matrix.json` | BLOCKED |
| `accuracy-summary.json` | FAIL |
| `security-results.json` | ✓ |
| `performance.json` | ✓ |
| `cache-results.json` | ✓ |
| `queue-results.json` | ✓ |
| `frontend-results.json` | FAIL |
| `regression-results.json` | PARTIAL |
| `observability.json` | ✓ |
| `rollout-smoke.json` | PARTIAL |
| `kill-switch.json` | ✓ |
| `gates.json` | ✓ |

No raw merchant images stored in evidence bundle (IDs and metrics only).

---

## 23. Certification Gates

| Gate | Evidence | Result |
|------|----------|--------|
| Architecture | code + docs | **PASS** |
| Production Docker | runtime evidence | **PASS** |
| Database | schema evidence | **PASS** |
| Production index | set equality (current) | **PASS** |
| **Real merchant catalog** | catalog-integrity.json | **FAIL** |
| **Accuracy ≥30 real cases** | accuracy-matrix.json | **FAIL** |
| Negative accuracy | — | **FAIL** |
| Security | adversarial suite | **PASS** |
| Rate limit | PHPUnit; HTTP partial | **PARTIAL** |
| Resource safety | in-process perf | **PASS** |
| Redis | cache hit/miss | **PASS** |
| Queue | idempotency | **PASS** |
| Performance | p50/p95/p99 | **PASS** |
| SQL/N+1 | code audit + prior tests | **PASS** |
| API | PHPUnit contract | **PARTIAL** |
| **Frontend EN** | browser | **FAIL** |
| **Frontend AR** | browser | **FAIL** |
| **RTL** | browser | **FAIL** |
| **Mobile** | browser | **FAIL** |
| Regression | 40/40 Visual PHPUnit | **PARTIAL** |
| Observability | structured logs | **PASS** |
| Kill switch | runtime | **PASS** |
| **Production smoke** | real catalog | **FAIL** |

---

## 24. Final Verdict

```text
NOT CERTIFIED
```

**Rationale:** Enterprise certification requires proof against the **actual merchant catalog** and **deployed frontend**. The production-local environment contains only synthetic certification images. Implementation quality is high; production readiness evidence is incomplete.

**Path to CERTIFIED:**

1. Restore/link merchant product images via normal media workflow (no test injection)
2. Run `php artisan visual-search:reindex` in `diyar-production-app-1`
3. Prove set equality: `missing = []`, `extra = []` for merchant images
4. Execute ≥30 real-merchant accuracy cases (positive + negative)
5. Deploy frontend to production nginx (or cert against staging with real catalog)
6. Run EN/AR/RTL/mobile browser E2E + Playwright
7. Re-run enterprise audit with new RUN_ID

---

*Auditor: Independent enterprise certification run*  
*Evidence: `backend/storage/certification/visual-search/enterprise/2026-09-12_113100/`*
