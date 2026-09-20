# STAGE 30.15 — Implementation Report

**Date:** 2026-09-20  
**Roles:** Senior A (engineering) + Senior B (PM review)

## Roadmap authority

Source: `conception/Stages/Stage 30/RoomDesigner/IMPLEMENTATION_ROADMAP.md` §30.15

| Field | Requirement |
|-------|-------------|
| Objective | Three.js/R3F lazy renderer; GLB assets |
| Scope | Y axis height; camera controls |
| Feature flag | `room_designer_3d_enabled` / `VITE_ROOM_DESIGNER_3D_ENABLED` |
| Acceptance | Same design opens in 2D and 3D |

## Delivery checklist (Senior B)

| Requirement | Implementation | Test | Evidence | Status |
|-------------|----------------|------|----------|--------|
| Lazy 3D renderer | `createRoomRenderer` → dynamic `ThreeRoomRenderer` chunk | `createRoomRenderer.test.ts` | Build: `ThreeRoomRenderer-*.js`, `three.module-*.js` separate from main | **DONE** |
| GLB assets | `tier3:` + `resolveGlbAssetUrl` (http/https) | `resolveGlbAssetUrl.test.ts` | `ASSET_PIPELINE.md` tier 3 | **DONE** |
| Y height | `worldMapping.ts` — domain elevation → Three Y | `worldMapping.test.ts` | DEC-012 | **DONE** |
| Camera controls | OrbitControls in `ThreeRoomRenderer` (view-only) | Manual + architecture review | No session API for camera | **DONE** |
| Same document 2D/2.5D/3D | Shared `DesignerSession`; remount on backend switch only | `viewStatePersistence.test.ts`, projection tests | No schema change | **DONE** |
| Feature flag | `isRoomDesigner3dEnabled`, backend `diyar.php` | `roomDesignerFeatures.test.ts` | `.env.example` both sides | **DONE** |
| WebGL fallback | Unavailable UI `room-designer-3d-unavailable` | `ThreeRoomRenderer.test.ts` | — | **DONE** |
| Privacy / AI | No 3D → provider path | PHPUnit 46/46 unchanged visualization | No new imports in TryInRoom | **DONE** |

## Architecture

```text
RoomDesignDocument (domain, meters X/Z, schema v1)
        ↓
DesignerSession + spatial engine (unchanged)
        ↓
ViewState.projection: top_down | isometric_25d | room_3d
        ↓
createRoomRenderer(projection)
        ├─ FabricRoomRenderer (2D / 2.5D)
        └─ ThreeRoomRenderer (lazy three.js + GLTFLoader chunk)
```

**DEC-012:** Vanilla Three.js behind existing `RoomRenderer` contract (same imperative `mount` pattern as Fabric). React Three Fiber not required for contract compliance; Three is dynamically imported inside the adapter.

### Coordinate mapping

| Domain | Three.js world |
|--------|----------------|
| `position_m.x` | X (floor) |
| `position_m.z` | Z (floor) |
| `height_m` / elevation snapshot | Y (up) |
| Yaw (degrees, domain) | Rotation about Y |

Center-anchor semantics preserved via box/GLB placement using footprint width/depth/height from snapshot.

### Assets

- Prefix: `tier3:` on `asset_ref` → HTTPS URL resolution (browser fetch only).
- Missing/invalid URL → box fallback mesh; no server-side fetch (no SSRF surface added).
- In-memory GLB cache (max 32 entries) with clone-on-use for scene graph.

### Explicitly out of scope (not roadmap 30.15)

- 3D drag → domain MOVE commands (selection + orbit only in 3D).
- React Three Fiber layer.
- Persisted camera or 3D-specific document fields.
- GLB byte/triangle enforcement (documented P2).

## Files (primary)

- `frontend/src/features/room-designer/renderer/three/ThreeRoomRenderer.ts`
- `frontend/src/features/room-designer/renderer/three/worldMapping.ts`
- `frontend/src/features/room-designer/renderer/three/glbModelCache.ts`
- `frontend/src/features/room-designer/adapters/resolveGlbAssetUrl.ts`
- `frontend/src/features/room-designer/renderer/projectionMode.ts`
- `frontend/src/features/room-designer/renderer/createRoomRenderer.ts`
- `frontend/src/features/room-designer/ui/RoomDesignerCanvasHost.tsx`
- `frontend/src/features/room-designer/ui/RoomDesignerShell.tsx`
- `frontend/src/features/room-designer/config/roomDesignerFeatures.ts`

## Face 1 status

```text
PREPARED FOR FACE 2 → Face 2 completed — see STAGE_30_15_FACE2_AUDIT.md
```
