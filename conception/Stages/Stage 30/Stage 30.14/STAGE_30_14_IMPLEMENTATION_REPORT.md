# STAGE 30.14 — Implementation Report

**Date:** 2026-09-20  
**Objective (roadmap):** Tier-2 assets + perspective renderer adapter; same document; toggle without migration.

## Requirement matrix

| Requirement | Existing (pre-30.14) | Delivered | Tests |
|-------------|---------------------|-----------|-------|
| Same `RoomDesignDocument` / schema | schema v1 | Unchanged | serialization adversarial (unchanged) |
| Perspective renderer adapter | Top-down only | `ViewState.projection` + `projectionMode` / `isometric25d` | `projectionMode.test.ts`, `isometric25d.test.ts` |
| Fabric boundary preserved | `RoomRenderer` | Same interface; floor polygon + iso item layout in `FabricRoomRenderer` | `FabricRoomRenderer.interaction.test.ts` |
| Inverse projection for drag | `canvasPointToMeters` top-down | Mode-aware inverse in `fabricModifyToCommands` | `fabricModifyToCommands.test.ts`, iso interaction test |
| Tier-2 asset refs | `asset_ref` field only | `tier2:` prefix + `resolveItemRenderImageUrl` | `itemDisplayAsset.test.ts` |
| Feature sub-flag | None | `VITE_ROOM_DESIGNER_25D_ENABLED` + `DIYAR_FEATURE_ROOM_DESIGNER_25D_ENABLED` | Shell toggle hidden when flag off |
| RTL / canvas neutral | Stage 30.9 pattern | Canvas host `dir="ltr"` unchanged | existing shell tests |
| No AI bypass | 30.13 gate | No backend/frontend changes to visualization | PHPUnit 46/46 |

## Architecture

```text
RoomDesignDocument (domain, meters X/Z)
        ↓
DesignerSession / commands (unchanged)
        ↓
RoomDesignerCanvasHost (React — projection in local state)
        ↓
ViewState { scalePxPerM, projection? }
        ↓
FabricRoomRenderer
        ↓
projectionMode → top_down | isometric_25d
        ↓
Fabric canvas
```

Presentation-only elevation offset uses existing snapshot `height_m` (catalog); **not** written to document.

## Not in scope (30.14)

- Async Fabric image paint for tier-2 URLs (URL resolution only; fill hint when tier2 present)
- Full OBB isometric rotation (center + footprint projection; domain rotation_deg unchanged)
- 3D / Three.js (30.15)
- Schema bump / migration

## Configuration

| Flag | Layer |
|------|--------|
| `VITE_ROOM_DESIGNER_25D_ENABLED=true` | Show toolbar perspective toggle |
| `DIYAR_FEATURE_ROOM_DESIGNER_25D_ENABLED` | Server mirror (ops/docs; no API behavior change in 30.14) |
