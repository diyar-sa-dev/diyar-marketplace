# Asset Pipeline

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

---

## Tiers

| Tier | Use | V1 |
|------|-----|-----|
| 1 | 2D top-down PNG/WebP transparent | **Required** |
| 2 | 2.5D / isometric | Future 30.14 |
| 3 | GLB/GLTF | Future 30.15 |
| 4 | USDZ / AR | Future 30.17 |

---

## Tier 1 sourcing (V1)

**Priority order per product:**

1. Admin/vendor uploaded `room_plan_asset` (new media collection — **PREPARED** 30.7)
2. Derived from primary product image (automated crop — **optional**, not V1 blocker)
3. **Footprint fallback:** colored rectangle + dimensions from catalog (always available)

Do not block designer launch on 100% Tier-1 coverage.

---

## Storage & delivery

- Reuse existing product media pipeline (Spatie Media Library or project equivalent — **VERIFIED** pattern exists for product images)
- CDN/cache headers same as catalog thumbnails
- Designer loads **thumbnail/max 512 px** variant, not 4K originals

---

## `asset_ref` in snapshot

Store stable reference:

```text
media:{uuid}
or
products/{id}/room-plan.webp
```

Resolve URL at render time via existing media URL helper; snapshot URL is fallback if media removed.

---

## Validation

- Raster only for try-in-room uploads
- SVG for room plan assets: sanitize if ever allowed — **default disallow** in V1 (XSS/path risks)

---

## Performance

- Lazy load images on canvas object create
- Object cache in renderer (revoke on product change)
