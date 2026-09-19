# Stage 30.11 — Performance Evidence

**Date:** 2026-09-19

Measurements from local PHPUnit (sqlite, `Queue::fake` / `dispatchSync`), not production load.

| Operation | Evidence | Notes |
|-----------|----------|-------|
| Upload + create job | `TryInRoomTest` ~1.5s suite total | Includes migration refresh |
| Stub processing | `dispatchSync` in test | No external I/O |
| Poll API | single GET in test | No polling storm test |

**Not measured:** concurrent uploads, max-dimension 8192px image, production MySQL latency.

**Status:** PARTIALLY VERIFIED — no dedicated benchmark run.
