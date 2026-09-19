# Stage 30.10 — Performance Evidence

**Date:** 2026-09-19  
**Environment:** Local Windows, `npm run build` (Vite production)

## Frontend bundle (measured)

| Asset | Size (min) | gzip | Notes |
|-------|------------|------|-------|
| `main.marketplace-*.js` | 121.66 KiB | 40.46 KiB | No `fabric` string in file (grep) |
| `RoomDesignerPage-*.js` | 34.04 KiB | 11.17 KiB | Page + shell; Fabric not inlined |
| `FabricRoomRenderer-*.js` | 291.64 KiB | 88.01 KiB | Lazy-loaded renderer + Fabric |

**Conclusion:** Fabric remains off the main marketplace entry chunk (Stage 30.4 invariant preserved).

## Domain micro-benchmark (Vitest `spatial.perf.test.ts`)

Integrated engine timings (ms avg, in-process, not Fabric):

| Items | MOVE | ROTATE | UNDO | SERIALIZE |
|-------|------|--------|------|-----------|
| 10 | ~0.10 | ~0.08 | ~0.06 | ~0.01 |
| 100 | ~1.95 | ~1.59 | ~3.30 | ~0.16 |

**Limitation:** Does not include Fabric render loop or network save latency.

## Autosave (Vitest)

- 25× `markDirty` → **1** debounced save (2500 ms window)
- `flush()` → immediate single save

## Backend API (PHPUnit)

- List/show query counts ≤ 8 / ≤ 6 (in-process SQLite)
- Add-to-cart: bounded product SELECT vs unique SKUs (30.8)

## NOT VERIFIED

- k6 / VPS load (roadmap 30.10 optional)
- Real-device touch latency
- End-to-end save p95 with network
- 100-item design through full UI + save payload measurement
