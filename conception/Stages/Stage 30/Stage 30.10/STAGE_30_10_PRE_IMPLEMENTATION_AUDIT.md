# Stage 30.10 — Pre-Implementation Audit

**Date:** 2026-09-19

## Architecture boundaries (verified in code)

| Boundary | Implementation | Drift risk |
|----------|----------------|------------|
| Domain | `features/room-designer/domain/` — meters, UUID `product_id`, commands | Low |
| Persistence | `room_designs` API + `RoomDesignAutosave` / `useRoomDesignAutosave` | Low |
| Catalog | `CatalogPanel` + `addCatalogProductToSession` → `ADD_ITEM` | Sidebar mock not wired |
| Cart | `RoomDesignCartService` → `CartService::addItem` | Low |
| Renderer | Lazy `FabricRoomRenderer` — dynamic import | Low |
| Mobile | `RoomDesignerShell` + viewport pinch (no domain zoom) | Low |

## API

- Routes: `/api/v1/room-designs` + `add-to-cart` under `room-designer.enabled` + Sanctum
- Auth: policy owner-only (404 for IDOR)
- Validation: `RoomDesignValidator` — schema, item cap (100), payload bytes, product visibility
- Rate limits: `room-design-list`, `room-design-save` throttles
- Errors: `version_conflict` 409, `validation_failed` 422, payload 413

## Database

- `room_designs`: JSON `document`, `version`, soft deletes, `item_count` denormalized
- List endpoint: lightweight items **without** full document (PHPUnit asserted)

## Frontend

- Route added: `/profile/room-designer` (+ `:designId`) — lazy `RoomDesignerPage`
- Fabric: separate chunk `FabricRoomRenderer-*.js` (~292 KiB min / ~88 KiB gzip) — **not** in `main.marketplace`
- Autosave: 2500 ms debounce; flush on unmount
- Feature flag: **backend only** default `DIYAR_FEATURE_ROOM_DESIGNER_ENABLED=false`

## Testing inventory (pre-30.10)

| Layer | Coverage |
|-------|----------|
| Vitest room-designer | 77 → 80 after 30.10 hardening |
| PHPUnit RoomDesign | 20 → 21 |
| Playwright room-designer | **Missing** |
| Real device | **NOT VERIFIED** (30.9) |
| Full canvas drag E2E | **NOT VERIFIED** |

## Security surface

- IDOR: PHPUnit + new guest test
- Mass assignment: server-controlled `user_id`, `version`
- Client price/stock: not accepted on add-to-cart
- Malformed JSON / oversize: validator + tests

## Gaps targeted in 30.10

1. Routed E2E + API E2E spec
2. Modal focus trap (catalog sheet, cart review)
3. Autosave conflict code propagation
4. Production bundle evidence for Fabric isolation
5. Quality gate matrix + production recommendation
