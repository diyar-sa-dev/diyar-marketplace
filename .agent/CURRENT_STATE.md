# CURRENT_STATE.md

> **Last updated:** 2026-09-22  
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
    - Verdict: `QUEUE ISOLATION BENEFIT VERIFIED; REQUEST LATENCY BENEFIT NOT VERIFIED`.
    - `RecordSearchQueryAnalyticsJob` isolated to dedicated `analytics` queue & worker. Queue depth = 0.
  - **Phase 20.2 Catalog Cardinality Scaling:** **VERIFIED WITH LIMITATIONS**
    - Evaluated 12 -> 1,000 -> 10,000 products with deterministic seeds.
    - Listing & Detail: **STABLE** (O(1) index scans).
    - Fulltext Search: **GRADUAL DEGRADATION transitioning to BOTTLENECK at 10,000 products** under 150 RPS.
  - **Phase 20 Status:** **COMPLETE WITH LIMITATIONS**
  - **Post-Stage 30 Program:** **CLOSED WITH LIMITATIONS**
  - **Hostinger Validation:** **NOT VERIFIED** (Local KVM2-equivalent envelope cpuset:0-1, 2 Octane workers).
  - **Next Product Feature Shipped:** **Stage 26.5 Vendor Advanced Coupon Management**
    - Full 3-way coupon types: Percentage, Fixed Amount (SAR), and Free Shipping.
    - Backend: `StoreVendorCouponRequest`, `UpdateVendorCouponRequest`, `VendorCouponManagementService`, and test suite updated.
    - Frontend: `VendorCouponFormModal`, `VendorCouponCard`, `CouponShareCard`, and dashboard page updated with Arabic/English i18n.
    - All 19 coupon PHPUnit tests passed; 87/87 Vitest test suites (350/350 tests) passed; frontend production build passed.

