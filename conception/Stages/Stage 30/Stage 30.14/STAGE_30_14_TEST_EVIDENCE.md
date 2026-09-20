# STAGE 30.14 — Test Evidence

**Executed:** 2026-09-20 (local)

| Command | Result |
|---------|--------|
| `npm run test -- src/features/room-designer` | **105/105 PASS** (incl. Face 2.1) |
| `npm run build` (frontend) | **PASS** |
| `php artisan test` TryInRoom + Visualization | **46/46 PASS** |
| `php artisan test --filter=RoomDesign` | **21/21 PASS** |
| `npm run test -- validateTryInRoomFile mapTryInRoomSubmitError` | **5/5 PASS** (30.13 regression) |

### 30.14-focused new/extended tests

- `isometric25d.test.ts` (4)
- `projectionMode.test.ts` (2)
- `itemDisplayAsset.test.ts` (3)
- `perspective25d.perf.test.ts` (1)
- `fabricModifyToCommands.test.ts` — iso MOVE (1)
- `FabricRoomRenderer.interaction.test.ts` — iso drag (1)

## NOT VERIFIED

- Playwright E2E perspective toggle
- Real device mobile iso gestures
- Production tier-2 asset CDN load
- Canvas frame time under iso with 100 Fabric objects (only projection CPU smoke)
