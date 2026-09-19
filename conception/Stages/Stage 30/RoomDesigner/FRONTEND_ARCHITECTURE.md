# Frontend Architecture

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)  
**Renderer detail:** this document § RoomRenderer adapter.

---

## Stack (existing)

- React 19, Vite, TanStack Query, React Context, existing routing/i18n
- **No Zustand in 30.1–30.5** — `useReducer` or external store subscription to pure `SpatialStore`
- Lazy route + dynamic `import('fabric')` for canvas chunk

---

## State layers

```text
RoomDesignDocument (authoritative, pure TS)
        ↑ applyCommand
SpatialStore + History
        ↑ events
RoomRenderer adapter (Fabric V1)
        ↑ read-only projection
React UI (panels, catalog)
        ↕
TanStack Query (design fetch/save, catalog pages, cart mutations)
```

**Sync state machine:** `LOCAL | SYNCING | SYNCED | ERROR`  
Debounce **2500 ms** after last command before PUT.

---

## RoomRenderer adapter interface

```typescript
interface RoomRenderer {
  mount(container: HTMLElement, options: RenderOptions): void;
  destroy(): void;
  render(doc: RoomDesignDocument, view: ViewState): void;
  setSelection(ids: string[]): void;
  onInteraction(handler: (event: RendererInteraction) => void): void;
}

type RendererInteraction =
  | { type: 'select'; ids: string[] }
  | { type: 'command'; command: Command; pointer?: { x_m; z_m } };
```

Domain **must not** import `fabric`. Adapter maps meters → pixels via `scalePxPerM` and viewport pan/zoom.

---

## Fabric.js adoption checklist (before merge)

| Check | Evidence required |
|-------|-------------------|
| Vite chunk size after lazy load | build analyze artifact |
| Mobile touch drag | device QA |
| Memory after 50 items | Chrome performance snapshot |
| Interaction frame time during drag | < 16 ms target on mid Android — **measure in 30.10** |

If Fabric fails budget: evaluate Konva adapter with **same interface** — decision via DECISION_LOG.

---

## Refactor map (existing shell)

| Current | Target |
|---------|--------|
| `SidebarAiStudioModal.tsx` | Container; wire SpatialStore + lazy renderer |
| `SidebarAiStudioCanvas.tsx` | Replace px/% logic with adapter mount point |
| `sidebarMenuConstants.ts` | Room presets only (dims in m); remove mock STICKERS |
| `STICKERS` / Unsplash | Removed from production path |

---

## Catalog integration

- Reuse existing product search hooks (same as catalog pages)
- Cache product pages in Query; dedupe by `product_id`
- Do not fetch full catalog

---

## Try in My Room UI

Separate feature folder:

```text
frontend/src/features/try-in-room/
```

Product detail modal → upload → job status → result image. No import from `room-designer/domain` except shared `units` if needed.

---

## Performance (browser)

- All drag/collision/undo on main thread OK for V1 ≤100 items; if profiling fails, move geometry to Web Worker (**PREPARED**)

---

## Testing

- Vitest: domain + commands + constraints (no canvas)
- Component tests: toolbar, save status
- Playwright: save/reload flow (30.10)
