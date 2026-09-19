# Pre–Stage 30.11 Foundation Hardening Audit

**Date:** 2026-09-19  
**Scope:** Stages 30.1–30.10 (Room Designer)  
**Certification:** **VERIFIED WITH LIMITATIONS**

---

## 1. Executive summary

Independent re-audit of code, tests, and configuration found **one P1 interaction/state defect** (session recreated on every parent engine update, clearing selection and risking drift). Fixed with `sessionResetKey` + regression test. Autosave **409** confirmed **no retry loop**. Domain layer remains free of React/Fabric/HTTP. PHPUnit 21 / Vitest 81 green; production build OK; Fabric lazy chunk isolated. **E2E and real devices NOT VERIFIED** in this session.

**30.11 entry:** **READY WITH LIMITATIONS** (no open P0/P1 after fixes).

---

## 2. Current architecture (as implemented)

```text
/profile/room-designer → RoomDesignerPage (lazy)
    → RoomDesignerShell (RTL UI, catalog, autosave, cart)
        → RoomDesignerCanvasHost (session ref, ResizeObserver viewport)
            → createRoomRenderer() [dynamic import]
                → FabricRoomRenderer
                    → object:modified → fabricModifyToCommands
                    → DesignerSession.applyCommands → spatial engine
        → CatalogPanel → addCatalogProductToSession → ADD_ITEM
        → useRoomDesignAutosave → PUT /room-designs/{id}
        → useRoomDesignAddToCart → POST add-to-cart

Backend: RoomDesignDocumentService → room_designs (JSON, version)
         RoomDesignCartService → CartService::addItem
Middleware: room-designer.enabled + Sanctum + policy (404 IDOR)
```

Matches certified 30.1–30.8 architecture; 30.9 mobile shell; 30.10 route + E2E spec.

---

## 3. Stage verification matrix

| Stage | Status | Evidence |
|-------|--------|----------|
| 30.1 Spatial core | PASS | Vitest domain/application; no forbidden imports in `domain/` |
| 30.2 Presets | PASS | `presets.test.ts`, majlis/salon/bedroom meters |
| 30.3 Catalog snapshot | PASS | `catalogProductToSnapshot.test.ts`, cm→m boundary |
| 30.4 Renderer | PASS WITH LIMITATION | Lazy chunk; mount/destroy tests; no leak test at 20× nav |
| 30.5 Interaction | PASS | `fabricModifyToCommands`, interaction test, BATCH history |
| 30.6 Persistence | PASS | PHPUnit CRUD, 409, IDOR, query bounds, guest 401 |
| 30.7 Catalog | PASS WITH LIMITATION | Panel + search hook; stale product UI deferred |
| 30.8 Cart | PASS | Aggregate qty, IDOR, N+1 bounded tests |
| 30.9 Mobile | PASS WITH LIMITATION | Shell/sheet/pinch; **REAL DEVICE NOT VERIFIED** |
| 30.10 Quality | PASS WITH LIMITATION | Bundle evidence; **E2E NOT RUN** locally |

---

## 4. Findings (Face 1)

| ID | Sev | Finding | Root cause | Fix | Test |
|----|-----|---------|------------|-----|------|
| F-001 | **P1** | Selection cleared after each committed move | `RoomDesignerCanvasHost` reset `DesignerSession` on every `initialEngine` prop change | Session reset only when `sessionResetKey` (design id) changes | `RoomDesignerCanvasHost.session.test.tsx` |
| F-002 | P2 | Create design retry blocked after API error | `createStarted` never reset | `onError` resets ref | Manual |
| F-003 | P3 | Reports claimed 80 tests | Count drift | Updated to 81 | N/A |

No P0 found in code review. Stale-product UI, full canvas E2E, device matrix remain documented limitations (not blockers for 30.11 **foundation**).

---

## 5. Exception / failure matrix

| Failure | Backend | Frontend | User state | Recovery |
|---------|---------|----------|------------|----------|
| Unauthorized 401 | Reject | parseApiError | Error page / API fail | Login |
| Forbidden 403 (flag) | Middleware | RoomDesignerPage message | “غير متاح” | Enable flag (ops) |
| Missing design 404 | findOwned → 404 | Error + link profile | Not loaded | Navigate away |
| Conflict 409 | `version_conflict` | autosave `CONFLICT` | “تعارض إصدار”; dirty stays | Reload/merge (manual) |
| Validation 422 | validation_failed | ERROR sync (save) | dirty; not “saved” | Fix document |
| Payload 413 | payload_too_large | ERROR | dirty | Reduce items |
| Rate 429 | throttle | ERROR / toast | dirty | Wait |
| Server 500 | 5xx | ERROR | dirty | Retry on edit (markDirty) |
| Network | no response | ERROR | dirty | Retry on edit |
| Deleted product (save) | 422 invalid product | save fail | ERROR | Remove item |
| Renderer load fail | N/A | canvas empty | **NOT VERIFIED** UI | Refresh |
| Corrupt document | 422 | load error | Error UI | — |
| Browser resize | N/A | resizeViewport | Document unchanged | — |
| 409 retry loop | N/A | **No auto-retry** | CONFLICT | User action |

---

## 6. Security assessment

| Check | Result |
|-------|--------|
| IDOR GET/PUT/DELETE/cart | PASS — PHPUnit 404 |
| Guest API | PASS — 401 test |
| Feature flag off | PASS — 403 |
| Mass assignment | PASS — FormRequest + service layer |
| Client price/stock in cart | PASS — server CartService |
| Logging | PASS — metadata only (`room_design_id`, `user_id`, counts) |

---

## 7. Performance assessment

| Area | Result |
|------|--------|
| Domain 10–100 items | PASS — `spatial.perf.test.ts` |
| Autosave coalesce | PASS — 25 markDirty → 1 save |
| Fabric bundle | PASS — separate chunk ~292 KiB min |
| API query bounds | PASS — PHPUnit list/show |
| Integrated UI 100-item save | NOT VERIFIED |

---

## 8. Accessibility assessment

| Item | Result |
|------|--------|
| Modal roles | PASS |
| Focus trap + Escape | PASS — `useModalDialog` + tests |
| Keyboard canvas editing | NOT VERIFIED / not claimed |
| Touch targets | PASS WITH LIMITATION — min-h-11 |

---

## 9. E2E assessment

| Item | Result |
|------|--------|
| `room-designer.spec.ts` exists | PASS |
| Executed this audit | **NOT VERIFIED** (backend :8000 unreachable) |

---

## 10. Release impact

- **Production flag:** remain `DIYAR_FEATURE_ROOM_DESIGNER_ENABLED=false`
- **Deploy:** includes new route; inert when flag off
- **30.11:** Try-in-Room may add upload/jobs **without** changing spatial document schema (per roadmap)

---

## 11. 30.11 readiness

**READY WITH LIMITATIONS**

Acceptable before 30.11:

- Spatial/persistence/cart boundaries stable
- P1 session lifecycle fixed
- Security/autosave conflict behavior evidenced

Must track during 30.11:

- CI Playwright green
- Private image storage must not bypass RoomDesignDocument authority
- E2E/device gaps

---

## 12. Validation run (post-fix)

| Suite | Result |
|-------|--------|
| Vitest room-designer | **81/81 PASS** |
| PHPUnit RoomDesign | **21/21 PASS** |
| Production build | **PASS** |
| Typecheck (full project) | NOT RUN (out of scope if unrelated failures) |
| Playwright room-designer | **NOT VERIFIED** |
