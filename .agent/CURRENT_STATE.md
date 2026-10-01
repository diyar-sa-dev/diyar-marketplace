# CURRENT_STATE.md

> **Last updated:** 2026-09-30
> **Maintained by:** AI development agents after each phase completion

---

## Project

**DIYAR Marketplace** — Arabic RTL multi-vendor commerce + services + affiliate + admin operations — Saudi Arabia · SAR · 15% VAT

---

## Stage Status

| Stage | Status |
|-------|--------|
| Stages 0–19 | **COMPLETE** |
| Stage 20 — Security | **PARTIAL** (PS30-2 room-design slice done) |
| Stage 21 — E2E | **PARTIAL** (PS30-1; Playwright NOT VERIFIED locally) |
| Stage 22 — Performance | **PARTIAL** (PS30-3 save-path evidence; 25K **NOT VERIFIED**) |
| Stage 23 — Staging | **PARTIAL** (PS30-4 smoke + checklist; remote staging **NOT VERIFIED**) |
| Stage 24 — Production | **DOCS + CONFIG** (PS30-5 assessment; **NOT DEPLOYED**) |
| Stage 29 — Visual Search V1 | **CERTIFIED** |
| **Stage 30 — Room Designer** | **COMPLETE (30.1–30.18)** |
| **Post–Stage 30 program (PS30-1…5)** | **COMPLETE** — VERIFIED WITH LIMITATIONS |

---

## Post–Stage 30 enterprise program

Authority: `conception/Stages/Post-Stage 30/ENTERPRISE_PROGRAM_ROADMAP.md`  
Final report: `conception/Stages/Post-Stage 30/POST_STAGE_30_ENTERPRISE_FINAL_REPORT.md`

```text
PS30-1  Stage 21 E2E bridge              CLOSED
PS30-2  Stage 20 security slice          CLOSED
PS30-3  Stage 22 save-path performance   CLOSED
PS30-4  Stage 23 staging readiness       CLOSED
PS30-5  Stage 24 production assessment   CLOSED
```

---

## Stage 30 — Room Designer

**CLOSED** — `conception/Stages/Stage 30/STAGE_30_PROGRAM_FINAL_CERTIFICATION.md`

Privacy: legal **PENDING** → external AI **BLOCKED**

---

## Latest regression (2026-09-20)

| Check | Result |
|-------|--------|
| Vitest room-designer | **131/131** |
| PHPUnit RoomDesign | **33/33** |
| PHPUnit TryInRoom + Visualization | **46/46** |
| `npm run build` | **PASS** |

### PS30-3 highlights

- `RoomDesignSavePerformanceTest` — PUT query budget ≤ 12 (sqlite); batch product validation
- Removed redundant `fresh()` after save in `RoomDesignDocumentService`
- k6 hook: `scripts/performance/room-design-save-smoke.js` (**NOT RUN**)

### PS30-4 highlights

- `scripts/staging/smoke.sh` — room-designs 401/403 gate
- `PS30-4/STAGING_ROOM_DESIGNER_CHECKLIST.md`

---

## Operational Enterprise Release Mode (OP-1…11)

Authority: `conception/Stages/Post-Stage 30/OPERATIONAL_RELEASE_READINESS.md`

| Gate | Status (2026-09-20) |
|------|---------------------|
| OP-1 Playwright (full) | **VERIFIED WITH LIMITATIONS** — w1: 93 pass / 0 fail / 1 skip; w2: 86/5 flaky; CI not run |
| OP-1 room-designer spec | **VERIFIED WITH LIMITATIONS** — 6 pass / 1 skip (serial) |
| OP-2 k6 save smoke | **NOT EXECUTED** — Docker Desktop offline; no host k6 |
| OP-3 staging | **NOT VERIFIED** |
| OP-4 25K | **NOT VERIFIED** |
| OP-5–7 devices/3D/AR | **NOT VERIFIED** |
| OP-8 legal AI | **BLOCKED** |
| OP-9 observability | **VERIFIED WITH LIMITATIONS** (code review) |
| OP-10 backup/restore | **NOT VERIFIED** |
| OP-11 release/rollback | **VERIFIED WITH LIMITATIONS** (docs) |

## Known limitations (explicit)

- External AI: **BLOCKED** (legal PENDING)
- Playwright E2E (full suite): **NOT VERIFIED** — see `OP-1_playwright_run_2026-09-20.txt`
- k6 room-design smoke: **NOT EXECUTED**
- 25K / production load: **NOT VERIFIED**
- Real mobile / 3D GPU / AR device: **NOT VERIFIED**
- Live production deploy: **NOT VERIFIED**
- Git: **Day 32**
- Manual storefront testing: **NOT COMPLETED**

---

## Day 32 (2026-09-21)

Storefront Try-in-Room + Studio (Stage 30 follow-through): Wired real room-designer into the sidebar studio, optimistic/shimmer Try-in-Room (product + room-design jobs), stub compositor for design overlays, and mobile-responsive skeletons. External OpenAI remains fail-closed.

KVM2 Optimization (Phases 3–14): Guest listing cache + async `product_viewed`; then guest product-detail cache, schema-probe removal, and bounded related products. Local 2-vCPU envelope, 2 Octane workers — listing ~86 RPS / 18 ms p95, detail ~86 RPS / 30 ms p95, mixed rps50 ~50 RPS / 13 ms p95. Hostinger **NOT VERIFIED**.

Status: Verified with limitations (legal AI approval pending; manual testing not completed). Next: Manual testing.

---

## Current focus

Operational KVM2 capacity work (not a numbered Stage 31):

- Phase 1–2 bottleneck report: **COMPLETE**
- Operational Phases 3–13 optimization: **COMPLETE WITH LIMITATIONS** — `conception/Stages/Post-Stage 30/KVM2_OPTIMIZATION_AND_SCALABILITY_REPORT.md`
- Phase 14 product-detail + search: **COMPLETE WITH LIMITATIONS** — `conception/Stages/Post-Stage 30/KVM2_PRODUCT_DETAIL_SEARCH_OPTIMIZATION_REPORT.md`
- Phase 15 authenticated overlay + HTTP certification: **COMPLETE WITH LIMITATIONS** — `conception/Stages/Post-Stage 30/KVM2_AUTHENTICATED_DETAIL_AND_OCTANE_CAPACITY_REPORT.md`
- Evidence: `backend/storage/certification/kvm2-equivalent/phase15-authenticated-octane/` (workers-2 + workers-4)
- Phase 15 highlights (2 Octane workers, local KVM2-equivalent): auth detail 25 VU **83 RPS / 59 ms p95**; guest detail **89 RPS / 10 ms p95**; mix-realistic **86 RPS / 39 ms p95**; mixed rps150 **149 RPS / 132 ms p95** (Phase 14: 340 ms); **failed_jobs = 0**
- Octane **4 workers** on same 2 app CPUs: **rps150 p95 worse (264 vs 132 ms)** → **default remains 2 workers**
- Bottleneck: **Octane/PHP CPU** on cpuset 0–1 at ~150 RPS mixed; Redis busy but not saturated (sampler)
- Uncommitted: overlay, cache refactor, queue healthcheck, k6 harness fixes, `kvm2-test.env` Sanctum hosts for k6, phase15 report
- Phase 17 Octane/PHP CPU: **COMPLETE WITH LIMITATIONS** (+ **17.2 variance**) — `KVM2_PHASE_17_OCTANE_PHP_CPU_REPORT.md`
- Opt-01b/01c **ACCEPTED**; 17.2 **REGRESSION VERDICT: VARIANCE** — rps150 optimized 3× **28–154 ms** (431 ms single-run outlier)
- Opt-01 replicates: rps100 mean p95 **~12 ms**; rps125 **~78 ms**; paired pre-opt01 **completed with caveats** (HEAD control + 5xx — not clean A/B)
- Bottleneck unchanged: **Octane/PHP ~75–86% CPU** at rps150 (Phase 15 sampler); **OCTANE_WORKERS=2**
- Phase 18 PHP/Octane profiling: **COMPLETE WITH LIMITATIONS** — `KVM2_PHASE_18_PHP_CPU_PROFILING_REPORT.md`
- Phase 18.1 saturation + function SPX: **COMPLETE WITH LIMITATIONS** — `KVM2_PHASE_18_1_SATURATION_AND_FUNCTION_PROFILING_REPORT.md`
- SPX: **kernel warm path OK**; **Octane HTTP SPX not captured**; warm search **with q** → **SearchQueryEvent INSERT ~367ms**; **no q** → **~20ms** (facets not proven hot)
- Saturation: Phase 18 **rps200 p95 574–867 ms**, **0× 5xx**; app CPU primary resource class
- Phase 18.2–18.3 search analytics async: **COMPLETE WITH LIMITATIONS** — `KVM2_PHASE_18_2_18_3_SEARCH_ANALYTICS_ASYNC_REPORT.md`
- **Async implemented:** `RecordSearchQueryAnalyticsJob` on **`default`** queue; controller dispatches job (no `app()->terminating()` sync INSERT)
- Octane proof: nginx curl **q=sofa p95 ~27 ms** post-change; sync diagnostic jsonl **0** on HTTP; **Octane HTTP SPX still not captured**
- Post-async k6 (3× mixed + search-only): **search-only rps150 p95 298→143 ms**; mixed **rps150 ~72–105 ms** vs Phase 18 **86–195 ms**; **rps200 ~410–537 ms** vs **574–867 ms**; **0× 5xx/429**, **failed_jobs=0**
- Queue failure spot: **HTTP 200** with worker stopped; per-event recovery probe **inconclusive**
- **New bottleneck:** catalog search execution + **Octane/PHP CPU** at ~150–200 RPS mixed (analytics INSERT removed from HTTP path)
- Evidence: `backend/storage/certification/kvm2-equivalent/phase18-2-3-search-analytics-async/` · **Uncommitted** · **Hostinger NOT VERIFIED**
- Phase 19 deep root-cause verification: **VERIFIED WITH LIMITATIONS** — `KVM2_PHASE_19_SEARCH_PERFORMANCE_AND_SCALABILITY_REPORT.md`
- **Root cause (HIGH waiting / MEDIUM full chain):** **Octane worker request waiting** on 2 workers / 2 CPUs — **parallel curl** p95 **89→392 ms** (warm); **not** warm q SQL (**0.6 ms / 0 SQL** in-process)
- **Secondary:** **~40k+** analytics jobs on `default` queue (enqueue > drain); **sequential k6 ladder** contaminated late rps175–200 vs Phase 18.3
- Phase 19 baseline **complete** → `phase19-search-performance/baseline/baseline/campaign.json`; steady rps125 p95 **~39–48 ms**; **no code optimization**
- **CPU sampler Phase 19:** NOT MEASURED (Windows background); Phase 15 ref **~65% app CPU** @ rps150
- Evidence: `phase19-search-performance/` (scorecard, Face 3, queue backlog, octane probe) · **Hostinger NOT VERIFIED**
- Phase 19 Git Release: **CLOSED & COMMITTED** (`3921071`) · `diyar/dev` **SYNCHRONIZED** · `prod-temp` **FAST-FORWARDED**
- Phase 20 Clean Runtime, Dedicated Queue & Cardinality Scaling:
  - Directory: `backend/storage/certification/kvm2-equivalent/phase20-clean-runtime/`, `phase20-queue-isolation/`, `phase20-cardinality/`
  - Report: `conception/Stages/Post-Stage 30/KVM2_PHASE_20_CLEAN_RUNTIME_AND_QUEUE_ISOLATION_REPORT.md`
  - **Phase 20.0 Clean Runtime Baseline:** **VERIFIED WITH LIMITATIONS** (Authoritative run `task-156`, commit `4d74ff5`)
    - Queue Depth: 0 across all runs. Failed jobs: 0. 0x 5xx, 0x unexpected 429.
    - Capacity boundary: App CPU reaches ~77% @ rps175, ~94% @ rps200 (peak ~146%).
  - **Phase 20.1 Dedicated Analytics Queue Experiment:** **VERIFIED WITH LIMITATIONS**
    - Verdict: Dedicated analytics queue provides background workload isolation, but no HTTP latency/throughput improvement was demonstrated in the 2-vCPU KVM2-equivalent envelope.
    - Mixed overall p95 aggregates 50% detail, 30% browse, and 20% search, while search p95 strictly measures query execution path.
  - **Phase 20.2 Catalog Cardinality Scaling:** **VERIFIED WITH LIMITATIONS**
    - Evaluated 12 -> 1,000 -> 10,000 products with deterministic seeds.
    - Listing & Detail: The listing query remained effectively stable across tested cardinalities because the existing index supports the query efficiently without scanning unneeded rows.
    - Fulltext Search: Bottleneck at 10,000 products under 150 RPS (~380ms MySQL execution time) is attributed to `OR products.name LIKE '%raw%'` fallback forcing filesort with correlated review subqueries.
  - **Phase 20 Status:** **COMPLETE WITH LIMITATIONS**
  - **Post-Stage 30 Program:** **CLOSED WITH LIMITATIONS**
  - **Hostinger Validation:** **NOT VERIFIED** (Local KVM2-equivalent envelope cpuset:0-1, 2 Octane workers).
- **Stage 26.5 Vendor Advanced Coupon Management:** **COMPLETE**
  - Full 3-way coupon types: Percentage, Fixed Amount (SAR), and Free Shipping.
  - Admin & Vendor portal synchronization: `AdminCouponsPage`, `AdminCouponDetailPage`, `VendorCoupons` page, and `VendorCouponFormModal`.
  - Full RTL Arabic/English i18n support.
  - Certified in `conception/Stages/Stage 26/Phase 26.5 - Advanced Coupons/COMPLETION_REPORT.md`.
- **Stage 26.4 Advanced Shipping — Vendor Self-Service Rules:** **COMPLETE**
  - Vendor shipping settings API and UI now expose `use_advanced_rules` toggle.
  - Backend: `UpdateVendorShippingSettingsRequest`, `VendorShippingSettingsResource`, `VendorShippingSettingsService`.
  - Frontend: `VendorShippingSettingsPanel` with Carrier options card toggle and bilingual hints.
  - Verified: 59/59 PHPUnit shipping tests passed, 87/87 Vitest suites (350/350 tests) passed, `npm run build` passed.
- **Stage 26.8 Admin Improvements — Increment 1 Control Plane Wiring:** **COMPLETE**
  - Routed and connected all orphaned admin SPA pages in `AdminShell.tsx`: Orders, Products, Coupons, Refunds, Reviews, Roles, and Health Center.
  - Wired full navigation items in `adminNav.ts` with granular permission checks (`orders.view`, `products.view`, `coupons.view`, `refunds.view`, `reviews.view`, `roles.view`, `system.health.view`).
  - Full Arabic and English RTL/LTR localization verified.
- **Stage 26.9 Senior Search Optimization & Scalability Program (Phase 20.5):** **COMPLETE / CERTIFIED (within local tested scope)**
  - Architecture: Modular monolith preserved with MySQL as source of truth; Meilisearch and Elasticsearch explicitly deferred.
  - Abstraction: Created clean `ProductSearchContract` / `ProductSearchService` interface; decoupled `CatalogSearchService` and `ProductService::searchPublic`.
  - Fulltext Query Optimization: Removed redundant `OR products.name LIKE '%raw%'` fallback from `ProductService::applyFilters` that was invalidating the ngram FULLTEXT index (`products_search_fulltext`). In the cited EXPLAIN search plan, examined rows dropped from ~10,000 to 1 candidate row.
  - Aggregation Optimization: Decoupled correlated review aggregates (`COUNT` and `AVG`) from catalog queries into `ProductService::hydrateReviewAggregates`, executing a single indexed batch query in 0.29 ms for card collections.
  - Card Projection: Strict separation between lightweight card projection (`ProductCardResource`) and complete product detail (`ProductDetailResource`).
  - Empirical Performance (10,000 Products): English and Arabic search latency reduced from ~410–427 ms to 13.6–21.1 ms (19× to 30× faster; >95% latency reduction in local KVM2-equivalent test environment). Sustained 150 RPS load test on 10K catalog achieved 0.00% error rate.
  - Architectural Verdict: The current MySQL search architecture satisfies the tested 10K-product workload with substantial measured improvement. A dedicated search service remains deferred until real Hostinger deployment and real production-scale evidence justify the additional infrastructure.
  - Correctness: 171/171 backend catalog/search tests passed; 87/87 Vitest suites (350/350 tests) passed.
  - Hostinger Status: `HOSTINGER: NOT VERIFIED` (Local KVM2-equivalent envelope only).
- **Phase 21 Whole Platform Performance & Capacity Program:** **PREPARED / DEFERRED TO TOMORROW**
  - Scope: Complete platform surface mapped (528 backend API routes, 40+ frontend views), test scripts and telemetry collectors staged.
  - Execution Status: Formal whole-platform execution is scheduled for tomorrow. Not certified today.
  - Hostinger Status: `HOSTINGER: NOT VERIFIED`.
- **Backend Architecture Organization & Domain Modularization:** **COMPLETE / CERTIFIED WITH LIMITATIONS**
  - Architecture: Established Domain-Driven Modular Monolith pattern (`Core/`, `Domains/`, `Infrastructure/`).
  - Inventory & Mapping: Mapped 114 Models, 85+ Controllers, 70+ Requests, 103 Resources, and 38 Service modules across 24 bounded domains in `conception/Architecture/BACKEND_REORGANIZATION_MAP.md`.
  - Architecture Specification: Documented domain boundaries, dependency rules, and search integration in `conception/Architecture/BACKEND_ARCHITECTURE.md`.
  - Certification Report: Produced `conception/Architecture/BACKEND_REORGANIZATION_REPORT.md`.
  - Environment Cleanup: Removed 4 obsolete/duplicate `.env` scratch files; preserved canonical `.env.example`, `.env.production.example`, `.env.staging.example`, and `.env.loadtest.example`.
  - Route Invariant: All 528 API routes preserved identically with 0 URL mutations.
  - Test Verification: 1,108 backend tests passing (1,101 passed, 7 skipped, 0 failed, 4,560 assertions).
  - Search Source of Truth: MySQL boolean fulltext search preserved; Meilisearch/Elasticsearch deferred.
  - Phase 21: DEFERRED TO TOMORROW.
  - Frontend Organization: NOT STARTED.
  - Mobile Organization: NOT STARTED.
  - Hostinger Status: `HOSTINGER: NOT VERIFIED`.
- **Step 1: Backend Domain Organization Pre-Migration Architecture Audit (2026-10-01):** **AUDIT COMPLETE**
  - Authority: Senior Full-Stack Engineer + Software Architect + Backend Architect + QA/Security Engineer + Technical PM.
  - Final Audit Report: `conception/Architecture/PRE_MIGRATION_ARCHITECTURE_AUDIT.md`.
  - Verified Codebase Surface: 1,141 PHP files in `app/`, 528 total registered routes (522 API v1 + 6 platform), 145 unique action controllers, 114 Eloquent models (104 shared across >1 domain), 131 form requests, 107 resources, 327 services across 38 subdirectories.
  - Test Suite Baseline: 1,108 backend tests (1,101 passed, 7 skipped, 0 failed, 4,560 assertions, duration: 172.9s).
  - Search Architecture: Strictly preserved (`ProductSearchContract` -> `ProductSearchService` -> `CatalogSearchService` -> `ProductService`).
  - Critical Invariant: 0 files moved, 0 namespaces modified, 0 route contracts mutated, 0 database migrations added.
  - Classification: **READY FOR PHYSICAL MIGRATION** (Under Phase 1-8 Topological Sequence & Model Preservation Strategy).
- **Step 2: Core Platform Foundations Physical Backend Migration (2026-10-01):** **COMPLETE / CERTIFIED**
  - Authority: Senior Backend Architect + Senior Laravel Engineer + Full-Stack Engineer + QA Engineer + Security Engineer + DevOps/Infrastructure Engineer + Technical Project Manager.
  - Physical Migration Scope (36 files migrated via history-preserving `git mv`):
    - **16 Core Middleware:** `ApplyHttpCachePolicy`, `AssignRequestCorrelationId`, `EnsureAccountIsActive`, `EnsureAdminPermission`, `EnsureAdminUserIsActive`, `EnsureCleanAuthState`, `EnsureMarketplaceAccess`, `EnsureMarketplaceNotInMaintenance`, `EnsureRoomDesignerAiSpatialEnabled`, `EnsureRoomDesignerEnabled`, `EnsureTryInRoomEnabled`, `EnsureUserHasRole`, `EnsureUserSessionNotRevoked`, `SecurityHeaders`, `SetLocaleFromRequest`, `UserSessionActivityMiddleware` -> `App\Core\Middleware\*`.
    - **1 Core Provider:** `AppServiceProvider` -> `App\Core\Providers\AppServiceProvider`. (The 6 domain providers—`Affiliate`, `Analytics`, `Chat`, `Loyalty`, `Notification`, `Settings`—intentionally remain in `app/Providers/` under `App\Providers\*` awaiting domain migrations).
    - **19 Core Support Classes:** `Api\ApiResponse`, `Http\TrustedProxies`, `Http\FrontendOrigin`, `Http\DiyarNetworkOrigins`, `Content\HtmlContentSanitizer`, `Export\CsvExportHelper`, `Locale\LocalizedFinanceDateFormatter`, `Pagination\PaginationBounds`, `Realtime\ReverbAllowedOrigins`, `SlugGenerator`, `Cache\CacheKeys`, `Cache\CachesQueryResults`, `Cache\StampedeSafeCache`, `Cache\VersionedCache`, `Media\CmsImageUrl`, `Media\ImageContentValidator`, `Media\OptimizedMedia`, `Media\StoredMedia`, `Media\SvgSafetyValidator` -> `App\Core\Support\*`.
  - Intentionally Excluded:
    - Eloquent Models: 114 models preserved in `app/Models/*` (104 shared models; morph maps, relationships, policies preserved).
    - Domain Exceptions: 4 visualization/room design exceptions preserved in `app/Exceptions/*` awaiting their domain steps.
    - Domain Rules: 0 files in `app/Rules/*`.
    - Base Controller: `app/Http/Controllers/Controller.php` preserved in place to prevent unnecessary churn across 145 action controllers.
  - Reference Updates: 215 referencing files updated across `app/`, `bootstrap/app.php`, `bootstrap/providers.php`, `routes/api.php`, `config/`, and `tests/`.
  - Static Reference Audit: 0 stale references found across active codebase for migrated classes.
  - Autoload Verification: `composer dump-autoload` PASSED (8,620 classes mapped).
  - Runtime & Boot Verification: `php artisan about` boots cleanly without errors.
  - Route Invariant (Gate 10): 528 routes preserved identically (522 API v1 + 6 platform routes). Zero URL, method, or middleware order mutations.
  - Backend Test Verification (Gate 11): 1,108 tests (1,101 passed, 7 skipped for environment dependencies, 0 failed, 4,560 assertions, duration: 114.9s).
  - Search Regression Gate (Gate 12): 72/72 search tests passed (232 assertions), 17/17 visual search tests passed. Search contract preserved.
  - Security Regression Gate (Gate 13): 18/18 security tests passed, 61/61 auth tests passed. Sanctum, middleware pipeline, and role authorization preserved.
  - Frontend Test & Build Verification: Vitest 87/87 files (350/350 tests) passed; `npm run build` PASSED (0 errors, 17.02s).
- **Step 3: Infrastructure + Identity Physical Backend Migration (2026-10-01):** **COMPLETE / CERTIFIED**
  - Authority: Senior Backend Architect + Laravel Engineer + Security Engineer + QA Engineer + DevOps Engineer + Technical Project Manager.
  - Step 3A: Infrastructure Layer Physical Migration (3 classes moved):
    - `DiyarPhpMailer`, `DiyarMailTemplate`, `DiyarMailContent` moved from `app/Services/Mail/` to `App\Infrastructure\Mail\*`.
    - Existing infrastructure adapters verified in place: `App\Infrastructure\Mail\LogEmailOtpProvider`, `App\Infrastructure\Notifications\*` (`ApnsPushProvider`, `FcmPushProvider`, `CompositePushProvider`, `LogPushProvider`, `PushProviderException`, `PushSendResult`), `App\Infrastructure\Sms\*` (`LogSmsProvider`, `MsegatSmsProvider`, `SmsProviderFactory`).
  - Step 3B: Identity Domain Physical Migration (60 classes moved to `App\Domains\Identity\*`):
    - **1 Contract:** `OtpCodeGenerator` -> `App\Domains\Identity\Contracts\OtpCodeGenerator`.
    - **6 Controllers:** `AuthController`, `ProfileController`, `AddressController`, `ProfileSecuritySessionController`, `ProfileTwoFactorController`, `OwnershipController` -> `App\Domains\Identity\Controllers\*`.
    - **20 Form Requests:** 10 Auth requests (`ForgotPasswordRequest`, `LoginRequest`, `RegisterRequest`, `ResendEmailOtpRequest`, `ResendOtpRequest`, `ResendTwoFactorRequest`, `ResetPasswordRequest`, `VerifyEmailOtpRequest`, `VerifyOtpRequest`, `VerifyTwoFactorRequest`) + 10 Profile requests (`ConfirmTwoFactorRequest`, `DisableTwoFactorRequest`, `RequestPhoneChangeRequest`, `StoreAddressRequest`, `UpdateAddressRequest`, `UpdateProfilePasswordRequest`, `UpdateProfileRequest`, `UploadAvatarRequest`, `VerifyEmailVerificationRequest`, `VerifyPhoneChangeRequest`) -> `App\Domains\Identity\Requests\*`.
    - **5 API Resources:** `AddressResource`, `ProfileResource`, `UserResource`, `UserSessionDeviceResource`, `UserSessionResource` -> `App\Domains\Identity\Resources\*`.
    - **20 Domain Services:** `AuthService`, `EmailOtpCacheStore`, `EmailOtpService`, `EmailVerificationService`, `OtpCacheStore`, `OtpService`, `PasswordResetService`, `PhoneNormalizer`, `RegistrationService`, `SecureOtpCodeGenerator`, `WelcomeEmailService`, `AddressService`, `PhoneChangeService`, `ProfileService`, `IpGeolocationService`, `TwoFactorChallengeStore`, `TwoFactorLoginChallengeService`, `TwoFactorService`, `UserAgentParser`, `UserSessionService` -> `App\Domains\Identity\Services\*`.
    - **8 Support Utilities:** `MarketplaceAccess`, `MarketplaceGuard`, `OtpTestCodeResolver`, `DeviceFingerprint`, `RevokedSessionCache`, `SessionLookupHash`, `UserSessionDeviceGroup`, `UserSessionDeviceGrouper` -> `App\Domains\Identity\Support\*`.
  - Models Preservation (Zero Risk):
    - All 114 Eloquent models remain in `app/Models/*` (including `User`, `Role`, `Permission`, `Address`, `UserSession`).
  - Reference Updates:
    - Over 50 referencing files updated across controllers, services, middleware, factories, routes, and tests.
    - Zero stale references to moved classes found across all active PHP code (`app/`, `bootstrap/`, `routes/`, `config/`, `database/`, `tests/`).
  - Autoload Verification: `composer dump-autoload` PASSED (8,620 classes mapped).
  - Runtime & Boot Verification: `php artisan about` boots cleanly without errors.
  - Route Invariant (Gate 10): 528 routes preserved identically (522 API v1 + 6 platform routes). Zero URL, method, or middleware order mutations.
  - Test Suite Certification (Full Re-run):
    - Backend: 1,108 tests (1,101 passed, 7 skipped, 0 failed, 4,560 assertions, duration: 105.8s).
    - Focused Auth: 61/61 passed.
    - Focused Profile: 56/56 passed.
    - Focused Security: 18/18 passed.
    - Focused Notifications: 10/10 passed.
    - Search Regression (Gate 12): 17/17 search tests passed.
  - Frontend Test & Build Certification:
    - Vitest: 87/87 test files passed (350/350 tests, duration: 43.8s).
    - Production build: `npm run build` passed cleanly in 10.41s.
- **Step 4: Protected Search + Catalog Physical Backend Migration (2026-10-01):** **COMPLETE / CERTIFIED**
  - Authority: Senior Backend Architect + Laravel Engineer + Database/Search Engineer + Performance Engineer + QA Engineer + Security Engineer + Technical Project Manager.
  - Invariant Principle: Physical migration without Search refactor. Query structure, SQL semantics, fulltext matching, ranking, facets, fallback, and cache keys/TTL preserved with zero behavioral modification.
  - Search Domain Physical Migration (14 files moved to `App\Domains\Search\*`):
    - **2 Contracts:** `ProductSearchContract`, `SearchEngineInterface` -> `App\Domains\Search\Contracts\*`.
    - **3 Controllers:** `CatalogSearchController`, `CatalogSearchSuggestionsController`, `FilterSuggestionsController` -> `App\Domains\Search\Controllers\*`.
    - **1 Request:** `CatalogSearchRequest` -> `App\Domains\Search\Requests\*`.
    - **2 Jobs:** `IndexProductImageJob`, `RecordSearchQueryAnalyticsJob` -> `App\Domains\Search\Jobs\*`.
    - **6 Services:** `ProductSearchService`, `CatalogSearchService`, `CatalogSearchSuggestionService`, `MysqlCatalogSearchEngine`, `SearchAnalyticsRecorder`, `SearchAnalyticsQueryService` -> `App\Domains\Search\Services\*`.
    - Protected Dependency Chain: `ProductSearchContract` -> `ProductSearchService` -> `CatalogSearchService` -> `ProductService` maintained and bound in `AppServiceProvider`.
  - Catalog Domain Physical Migration (62 files moved to `App\Domains\Catalog\*`):
    - **5 Controllers:** `ProductController`, `CategoryController`, `ProductEngagementController`, `ProductPreorderController`, `HomeStorefrontController` -> `App\Domains\Catalog\Controllers\*`.
    - **3 Requests:** `ProductListRequest`, `StoreProductPreorderRequest`, `Concerns\PreparesCatalogFilterQuery` -> `App\Domains\Catalog\Requests\*`.
    - **4 Resources:** `CategoryResource`, `ProductCardResource`, `ProductDetailResource`, `ProductPreorderRequestResource` -> `App\Domains\Catalog\Resources\*`.
    - **19 Services:** `ProductService`, `CategoryService`, `CatalogCacheInvalidator`, `CachedPublicProductDetailService`, `CachedPublicProductListService`, `CachedFilterContextSummaryService`, `CachedFilterSuggestionService`, `FilterContextSummaryService`, `FilterSuggestionService`, `FilterSuggestionRankingService`, `FilterSuggestionInitializationService`, `FilterSuggestionMetrics`, `FilterSuggestionTelemetry`, `InventoryService`, `ProductDetailUserOverlayService`, `ProductEngagementService`, `ProductPreorderService`, `ProductSalesStatsService`, `HomeStorefrontService` -> `App\Domains\Catalog\Services\*`.
    - **31 Support / Filters Utilities:** `CatalogFilterNormalizer`, `CatalogFilterRuleBuilder`, `FilterCapability`, `FilterCapabilityRegistry`, `FilterContentType`, `FilterOperator`, `FilterPresentation`, `FilterSurface`, `FilterValueType`, `Context\*` (10 classes), `Suggestions\*` (12 classes) -> `App\Domains\Catalog\Support\Filters\*`.
  - Intentionally Excluded & Protected:
    - Eloquent Models: `Product`, `Category`, `ProductColor`, `ProductImage`, `ProductInventory`, `ProductLike`, `ProductPreorderRequest`, `SearchQueryEvent` preserved in `app/Models/*` (0 models moved).
    - Visual Search Domain: `VisualSearchController`, `VisualIndexingService`, `VisualSearchService`, `VisualCandidateRetriever`, `RecordVisualSearchEventJob`, `RemoveVisualIndexEntryJob` reserved for Step 5 (Spatial / Media).
    - Vendor Domain: `VendorController`, `VendorFollowController`, `VendorInventoryController`, `VendorProductController`, `VendorService` reserved for Vendors domain.
    - Review Domain: `StoreReviewController` reserved for Reviews domain.
  - Reference Updates: Over 80 referencing files updated across controllers, services, routes, commands, tests, and workers. 0 stale references found across active codebase.
  - Route Invariant: Exactly 528 routes registered (522 API v1 + 6 platform routes).
  - Test Suite Certification (Full Re-run):
    - Backend: 1,108 tests (1,101 passed, 7 skipped for environment dependencies, 0 failed, 4,560 assertions, duration: 112.5s).
    - Search Tests: 17/17 passed (68 assertions).
    - Catalog Tests: 154/154 passed (725 assertions).
    - Cache Tests: 9/9 passed (24 assertions).
    - Unit Support/Catalog: 26/26 passed (70 assertions).
    - Concurrency Inventory Tests: 1/1 passed (6 assertions).
  - Frontend Test & Build Certification:
    - Vitest: 87/87 test files passed (350/350 tests, duration: 46.1s).
    - Production build: `npm run build` passed cleanly in 12.49s.
  - Next Approved Step: Step 5 — Spatial / Media.
- **Git Status:** dev branch, commit `refactor(architecture): migrate search and catalog domains`.

