# Implementation Roadmap (30.1 → 30.18)

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)  
**Rule:** Execute **one stage at a time** after Stage 30 approval. No skipping audit.

Each stage includes: Objective · Scope · Dependencies · Modules · DB · API · Frontend · Backend · Tests · Performance · Security · Observability · Rollback · Feature flag · Acceptance · Evidence

---

## 30.1 — Spatial Core

| Field | Content |
|-------|---------|
| **Objective** | Renderer-independent domain: units, geometry, commands, constraints, history |
| **Scope** | Pure TS modules under `features/room-designer/domain/`; Vitest only; **no** Fabric, **no** API |
| **Dependencies** | Stage 30 approval |
| **Modules** | `document.ts`, `units.ts`, `geometry/*`, `commands/*`, `constraints/*`, `history/*`, `store.ts` |
| **DB/API** | None |
| **Frontend** | Domain + tests only |
| **Backend** | Optional JSON schema draft for later PHP validator |
| **Tests** | Full spatial matrix (see TESTING_SPECIFICATION) |
| **Performance** | N/A |
| **Security** | N/A |
| **Observability** | N/A |
| **Rollback** | Delete feature folder |
| **Feature flag** | None |
| **Acceptance** | 100% command/reducer tests pass; no React import in domain |
| **Evidence** | CI Vitest report |

---

## 30.2 — Room Model

| Field | Content |
|-------|---------|
| **Objective** | Presets + custom rectangular rooms + validation |
| **Scope** | Preset catalog (m); min/max edges; SET_ROOM_SIZE behavior when shrinking room |
| **Dependencies** | 30.1 |
| **Modules** | `room/presets.ts`, extend constraints |
| **DB/API** | None |
| **Frontend** | Unit tests for presets |
| **Backend** | None |
| **Tests** | Room resize + item clamp/shift policy documented & tested |
| **Performance** | N/A |
| **Security** | N/A |
| **Observability** | N/A |
| **Rollback** | Revert preset module |
| **Feature flag** | None |
| **Acceptance** | All preset dims in meters; invalid sizes rejected |
| **Evidence** | Test output |

---

## 30.3 — Spatial Product Model

| Field | Content |
|-------|---------|
| **Objective** | Catalog boundary: cm→m snapshots, ADD_ITEM from product DTO |
| **Scope** | Adapter from existing ProductDetailResource shape |
| **Dependencies** | 30.2, catalog types in frontend |
| **Modules** | `adapters/catalogProductToSnapshot.ts` |
| **DB/API** | Read-only existing product API |
| **Frontend** | Adapter + tests |
| **Backend** | None |
| **Tests** | Conversion accuracy; missing dimensions fallback |
| **Performance** | N/A |
| **Security** | N/A |
| **Observability** | N/A |
| **Rollback** | Remove adapter |
| **Feature flag** | None |
| **Acceptance** | Snapshot matches catalog cm within 1 mm |
| **Evidence** | Unit tests |

---

## 30.4 — 2D Renderer

| Field | Content |
|-------|---------|
| **Objective** | Fabric adapter implementing `RoomRenderer`; lazy import |
| **Scope** | Mount, render, select, emit commands; meters→pixels |
| **Dependencies** | 30.1–30.3 |
| **Modules** | `renderer/FabricRoomRenderer.ts`, dev-only harness page optional |
| **DB/API** | None |
| **Frontend** | Adapter + chunk measure |
| **Backend** | None |
| **Tests** | Adapter unit tests with mocked fabric canvas |
| **Performance** | Bundle analyze artifact |
| **Security** | N/A |
| **Observability** | N/A |
| **Rollback** | Flag off; remove route |
| **Feature flag** | `room_designer_enabled` (dev only) |
| **Acceptance** | Document renders ≥1 item; selection emits id |
| **Evidence** | Screenshot + bundle stats |

---

## 30.5 — Furniture Interaction

| Field | Content |
|-------|---------|
| **Objective** | Drag, rotate, delete, duplicate, lock, grid snap |
| **Scope** | Pointer/touch → MOVE/ROTATE; coalesced history |
| **Dependencies** | 30.4 |
| **Modules** | `ui/CanvasHost.tsx`, toolbar wiring |
| **DB/API** | None |
| **Frontend** | Refactor `SidebarAiStudioCanvas` → host |
| **Backend** | None |
| **Tests** | Interaction tests (mock renderer) |
| **Performance** | Profile drag frame time |
| **Security** | N/A |
| **Observability** | Client events stub |
| **Rollback** | Revert to read-only canvas |
| **Feature flag** | `room_designer_enabled` |
| **Acceptance** | No direct state mutation from Fabric objects |
| **Evidence** | Manual QA script + profile |

---

## 30.6 — Persistence

| Field | Content |
|-------|---------|
| **Objective** | Save/load designs with versioning + autosave |
| **Scope** | Migration, model, policy, controller, debounced PUT |
| **Dependencies** | 30.5 |
| **Modules** | Backend files per BACKEND_ARCHITECTURE; `useRoomDesignQuery` |
| **DB** | `room_designs` table |
| **API** | CRUD per API_CONTRACT |
| **Frontend** | Sync state machine; conflict UI minimal |
| **Backend** | Validator service |
| **Tests** | PHPUnit feature tests; frontend debounce test |
| **Performance** | PUT p95 measure |
| **Security** | Policy tests IDOR |
| **Observability** | `design_saved`, `design_save_failed` |
| **Rollback** | Migration down; flag off |
| **Feature flag** | `room_designer_enabled` |
| **Acceptance** | Reload restores layout; 409 on conflict |
| **Evidence** | PHPUnit + E2E save |

---

## 30.7 — Catalog Integration

| Field | Content |
|-------|---------|
| **Objective** | Real products in picker; Tier-1 assets + fallback |
| **Scope** | Remove mock STICKERS; search pagination |
| **Dependencies** | 30.6 |
| **Modules** | `ui/CatalogPanel.tsx`; optional media collection |
| **DB** | Optional media tag — **PREPARED** |
| **API** | Existing search only |
| **Frontend** | Query integration |
| **Backend** | Optional admin upload for room-plan asset |
| **Tests** | Integration with mocked API |
| **Performance** | 1 page at a time |
| **Security** | N/A |
| **Observability** | `item_added` |
| **Rollback** | Mock picker behind sub-flag — avoid; prefer flag off |
| **Feature flag** | `room_designer_enabled` |
| **Acceptance** | Add real product by search |
| **Evidence** | E2E recording |

---

## 30.8 — Cart Integration

| Field | Content |
|-------|---------|
| **Objective** | Add design items to cart with live validation |
| **Scope** | `add-to-cart` endpoint or cart batch |
| **Dependencies** | 30.7 |
| **Modules** | Cart service reuse |
| **DB** | None |
| **API** | POST `room-designs/{id}/add-to-cart` |
| **Frontend** | Review modal |
| **Backend** | Delegate to CartController patterns |
| **Tests** | OOS/deleted product cases |
| **Performance** | Single cart round-trip |
| **Security** | Auth + ownership |
| **Observability** | `cart_from_design` |
| **Rollback** | Hide cart CTA |
| **Feature flag** | `room_designer_enabled` |
| **Acceptance** | Cart reflects current price |
| **Evidence** | PHPUnit + manual |

---

## 30.9 — Mobile UX

| Field | Content |
|-------|---------|
| **Objective** | Touch-first layout and gestures |
| **Scope** | Bottom sheet, pinch zoom, pan |
| **Dependencies** | 30.8 |
| **Modules** | Responsive CSS; touch handlers in adapter |
| **DB/API** | None |
| **Tests** | Manual device matrix |
| **Performance** | Mobile profile |
| **Security** | N/A |
| **Observability** | N/A |
| **Rollback** | Desktop-only banner — avoid |
| **Feature flag** | Same |
| **Acceptance** | QA checklist signed on ≥2 devices |
| **Evidence** | Checklist in certification folder |

---

## 30.10 — Quality / Performance

| Field | Content |
|-------|---------|
| **Objective** | Production readiness for Designer V1 |
| **Scope** | E2E, k6 PUT scenario, KVM2 regression note |
| **Dependencies** | 30.9 |
| **Modules** | tests/, scripts/performance |
| **DB/API** | None new |
| **Tests** | Full matrices |
| **Performance** | Document measured budgets |
| **Security** | Upload/auth fuzz if Try-in-Room merged |
| **Observability** | Dashboards optional |
| **Rollback** | N/A |
| **Feature flag** | Beta enable |
| **Acceptance** | All P0 tests green; perf report filed |
| **Evidence** | Certification markdown |

---

## 30.11 — Try in My Room Foundation

| Field | Content |
|-------|---------|
| **Objective** | Upload, private storage, job row, poll status |
| **Scope** | No external AI yet — job completes with stub |
| **Dependencies** | 30.10 optional parallel after 30.6 |
| **Modules** | `try-in-room/*`, Replace PDP placeholder |
| **DB** | `try_in_room_jobs` |
| **API** | POST/GET try-in-room |
| **Frontend** | PDP modal flow |
| **Backend** | Process job stub |
| **Tests** | Upload validation |
| **Performance** | Async only |
| **Security** | MIME/size limits |
| **Observability** | try_in_room_* events |
| **Rollback** | `try_in_room_enabled=false` |
| **Feature flag** | `try_in_room_enabled` |
| **Acceptance** | Job lifecycle works end-to-end stub |
| **Evidence** | PHPUnit + E2E |

---

## 30.12 — AI Provider Abstraction

| Field | Content |
|-------|---------|
| **Objective** | VisualizationService + capability model + NullProvider |
| **Scope** | Config, timeouts, retries, circuit breaker |
| **Dependencies** | 30.11 |
| **Modules** | `Services/Visualization/*` |
| **DB** | job metadata |
| **API** | unchanged |
| **Tests** | Provider contract tests |
| **Performance** | queue latency |
| **Security** | quota redis keys |
| **Observability** | AI metrics |
| **Rollback** | NullProvider default |
| **Feature flag** | `ai_visualization_enabled` |
| **Acceptance** | Provider swap via config |
| **Evidence** | Unit tests |

---

## 30.13 — First AI Provider

| Field | Content |
|-------|---------|
| **Objective** | One production provider adapter |
| **Scope** | Implement compositing capability only |
| **Dependencies** | 30.12 + legal/privacy sign-off |
| **Modules** | `Providers/OpenAI*` or chosen vendor |
| **DB** | None |
| **Tests** | Contract tests with recorded fixtures |
| **Performance** | job duration p95 |
| **Security** | no PII in logs |
| **Observability** | failure rate alert |
| **Rollback** | disable flag |
| **Feature flag** | `ai_visualization_enabled` |
| **Acceptance** | Real image result on staging |
| **Evidence** | Staging job samples |

---

## 30.14 — 2.5D

| Field | Content |
|-------|---------|
| **Objective** | Tier-2 assets + perspective renderer adapter |
| **Scope** | Same document; new adapter optional |
| **Dependencies** | V1 GA |
| **Feature flag** | sub-flag or asset-driven |
| **Acceptance** | Toggle perspective without document migration |

---

## 30.15 — 3D

| Field | Content |
|-------|---------|
| **Objective** | Three.js/R3F lazy renderer; GLB assets |
| **Scope** | Y axis height; camera controls |
| **Dependencies** | 30.14 |
| **Feature flag** | `room_designer_3d_enabled` |
| **Acceptance** | Same design opens in 2D and 3D |

---

## 30.16 — AI Spatial Intelligence

| Field | Content |
|-------|---------|
| **Objective** | Layout suggestions as commands |
| **Scope** | SuggestedCommand pipeline |
| **Dependencies** | 30.13 + spatial core |
| **Acceptance** | AI cannot bypass constraints |

---

## 30.17 — AR

| Field | Content |
|-------|---------|
| **Objective** | USDZ/WebXR where supported |
| **Scope** | Separate AR module |
| **Dependencies** | Tier-4 assets |
| **Acceptance** | No AR deps in V1 bundle |

---

## 30.18 — Scale Architecture

| Field | Content |
|-------|---------|
| **Objective** | Evidence-driven infra scale |
| **Scope** | Only when metrics require Stage B–E |
| **Dependencies** | Production traffic data |
| **Acceptance** | Updated DEPLOYMENT_AND_SCALING with measured triggers |

---

## Post-V1 evaluation gates

- **Zustand:** after 30.5 if prop-drilling hurts — DECISION_LOG
- **Collision BLOCK vs WARN:** after UX study in 30.9
- **Item limit 50 vs 100:** after 30.10 profiling
