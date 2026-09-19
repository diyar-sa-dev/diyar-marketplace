# Stage 30.3 — Pre-Implementation Audit (Face 1)

**Date:** 2026-09-19  
**Depends on:** 30.1 + 30.2 **VERIFIED**

## Existing

- `ProductDetail.dimensions.{width,height,depth}` in `frontend/src/types/catalog.ts` — **VERIFIED** (cm at API boundary).
- Spatial `RoomDesignItem.snapshot` in meters — **VERIFIED**.
- No existing cm→m product adapter — **NOT FOUND**.

## Plan

- `adapters/catalogProductToSnapshot.ts` — pure mapping + fallbacks.
- `adapters/buildDesignItemFromProduct.ts` — builds item for `ADD_ITEM`.
- No HTTP, no React, no price/stock in snapshot.

## Fallback policy

Missing/zero dimensions → **1.0 m × 1.0 m** footprint (documented); height optional null.

## Out of scope

Catalog UI, API changes, cart, renderer.
