# Stage 30.9 — Pre-Implementation Audit

**Date:** 2026-09-19

## Layout

| Viewport | Behavior |
|----------|----------|
| Desktop (`lg` ≥ 1024px) | Two-column grid: `CatalogPanel` aside + flexible canvas (`RoomDesignerShell`) |
| Tablet / mobile (< 1024px) | Full-width canvas priority; catalog in bottom sheet overlay |
| Minimum width | 320px practical (Tailwind `p-4` modals); canvas min height 220px |
| Canvas sizing | `ResizeObserver` on host (`useContainerSize`); Fabric `resizeViewport` — not fixed 640×480 |
| Sidebar | No separate Ai Studio sidebar in certified stack; shell toolbar + sheet |

**Breakpoints:** Reuse Tailwind default `lg` = **1024px** (`ROOM_DESIGNER_LG_BREAKPOINT_PX`), consistent with `MobileBottomNav` (`md:hidden`) and modal `sm:` patterns elsewhere.

## Interaction

| Input | Path |
|-------|------|
| Pointer / mouse | Fabric drag → `object:modified` → `fabricModifyToCommands` → `DesignerSession` |
| Touch drag | Same Fabric path; `touch-action: none` scoped to canvas container only |
| Rotation | Fabric native controls; larger `touchCornerSize` when `touchFriendly` |
| Selection | Fabric selection events → `select` interaction |
| Viewport pinch / ctrl+wheel | `attachViewportPinchZoom` → Fabric `zoomToPoint` only — **no** domain commands |
| Page scroll | Allowed outside canvas; canvas surface blocks browser scroll while manipulating |

## UI

| Surface | Mobile notes |
|---------|----------------|
| Catalog | `CatalogPanel` unchanged API; min-h-11 controls; sheet on mobile |
| Room controls | Toolbar undo/redo/delete with 44px targets |
| Save | Existing `RoomDesignAutosave` via `useRoomDesignAutosave`; flush on unmount |
| Cart | `AddToCartReviewModal` — `items-end` + `pb-safe` on narrow viewports |
| Modals | Reuse fixed overlay pattern from `FilterModal` / `PrivacyPolicyModal` |

## Accessibility

- Toolbar buttons: `aria-label` (Arabic)
- Canvas host: `aria-label`, `dir="ltr"` for world projection (UI shell `dir="rtl"`)
- Touch targets: 44px minimum on primary controls
- Modal: `role="dialog"`, `aria-modal`, labelled title

## Performance

- Pointer moves stay in Fabric (no React state per move)
- Committed gesture → one `object:modified` → one history entry
- ResizeObserver coalesced via dimension equality check
- Catalog unchanged: debounced search, 12/page

## Gaps before implementation

- No routable production page wiring shell (feature flag off)
- No Playwright room-designer route yet
- Real-device matrix **NOT VERIFIED** in CI
