# STAGE 30.14 — ENTERPRISE FACE 2.1 FINAL CERTIFICATION

**Date:** 2026-09-20

## A. Verdict

**VERIFIED WITH LIMITATIONS**

Face 2.1 found and fixed **two P1** interaction/renderer defects; **P0/P1 now 0** after fix loop.

## B. P0 / P1

```text
P0: 0
P1: 0
```

### Fixed in Face 2.1 (were P1)

| ID | Issue | Fix |
|----|-------|-----|
| F214-P1a | `resizeViewport` re-render omitted `projection` → iso snapped back to top-down floor rect | Pass `currentProjection` in resize render |
| F214-P1b | Top-down Fabric items used footprint top-left as center (`originX/Y: center`) | Position rects at `metersToCanvasPoint` center |

### Fixed in Face 2.1 (P2)

| ID | Issue | Fix |
|----|-------|-----|
| F214-P2a | `destroy()` left orphaned `<canvas>` DOM nodes | `mountContainer.replaceChildren()` on destroy |
| F214-P2b | Tier-2 `tier2:javascript:` could resolve as URL hint | `isAllowedTier2HttpUrl` — https/http only |

## C. Findings (significant)

- Round-trip projection: **numerically verified** (`projectionRoundTrip.property.test.ts`, scales 20–320, grid of X/Z).
- View toggle: **does not alter** serialized document or undo semantics (`viewStatePersistence.test.ts`).
- Render-only projection alternation: **no domain drift** (30 cycles).
- 30.13 privacy: **46/46**, gate unchanged by 30.14 diff scope.

## D. Architecture

Clean — domain unchanged; projection in `ViewState` + renderer only.

## E. Projection

| Mode | Forward | Inverse | Tolerance |
|------|---------|---------|-----------|
| `top_down` | x×scale, z×scale | divide | ≤1e-4 m (property tests) |
| `isometric_25d` | dimetric ISO_X/ISO_Y | linear solve | ≤1e-4 m (property tests) |

Non-finite inputs → `{0,0}` world (fail-safe, tested).

## F. Interaction

- Top-down center at (2,2) @ 80px/m → Fabric (160,160) — **tested**
- Iso drag inverse → domain MOVE — **tested**
- Rotation normalized via `normalizeRotationDeg` — **405° → 45° tested**
- One `object:modified` → command batch — unchanged 30.5 pattern

## G. Persistence

- `schema_version` **1**; serialize JSON contains **no** projection/canvas keys.
- Toggle is React-only; autosave not triggered by toggle (no session mutation).

## H. Performance

| Benchmark | Result | Claim |
|-----------|--------|-------|
| Projection 100 items | `<2ms` batch (`perspective25d.perf.test.ts`) | **VERIFIED** (CPU only) |
| Fabric 100-object frame time | Not measured in browser | **NOT VERIFIED** |
| Full scene `canvas.clear()` each render | By design in V1 renderer | **Documented P2** |

## I. Security

- Tier-2 URL: http/https only; `javascript:`/`data:` rejected — **tested**
- No new backend fields; RoomDesign validator unchanged
- Malformed numeric on projection path — safe zero — **tested**

## J. Regression

| Suite | Result |
|-------|--------|
| Vitest room-designer | **105/105** |
| PHPUnit RoomDesign | **21/21** |
| PHPUnit TryInRoom + Visualization | **46/46** |

## K. E2E

**NOT VERIFIED**

## L. Mobile

- Touch/pinch architecture unchanged (30.9) — **automated tests pass**
- Real-device 2.5D — **NOT VERIFIED**

## M. Tier-2 Assets

**Implemented:** `tier2:` ref parsing + http(s) URL gate + fill hint when URL resolves.  
**NOT implemented:** async Fabric image paint, CDN load failure UX — **by 30.14 scope**.

## N. Stage 30.13 Privacy

```text
legal approval = PENDING (RoomDesigner/AI_VISUALIZATION_LEGAL_APPROVAL.md)
external transfer = BLOCKED
privacy gate = FAIL-CLOSED (OpenAiLegalGateIntegrationTest in suite)
```

## O. Git

```text
Committed: NO
```

## P. Next Stage

**30.15 — 3D** (not started)

---

## Test evidence matrix (Face 2.1)

| Area | Test | Result | Evidence | Limitation |
|------|------|--------|----------|------------|
| Projection | round-trip | PASS | `projectionRoundTrip.property.test.ts` | — |
| Projection | boundaries / NaN | PASS | property + isometric tests | — |
| Interaction | inverse drag iso | PASS | `FabricRoomRenderer.interaction.test.ts` | — |
| Interaction | top-down center | PASS | `FabricRoomRenderer.projection.test.ts` | — |
| Rotation | normalize 405° | PASS | `fabricModifyToCommands.test.ts` | Visual iso rotation approximate |
| History | toggle + undo | PASS | `viewStatePersistence.test.ts` | — |
| Persistence | serialize invariant | PASS | same | — |
| Renderer | resize + iso | PASS | projection test | — |
| Memory | mount/destroy×5 | PASS | DOM canvas count 0 | jsdom only |
| Assets | tier2 failure | PASS | `itemDisplayAsset.test.ts` | No network fetch |
| Feature flag | env true/false | PASS | `roomDesignerFeatures.test.ts` | — |
| RTL | Arabic shell | PASS | existing `RoomDesignerShell.test.tsx` | Canvas LTR neutral |
| Mobile | touch | PASS | viewport pinch unit test | No device |
| Security | malformed numeric | PASS | projection inverse guards | — |
| Regression | Room Designer | PASS | 105 tests | — |
| Regression | TryInRoom | PASS | 46 tests | — |
| Privacy | OpenAI pending | PASS | 46 tests incl. gate | — |
| Build | production | NOT RE-RUN this pass | prior PASS | Re-run before release |
| E2E | Playwright | NOT VERIFIED | — | — |
| Renderer perf | 100 Fabric objects | NOT VERIFIED | — | Projection ≠ render |
