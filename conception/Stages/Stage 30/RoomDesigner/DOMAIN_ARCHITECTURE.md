# Domain Architecture (Spatial Engine)

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)  
**Includes:** RoomDesignDocument, commands, constraints, geometry (renderer-independent).

---

## Module layout (frontend + shared test package)

Recommended paths (adjust in 30.1 if repo convention differs):

```text
frontend/src/features/room-designer/
  domain/
    document.ts          // types + schema_version
    units.ts             // cmToM, mToCm
    geometry/            // AABB, OBB approx, pointInRect
    commands/            // applyCommand, Command union
    constraints/         // room bounds, collision WARN/BLOCK
    history/             // undo stack max 50
    store.ts             // pure reducer over document
  adapters/              // catalog boundary, API DTO
  renderer/              // Fabric adapter only
  ui/                    // React components
```

Optional: extract `domain/` to `packages/spatial-core` if backend PHP validation mirrors JSON schema — **PREPARED**, not V1 blocker.

---

## RoomDesignDocument (v1)

```typescript
// Conceptual — implementation in 30.1
interface RoomDesignDocument {
  schema_version: 1;
  room: {
    preset_id?: string | null;
    width_m: number;
    depth_m: number;
    height_m?: number | null;
    origin?: 'corner' | 'center'; // default corner: (0,0) inner corner
  };
  items: RoomDesignItem[];
}

interface RoomDesignItem {
  id: string; // uuid client-generated
  product_id: number;
  variant_key?: string | null;
  position_m: { x: number; z: number };
  rotation_deg: number; // yaw around Y, 0..360 normalized
  locked: boolean;
  layer: number;
  snapshot: {
    name: string;
    width_m: number;
    depth_m: number;
    height_m?: number | null;
    thumbnail_url?: string | null;
    asset_ref?: string | null; // Tier-1 media key or URL path
  };
}
```

**Migrations:** `schema_version` bump + `migrateDocumentV1toV2()` functions; never silent reinterpretation.

---

## Product spatial snapshot

**Include:** product_id, variant, display name, dimensions (m), asset ref, thumbnail  
**Exclude:** price, stock, slug (slug may be fetched live for links only)

On load: validate product still exists; mark `item.status = 'missing' | 'ok'` in UI model only (not persisted as truth).

---

## Command system

All mutations:

```text
User/AI suggestion → Command → ConstraintEngine → apply → new Document → Renderer.render()
```

| Command | Payload summary |
|---------|-----------------|
| `ADD_ITEM` | product snapshot + position |
| `REMOVE_ITEM` | item id |
| `MOVE` | id, position_m |
| `ROTATE` | id, rotation_deg |
| `RESIZE` | id, width_m, depth_m (only if product allows — V1: **optional**, default fixed catalog dims) |
| `DUPLICATE` | id, offset |
| `LOCK` / `UNLOCK` | id |
| `SET_ROOM_SIZE` | width_m, depth_m, height_m? |
| `CLEAR_ROOM` | — |
| `SET_GRID` | enabled, step_m (0.1) |
| `BATCH` | commands[] (single history entry) |

AI (future): returns **SuggestedCommand[]** → same pipeline.

---

## Constraint engine (V1)

| Rule | Mode | Default |
|------|------|---------|
| Room boundary | BLOCK | on |
| Item-item intersection | WARN | on (re-evaluate BLOCK after UX test) |
| Grid snap | optional | off, step 0.1 m |
| Locked items | BLOCK moves | on |

Geometry: **AABB** in XZ for axis-aligned; for rotation use **OBB approximation** (four corners) when |rotation| mod 90 ≠ 0.

Pure functions only — full matrix in [`TESTING_SPECIFICATION.md`](TESTING_SPECIFICATION.md).

---

## Undo / redo

- Max **50** command entries (not full document snapshots unless command inverse expensive)
- Coalesce: drag end = one MOVE (pointer down/up), not per move event

---

## Coordinate system

- **X:** horizontal (width axis)
- **Z:** depth into room
- **Y:** reserved (height / 3D)
- Room rectangle: `[0, width_m] × [0, depth_m]` for `origin: corner`

Negative coordinates rejected by constraint engine.

---

## Catalog boundary

```text
ProductDetailResource (cm) → cmToM() → snapshot dimensions in document
```

Never store cm inside `RoomDesignDocument` fields (except optional deprecated — **forbidden**).
