# Stage 30.2 — Pre-Implementation Audit (Face 1)

**Date:** 2026-09-19  
**Depends on:** Stage 30.1 **VERIFIED**

## Existing implementation

| Asset | Status |
|-------|--------|
| Spatial core | **VERIFIED** |
| `room.preset_id` on model | **VERIFIED** (unused until 30.2) |
| Sidebar `ROOM_BACKGROUNDS` ids | `majlis`, `salon`, `bedroom` — **reference only**, not modified |
| Renderer / UI presets | **NOT FOUND** |

## Architecture

- Presets live in `domain/room/presets.ts` (meters, RTL-neutral).
- `APPLY_ROOM_PRESET` command reuses constraint pipeline from 30.1.
- Custom rooms via `validateCustomRoom` / `createCustomRoomDocument`.
- `SET_ROOM_SIZE` clears `preset_id` (custom override).

## Performance

Preset lookup O(1) Map; apply preset = one command + O(n²) constraint check (unchanged).

## Security

Preset ids are not trusted from persistence without validation — unknown id rejected at apply/initialize.

## Edge cases

- Shrink room/preset with furniture outside → **BLOCK** (`ROOM_SIZE_CAUSES_VIOLATIONS`).
- Unknown preset id → `UNKNOWN_ROOM_PRESET`.
- Invalid custom dimensions → `INVALID_ROOM_DIMENSIONS`.

## Compatibility

Document schema unchanged (`schema_version: 1`); adds optional `preset_id` population.

## Out of scope

Fabric, sidebar wiring, i18n UI, DB, API.
