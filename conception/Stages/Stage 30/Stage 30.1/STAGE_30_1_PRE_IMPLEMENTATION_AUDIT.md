# Stage 30.1 — Pre-Implementation Audit

**Date:** 2026-09-19  
**Git baseline:** `62cc1ad` on branch `dev`  
**Authority:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md), [`DOMAIN_ARCHITECTURE.md`](DOMAIN_ARCHITECTURE.md)

Note: `SPATIAL_ENGINE_SPECIFICATION.md` is **NOT FOUND**; spatial rules live in `DOMAIN_ARCHITECTURE.md`.

---

## Repository conventions

| Topic | Finding |
|-------|---------|
| Frontend package | React 19 + Vite 6 + TypeScript 5.8 |
| Tests | Vitest 3, `src/**/*.{test,spec}.{ts,tsx}`, jsdom setup |
| Path alias | `@/` → `src/` |
| Feature folders | **NOT FOUND** under `src/features/` — domain modules live under `src/lib/`, `src/hooks/`, colocated `*.test.ts` |
| Strict TS | `strict` not enabled globally in `tsconfig.json` — local modules still use explicit types, no `any` |
| Naming | camelCase in TS; API/catalog often snake_case at boundary mappers (`catalogMappers.ts`) |
| Domain errors | HTTP-oriented `utils/errors.ts` — Room Designer will use separate **domain error codes** in feature folder |

---

## Relevant existing modules

| Module | Relevance |
|--------|-----------|
| `SidebarAiStudioModal.tsx` / `SidebarAiStudioCanvas.tsx` | Prototype shell — **do not modify** in 30.1 |
| `sidebarMenuConstants.ts` | Mock stickers — **do not modify** |
| `ProductDetailsPage.tsx` | Try-in-room placeholder — **do not modify** |
| `lib/catalogMappers.ts` | Future catalog boundary (30.3) — **do not modify** |
| `/ai-designer` | Unrelated chat feature |

---

## Where Stage 30.1 should live

Stage 30 recommends `frontend/src/features/room-designer/`. No conflicting `features/` tree exists.

**Decision:** create `frontend/src/features/room-designer/` with:

- `domain/` — pure spatial (no React imports)
- `application/` — command dispatcher + history orchestration
- Colocated `*.test.ts` per project convention (not a separate `tests/` tree)

---

## Test conventions

- Import from `vitest`: `describe`, `it`, `expect`
- Behavioral tests with given/when/then
- Benchmarks: dedicated `spatial.perf.test.ts` using `performance.now()` (no new framework)

---

## Reusable utilities

- **None** for spatial math today — new pure modules
- Future `centimetersToMeters` will live in `domain/units.ts` only (not reuse scattered `/100`)

---

## Potential conflicts

| Risk | Mitigation |
|------|------------|
| Stage 30 JSON uses `schema_version`, `width_m` | Match persistence contract exactly in document types |
| User prompt says `room-design` path | Follow Stage 30 `room-designer` |
| `FurnitureItem` vs `RoomDesignItem` | Use Stage 30 `RoomDesignItem` + snapshot |
| SET_GRID in command list | Store optional `grid` on document (non-spatial UI hint, serializable) |
| RESIZE vs catalog truth | V1: reject dimension change (`RESIZE_NOT_ALLOWED`) |

---

## Potential performance risks

- Naive O(n²) overlap checks — acceptable for n ≤ 100; document in benchmark
- Deep clone on every command — use structural sharing / shallow copy items array + clone changed item only

---

## Potential architecture risks

- Accidental React import in domain — forbid via lint/review; domain files suffix clear
- History storing full documents × 50 — use **inverse commands** per Stage 30

---

## Implementation boundary

**In scope:** units, models, geometry, constraints, commands, history, dispatcher, serialization, unit + perf tests  

**Out of scope:** Fabric, React UI, API, DB, sidebar prototype edits, new npm dependencies

---

## Numeric limits (from Stage 30 package)

| Limit | Value | Source |
|-------|-------|--------|
| Max items | 100 | MASTER §5 |
| History depth | 50 | MASTER F / DOMAIN |
| Room edge | 1.5 m – 30 m | BACKEND_ARCHITECTURE validator (adopt for domain) |
| Max item dimension | 10 m per edge | Engineering guard (document in constants + DECISION_LOG if challenged) |
| Grid step | 0.1 m when enabled | DOMAIN |

---

## Approval to proceed

Inspection complete. Proceeding to Stage 30.1 implementation per [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md) §30.1.
