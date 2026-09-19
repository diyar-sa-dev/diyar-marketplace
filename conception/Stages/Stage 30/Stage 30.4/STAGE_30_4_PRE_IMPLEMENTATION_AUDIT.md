# Stage 30.4 — Pre-Implementation Audit (Face 1)

**Date:** 2026-09-19  
**Depends on:** 30.1–30.3 **VERIFIED**  
**Dependency gate:** DEC-003 Fabric — **proceeding** with install + chunk measurement (implicit unblock via pipeline continuation).

## Scope (official roadmap)

- `RoomRenderer` adapter interface
- Lazy `fabric` import — **no** global app dependency
- Mount, render document, selection events
- **Not in 30.4:** sidebar refactor, drag/move commands (30.5), routes, persistence

## Architecture placement

```text
frontend/src/features/room-designer/renderer/
  types.ts
  projection.ts          # pure m↔px (testable)
  createRoomRenderer.ts  # lazy factory
  fabric/FabricRoomRenderer.ts
```

Domain must not import `renderer/` or `fabric`.

## Performance

- Dynamic import isolates Fabric chunk from main bundle.
- Re-render full scene V1 (≤100 items) — acceptable for 30.4; optimize later if measured.

## Security

Renderer loads product thumbnail URLs only when passed in snapshot — no new trust boundary.

## Risks

- Fabric + jsdom in tests — use projection unit tests + optional integration with canvas mock.
- Item center anchor (DEC-006) — enforced in projection layer.
