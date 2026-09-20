# STAGE 30.15 — Face 2 Audit

**Date:** 2026-09-20  
**Reviewer:** Senior B (adversarial)

## Severity gate (final)

| P0 | P1 |
|----|-----|
| 0 | 0 |

## Attack matrix

| Area | Attack | Result |
|------|--------|--------|
| Architecture | Three.js in `domain/` | **PASS** — no `three` imports under `domain/` |
| Architecture | R3F in application session | **PASS** — imperative `ThreeRoomRenderer` only |
| Domain | Renderer IDs persisted | **PASS** — schema v1; no camera in JSON |
| GLB | `javascript:` / `data:` URL | **PASS** — `resolveGlbAssetUrl` rejects non http(s) |
| URLs | Arbitrary protocol tier3 | **PASS** — unit tests |
| Memory | Unmount without dispose | **PASS** — `destroy()` disposes renderer, controls, floor/item meshes; rAF stopped |
| Memory | Unbounded GLB cache | **PASS** — max 32, eviction on insert |
| GPU | Context loss crash | **PARTIAL** — fallback when WebGL missing; context-loss handler **P2** (no auto-recover UI) |
| Performance | Claim 60 FPS | **NOT VERIFIED** — no GPU benchmark run |
| Interaction | Orbit moves furniture | **PASS** — pointer on canvas: raycast select only; no 3D drag → domain |
| Interaction | 3D move without commands | **PASS** — no MOVE from Three handlers |
| Mapping | X/Z swap | **PASS** — `worldMapping.test.ts` |
| Scale | GLB assumed meters | **PASS** — normalize using snapshot `width_m`/`depth_m`/`height_m` vs model bounds |
| Rotation | Accumulated drift | **PASS** — rotation set from domain each sync, not incremented |
| Selection | Three uuid as item id | **PASS** — `userData.itemId` mapping layer |
| Persistence | Camera dirty save | **PASS** — camera not in session; viewStatePersistence tests |
| History | View toggle undo | **PASS** — projection outside session |
| Autosave | Mode switch save | **PASS** — no document mutation on projection change |
| Mobile | Touch orbit | **NOT VERIFIED** — OrbitControls default; no real device |
| RTL | World mirrored | **PASS** — neutral world; UI RTL unchanged |
| Security | SSRF via backend GLB | **PASS** — browser-only load |
| Security | Private asset bypass | **PASS** — same catalog URLs as 2D; no new API |
| Privacy | 3D → OpenAI | **PASS** — no code path; PHPUnit visualization 46/46 |
| Regression | 2D/2.5D Fabric | **PASS** — projection tests + 117 Vitest room-designer |
| Regression | RoomDesign API | **PASS** — PHPUnit 21/21 |
| Build | Three in main chunk | **PASS** — lazy chunks ~688 KiB three + ~47 KiB GLTFLoader |

## Findings closed in Face 2

None required code fixes beyond Face 1 baseline; Senior B verified remount boundary (`rendererBackendKey`), tier3 URL gate, and WebGL-unavailable test path.

## Accepted limitations (P2/P3)

| ID | Sev | Finding | Impact | Mitigation | Future |
|----|-----|---------|--------|------------|--------|
| F15-01 | P2 | No 3D pointer drag → MOVE | Users edit layout in 2D/2.5D only | Document UX; orbit for inspection | 30.x interaction if product asks |
| F15-02 | P2 | No GLB file size / triangle budget | Large models may stall GPU | https-only + cache cap; box fallback | Asset pipeline limits |
| F15-03 | P2 | WebGL context loss not recovered in UI | Blank canvas until remount | User can switch to 2D | `webglcontextlost` handler |
| F15-04 | P3 | R3F not used (roadmap mentions R3F) | Naming only | Three.js satisfies lazy renderer goal | Optional R3F wrapper later |
| F15-05 | P3 | Real-device 3D FPS/touch | Unknown mobile UX | Flag off by default | Device QA campaign |
| F15-06 | P3 | E2E 3D mode | No Playwright WebGL proof | Vitest + manual | Extend `room-designer.spec.ts` |

## Senior B sign-off

Face 2 complete with **P0=0, P1=0**. Remaining items classified P2/P3 only.
