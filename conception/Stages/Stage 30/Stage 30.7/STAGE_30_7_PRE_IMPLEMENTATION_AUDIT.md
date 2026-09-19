# Stage 30.7 — Pre-Implementation Audit

**Date:** 2026-09-19

---

## Catalog identity

| Question | Answer |
|----------|--------|
| Canonical product ID | **UUID string** (`Product.id`, Laravel `HasUuids`) |
| API representation | `ProductCard.id`, `ProductDetail.id` — string UUID |
| Frontend spatial (before 30.7) | `product_id: number` — **planning mismatch**, not production data |
| Legacy integer IDs in DB | **None expected** — `room_designer_enabled` default false; no integer migration |
| Conversion layer | **None** — UUID passes through adapter unchanged (DEC-009) |

---

## Product DTO for Room Designer

From `ProductDetail` / `fetchProduct`:

- `id` (UUID)
- `name`
- `dimensions` (cm: width, depth, height)
- `images[0].url` → snapshot thumbnail
- Excluded: price, stock, slug (not in spatial snapshot)

Picker list uses `ProductCard` (search/browse); **full detail fetched on add** for authoritative dimensions.

---

## Dimensions boundary

Single adapter: `dimensionsCmToSnapshotMeters` in `adapters/catalogProductToSnapshot.ts` (cm → m, fallback footprint).

---

## Catalog querying

| Mode | API | When |
|------|-----|------|
| Browse | `GET /products?page&per_page=12` | Query &lt; 2 chars |
| Search | `GET /catalog/search?type=products&q&page&per_page=12` | Query ≥ 2 chars (300ms debounce) |

No new endpoints. Max **12** items per page in picker (`CATALOG_PICKER_PER_PAGE`).

---

## Placement

UX spec: room center — `defaultAddPosition()` deterministic offset grid.

---

## Backward compatibility

No persisted integer designs in production. Server **rejects** integer `product_id` after 30.7. Client parse rejects integer JSON.
