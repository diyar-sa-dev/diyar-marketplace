# Stage 30.5 — Pre-Implementation Audit (Face 1)

**Date:** 2026-09-19  
**Foundation:** 30.1–30.4 tests **50/50 PASS**, typecheck **PASS**

## Existing interaction (verified in code)

| Capability | Status |
|------------|--------|
| Selection events | **VERIFIED** — `selection:*` → `{ type: 'select' }` |
| Drag → MOVE | **NOT FOUND** |
| Rotate → ROTATE | **NOT FOUND** |
| Delete / duplicate UI | **NOT FOUND** in room-designer feature |
| Keyboard | **NOT FOUND** |
| Sidebar `%` drag | **VERIFIED** — legacy `SidebarAiStudioCanvas` (unchanged in 30.5) |

## Architecture plan

```text
Fabric object:modified (end of transform)
  → interaction/fabricModifyToCommands (px → m)
  → DesignerSession.handleCommands
  → executeCommand / executeBatch (one history entry)
  → render(document) with sync guard (no feedback loop)
```

During drag: Fabric provides **visual preview only**; authoritative state updates on **modified** (one logical gesture ≈ one history entry).

## React

`RoomDesignerCanvasHost` — ref-held engine state; re-render only after successful commands.

## Out of scope 30.5

Persistence, API, sidebar wiring, mobile QA (**NOT VERIFIED**).
