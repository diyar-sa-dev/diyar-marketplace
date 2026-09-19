# CURRENT_STATE.md

> **Last updated:** 2026-09-19  
> **Maintained by:** AI development agents after each phase completion

---

## Project

**DIYAR Marketplace** — Arabic RTL multi-vendor commerce + services + affiliate + admin operations — Saudi Arabia · SAR · 15% VAT

---

## Stage Status

| Stage | Status |
|-------|--------|
| Stages 0–19 | **COMPLETE** |
| Stage 20 — Security | **PARTIAL** |
| Stage 21 — E2E | **PARTIAL** (19 Playwright tests) |
| Stage 22 — Performance | **CODE COMPLETE** — 25K **NOT VERIFIED** |
| Stage 23 — Staging | **CODE COMPLETE** — remote host optional |
| Stage 24 — Production | **DOCS + CONFIG** — not live-deployed |
| Stage 29 — Visual Search V1 | **CERTIFIED** |
| Stage 30 — Room Designer | **IN PROGRESS** — **30.11 CLOSED**; **30.12 CLOSED**; **next: 30.13 (not started)** |

---

## Stage 30 — Room Designer (Interactive)

```text
30.1 Spatial Core     VERIFIED (Face 2 + parse hardening)
30.2 Room presets     VERIFIED (majlis / salon / bedroom, meters)
30.3 Catalog adapter  VERIFIED (cm→m snapshot, no price/stock)
30.4 2D Fabric        VERIFIED (lazy adapter; ~309 KiB fabric min; not in main dist yet)
30.5 Interaction      VERIFIED (MOVE/ROTATE via commands; RoomDesignerCanvasHost)
30.6 Persistence      VERIFIED WITH LIMITATIONS (API + autosave adapter; flag off by default)
30.7 Catalog          VERIFIED WITH LIMITATIONS (UUID product_id, CatalogPanel, search/browse)
30.8 Cart             VERIFIED WITH LIMITATIONS (add-to-cart API + review modal hook)
30.9 Mobile UX        VERIFIED WITH LIMITATIONS (shell, responsive canvas, viewport pinch)
30.10 Quality/Perf    VERIFIED WITH LIMITATIONS (gates, E2E spec, bundle evidence)
30.11 Try-in-Room     **CLOSED / FINAL** — VERIFIED WITH LIMITATIONS (2026-09-19 final certification)
30.12 AI Provider     **CLOSED / FINAL** — VERIFIED WITH LIMITATIONS (2026-09-19)
30.13 First AI Prov.  **NOT STARTED** (next per roadmap; needs legal sign-off)
```

Code: `frontend/src/features/room-designer/`  
Authority: `conception/Stages/Stage 30/RoomDesigner/STAGE_30_ROOM_DESIGNER_MASTER.md`

### 30.6 persistence snapshot

- DB: `room_designs` (JSON document, `version`, soft delete)
- API: `/api/v1/room-designs` — Sanctum, policy, `expected_version` → 409
- Flag: `DIYAR_FEATURE_ROOM_DESIGNER_ENABLED` (default false)
- Frontend: `persistence/` adapter + 2.5s debounce (`RoomDesignAutosave`)
- Tests: PHPUnit 11 (room design), Vitest 4 (autosave), room-designer 63 total
- Reports: `STAGE_30_6_*` under `conception/Stages/Stage 30/Stage 30.6/`

### 30.7 catalog snapshot

- **DEC-009:** `product_id` = catalog UUID string (domain, API, JSON)
- Picker: `ui/CatalogPanel.tsx` + `catalog/useRoomDesignerProductSearch` (12/page, 300ms debounce)
- Add flow: `fetchProduct` → `addCatalogProductToSession` → `ADD_ITEM` (center placement)
- Tests: **71** Vitest room-designer, **12** PHPUnit room-design
- Limitation: legacy Sidebar mock not replaced; stale-product UI badge deferred
- Reports: `conception/Stages/Stage 30/Stage 30.7/*`

### 30.8 cart snapshot

- `POST /api/v1/room-designs/{id}/add-to-cart` — document-driven UUID aggregation → `CartService::addItem`
- Response: `CartResource` + `skipped[]` (`not_found`, `out_of_stock`, `not_allowed`)
- Frontend: `deriveCartLinesFromDocument`, `AddToCartReviewModal`, `useRoomDesignAddToCart`
- Tests: PHPUnit 20 (room), Vitest 74 (room-designer)
- Reports: `conception/Stages/Stage 30/Stage 30.8/*`

### 30.9 mobile UX snapshot

- Shell: `ui/RoomDesignerShell.tsx` — `lg` (1024px) aside catalog; mobile bottom sheet; RTL toolbar + LTR canvas
- Canvas: `useContainerSize`, `resizeViewport`, `touchFriendly` Fabric controls
- Gestures: `viewportPinchZoom.ts` — viewport zoom only (no domain commands)
- Autosave: `useRoomDesignAutosave` flush on unmount
- Tests: Vitest **77** (room-designer), PHPUnit **20** (room)
- Limitation: **REAL DEVICE TESTING NOT VERIFIED**; shell not wired to Sidebar mock; no Playwright designer route
- Reports: `conception/Stages/Stage 30/Stage 30.9/*`

### 30.10 quality / performance snapshot

- Route: `/profile/room-designer` → `RoomDesignerPage` + `RoomDesignerShell` (flag-gated API)
- A11y: `useModalDialog` on cart review + mobile catalog sheet
- E2E: `frontend/e2e/room-designer.spec.ts` (API + desktop/tablet/mobile UI); **local Playwright NOT RUN** (no backend)
- Bundle: Fabric in `FabricRoomRenderer-*.js` only (~292 KiB min); main marketplace chunk has no Fabric
- Tests: Vitest **80** (room-designer + modal hook), PHPUnit **21** (room)
- Production flag: remain **`DIYAR_FEATURE_ROOM_DESIGNER_ENABLED=false`** until CI E2E green
- Reports: `conception/Stages/Stage 30/Stage 30.10/*`

#### Quality gates (30.10)

| Gate | Status |
|------|--------|
| G1 Functional | PASS WITH LIMITATION |
| G2 Security | PASS |
| G3 Persistence | PASS |
| G4 Catalog | PASS WITH LIMITATION |
| G5 Cart | PASS |
| G6 Performance | PASS WITH LIMITATION |
| G7 Mobile | PASS WITH LIMITATION |
| G8 Accessibility | PASS WITH LIMITATION |
| G9 E2E | NOT VERIFIED (local) |
| G10 Feature flag | PASS |
| G11 Build | PASS |
| G12 Regression | PASS |

### Pre-30.11 hardening (2026-09-19)

- **Status:** VERIFIED WITH LIMITATIONS
- **P1 fixed:** `RoomDesignerCanvasHost` no longer recreates `DesignerSession` on every edit (`sessionResetKey={designId}`)
- **Tests:** Vitest **81** (room-designer), PHPUnit **21** (room)
- **E2E:** spec present; **NOT RUN** this session
- **Docs:** `conception/Stages/Stage 30/Stage 30.11/STAGE_30_PRE_30_11_HARDENING_*.md`
- **30.11 entry:** READY WITH LIMITATIONS — no open P0/P1 on foundation

### 30.11 try-in-room — CLOSED (final 2026-09-19)

- **Status:** **CLOSED / FINAL** — no further 30.11 work unless production defect/security patch
- **Certification:** VERIFIED WITH LIMITATIONS — `conception/Stages/Stage 30/Stage 30.11/STAGE_30_11_FINAL_CERTIFICATION.md`
- **Pipeline:** upload → private `try_in_room` disk (GD re-encode) → job → `afterCommit` queue → stub provider → poll
- **API:** `POST /products/{product}/try-in-room`, `POST /room-designs/{id}/try-in-room`, `GET /try-in-room/{id}`
- **Flag:** `DIYAR_FEATURE_TRY_IN_ROOM_ENABLED=false` default
- **Tests (closure):** PHPUnit TryInRoom **20**, RoomDesign **21**; Vitest room-designer + try-in-room **86**; build **pass** — evidence: `STAGE_30_11_TEST_EVIDENCE.md`
- **Migration:** structurally **READY WITH LIMITATIONS** (sqlite via tests; **production MySQL not migrated**)
- **Known limitations (accepted):** E2E NOT RUN; no orphan sweeper; nullable product/design refs without FK
### 30.12 AI provider abstraction — CLOSED (final 2026-09-19)

- **Status:** **CLOSED / FINAL** — VERIFIED WITH LIMITATIONS
- **Certification:** `conception/Stages/Stage 30/Stage 30.12/STAGE_30_12_FINAL_CERTIFICATION.md`
- **Pipeline change:** `ProcessTryInRoomJob` → `VisualizationService` → registry (`null`|`stub`) → normalized result
- **Config:** `DIYAR_VISUALIZATION_DRIVER` (default `null`); local try-in-room needs `stub`; `DIYAR_FEATURE_AI_VISUALIZATION_ENABLED=false`
- **Senior re-verification (2026-09-19):** independent Face 2 pass; P0/P1=0; added `ProcessTryInRoomJobVisualizationTest`
- **Tests (fresh):** PHPUnit try-in-room + visualization **33**; RoomDesign **21**; Vitest try-in-room **5** + room-designer **81**; build **pass** — `STAGE_30_12_TEST_EVIDENCE.md`
- **Limitations:** E2E NOT VERIFIED; production MySQL migrate NOT EXECUTED; no real AI vendor (30.13)

> Stage 30.11 must not be reopened. **30.13 — First AI Provider** is next per roadmap (not started).

---

## Current Stage 30 pointer

```text
CURRENT STAGE:  30.13 — First AI Provider (NOT STARTED)
PREVIOUS STAGE: 30.12 — AI Provider Abstraction (CLOSED / FINAL)
30.11:          Try in My Room Foundation (CLOSED / FINAL)
```

---

## Stage 29 — Visual Search V1

```text
Status: CERTIFIED
Certification Date: 2026-09-12
Certification Run: 2026-09-12_140000
Environment: diyar-production Docker
Production Catalog: VERIFIED (24 merchant images, cert synthetic removed)
Production Index: VERIFIED (24/24 set equality)
Accuracy: VERIFIED (75 real cases, 57 pass, Top-1 75%)
Security: VERIFIED
Performance: VERIFIED (p95 ~110ms in-process)
Redis: VERIFIED
Queue: VERIFIED
Frontend: VERIFIED (SPA on :8093, Playwright EN/AR/mobile)
Regression: VERIFIED (40/40 Visual Search PHPUnit + Playwright)
Observability: VERIFIED
Kill Switch: VERIFIED
Production Smoke: VERIFIED
```

Report: `conception/Stages/Stage 29/VISUAL_SEARCH_FINAL_PRODUCTION_CERTIFICATION.md`

---

## Current Position

| Field | Value |
|-------|--------|
| **Branch** | `dev` |
| **Focus** | Stages 22–24 production readiness |
| **Infrastructure** | Redis cache/queue, health + readiness, env safety validator |

---

## Stage 22–24 Highlights

- `PlatformHealthService` — DB, cache, queue probes
- `/api/v1/readiness` + `X-Request-Id` correlation middleware
- `EnvironmentSafetyValidator` + `php artisan diyar:validate-environment`
- Staging: `docker-compose.staging.yml`, `.env.staging.example`, `staging-deploy.yml`, smoke script
- Production: Nginx example, worker docs, runbooks updated

---

## Last Validation (2026-08-23, local)

| Check | Result |
|-------|--------|
| `php artisan test` | **545/545 PASS** |
| `vendor/bin/pint --test` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** |
| `npm test` | **101/101 PASS** |
| `npm run build` | **PASS** (main chunk ~2.6MB) |
| k6 25K | **NOT VERIFIED** |

---

## CI/CD

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | lint, test, build, Playwright E2E |
| `staging-deploy.yml` | staging env validation + smoke |
| `performance.yml` | k6 load profiles (manual) |

---

## Known Limitations

- 25K load capacity requires staging infrastructure — not measured locally
- Live `staging.diyar.sa` / `api.diyar.com` hosts not configured in repo
- Some React Query keys outside `admin`/`marketplace` roots (legacy)
