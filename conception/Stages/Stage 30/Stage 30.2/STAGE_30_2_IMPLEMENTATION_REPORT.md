# Stage 30.2 Implementation Report

## Status

**FACE 1: IMPLEMENTED**  
**FACE 2: PENDING → completed in certification doc**

## Files created

```text
domain/room/presets.ts
domain/room/customRoom.ts
domain/room/initializeFromPreset.ts
domain/room/index.ts
domain/room/presets.test.ts
```

## Files modified

```text
domain/commands/types.ts       (+ APPLY_ROOM_PRESET)
domain/commands/apply.ts       (+ preset apply; SET_ROOM_SIZE clears preset_id)
domain/commands/inverse.ts
application/commandDispatcher.ts
application/spatialEngine.ts   (+ createSpatialEngineFromPreset)
domain/index.ts
domain/errors.ts               (+ UNKNOWN_ROOM_PRESET)
```

## Presets (meters)

| id | AR label (metadata) | width × depth × height |
|----|---------------------|-------------------------|
| majlis | المجلس التراثي الأصيل | 5.5 × 6 × 3 |
| salon | صالون مودرن دافئ | 4.5 × 5 × 2.8 |
| bedroom | جناح النوم الفاخر | 4 × 4.5 × 2.7 |

## Tests

10 preset tests + full suite **253 pass**, typecheck **PASS**.

## Scope

No sidebar/PDP/backend changes.
