# Stage 30.4 — Fabric bundle evidence

**Date:** 2026-09-19  
**Environment:** local Windows, `npm run build` (marketplace)

## Main app bundle isolation

| Check | Result |
|-------|--------|
| `fabric` string in `frontend/dist/assets/*` after full build | **NOT FOUND** |
| `createRoomRenderer` imported from app routes/sidebar | **NOT FOUND** (designer not wired yet) |

**Conclusion:** Fabric remains off the critical path until the room designer route/modal lazy-loads `createRoomRenderer()`.

## Fabric package size (lazy chunk source)

| Asset | Bytes (approx) |
|-------|----------------|
| `node_modules/fabric/dist/index.min.mjs` | **316 082** bytes (~309 KiB minified) — **VERIFIED** 2026-09-19 |

**gzip estimate:** typically ~30–40% of min file — **measure at wire-up** in 30.7 when designer chunk is added to Vite manualChunks if needed.

## Dev-only

| Package | Purpose |
|---------|---------|
| `canvas` (devDependency) | Vitest/jsdom Fabric canvas context |

Not shipped to production browser bundle.
