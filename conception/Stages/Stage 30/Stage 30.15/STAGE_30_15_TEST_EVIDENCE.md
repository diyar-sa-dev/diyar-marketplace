# STAGE 30.15 — Test Evidence

**Date:** 2026-09-20  
**Environment:** Windows 10, local dev, Node vitest 3.2.7, PHP artisan test

## Frontend — Vitest (`src/features/room-designer`)

```text
Test Files  38 passed (38)
Tests       118 passed (118)
```

Command:

```bash
cd frontend && npm run test -- src/features/room-designer
```

### New / extended coverage (30.15)

| File | Focus |
|------|--------|
| `renderer/three/worldMapping.test.ts` | Domain → Three coordinates |
| `adapters/resolveGlbAssetUrl.test.ts` | tier3 + URL scheme gate |
| `renderer/three/ThreeRoomRenderer.test.ts` | WebGL unavailable fallback |
| `renderer/projectionMode.test.ts` | `room_3d`, backend keys |
| `renderer/createRoomRenderer.test.ts` | Lazy Three backend |
| `config/roomDesignerFeatures.test.ts` | `VITE_ROOM_DESIGNER_3D_ENABLED` |

## Backend — PHPUnit

```text
TryInRoom + Visualization: 46/46 PASS
RoomDesign filter:         21/21 PASS
```

Commands:

```bash
cd backend
php artisan test tests/Unit/Jobs/TryInRoom tests/Unit/Services/TryInRoom tests/Feature/Api/V1/TryInRoom tests/Unit/Services/Visualization
php artisan test --filter=RoomDesign
```

## Build

```text
npm run build — PASS (2026-09-20)
```

Notable chunks (lazy, not in main marketplace entry):

- `ThreeRoomRenderer-*.js` (~8 KiB min + gzip)
- `three.module-*.js` (~688 KiB min)
- `GLTFLoader-*.js` (~47 KiB min)
- `OrbitControls-*.js` (~19 KiB min)
- `FabricRoomRenderer-*.js` unchanged path (~293 KiB min)

## E2E

```text
NOT VERIFIED — Playwright room-designer spec not run with 3D flag in this session
```

## Performance (3D)

```text
NOT VERIFIED — no frame time / FPS / GPU memory measurement recorded
```

## Mobile (3D)

```text
Real-device 3D: NOT VERIFIED
```
