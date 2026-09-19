# UX Specification

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

---

## Entry points

| Location | V1 behavior |
|----------|-------------|
| Sidebar menu | Opens Room Designer (refactor `SidebarAiStudioModal`) |
| Product detail | «جرّب في غرفتك» → **Try in My Room** flow (not full designer) |
| Optional deep link | `/room-designer` or `/room-designer/:id` (lazy route) — **PREPARED** in roadmap 30.6 |

---

## Layout (desktop)

```text
┌──────────────────────────────────────────────────┐
│ Header: title, save status, undo/redo, cart CTA   │
├──────────┬───────────────────────────┬───────────┤
│ Room     │                           │ Catalog   │
│ presets  │      Canvas (top-down)    │ search    │
│ dims     │                           │ paginated │
│ grid     │                           │           │
└──────────┴───────────────────────────┴───────────┘
```

RTL: panels and text mirror; **canvas world X+ remains right-to-left layout convention for UI labels only** — physical +X is fixed (see master F-4).

---

## Core flows

### New design

1. Choose preset or enter dimensions (UI may show **cm** with conversion at boundary).
2. Empty canvas with scale ruler (derived from meters).
3. Search catalog → tap product → **ADD_ITEM** at room center or last click point.

### Edit

- Select item → handles for rotate; drag move; toolbar: duplicate, lock, delete.
- Overlap: amber outline + optional tooltip (WARN mode).
- Out-of-room attempt: blocked (BLOCK mode).

### Save

- Status: **محلي / جاري الحفظ / تم الحفظ / خطأ** (LOCAL / SYNCING / SYNCED / ERROR)
- Error: retry button; never discard canvas on failure.

### Cart from design

- Review list with live availability badges
- Unavailable lines skippable or removed with confirmation

---

## Mobile (first-class)

- Bottom sheet catalog
- Two-finger pan/zoom canvas
- Long-press or explicit rotate control (avoid gesture conflict with scroll)
- Minimum touch target 44×44 px

---

## Accessibility

- All toolbar actions: `button` + `aria-label`
- Save status: `aria-live="polite"`
- Keyboard: undo/redo shortcuts; tab order for panels; canvas operations via focused item + arrow keys (**PREPARED** 30.5 — document key map in implementation)
- `prefers-reduced-motion`: disable non-essential transitions

---

## i18n

- Arabic RTL + English LTR via existing i18n
- Dimension labels: cm in catalog UI; room size inputs may dual-label (cm display, m storage)

---

## Empty / error states

| State | UX |
|-------|-----|
| No search results | Illustration + refine query |
| Product missing asset | Footprint rectangle + product name |
| Design load 404 | Return to list + create new |
| Item limit reached | Toast + disable add |
