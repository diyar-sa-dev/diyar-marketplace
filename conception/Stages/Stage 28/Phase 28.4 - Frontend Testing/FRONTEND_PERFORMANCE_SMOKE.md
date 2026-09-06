# Phase 28.4 — Frontend Performance Smoke

**Not load testing** — lightweight build metrics only (→ Phase 28.7 for load).

---

## Production build sizes

From `_frontend_build.txt`:

| Chunk | Raw | Gzip |
|-------|-----|------|
| Main bundle | 499 KB | 144 KB |
| React vendor | 194 KB | 61 KB |
| CSS | 74 KB | 13 KB |

**Total JS (approx):** ~700 KB raw / ~205 KB gzip (main + react vendor; excludes lazy routes)

---

## Observations (candidates — not defects)

| Observation | Phase |
|-------------|-------|
| Main chunk >500 KB | 28.9+ bundle split |
| Recharts in admin chunk | Lazy-loaded |
| TanStack Query default stale times | 28.7 profiling |
| Duplicate API calls | **NOT MEASURED** |

---

## Console / network smoke

No systematic duplicate-request audit performed.

Playwright journeys did not report runaway request loops.

---

## Gate

```text
CAPTURED
```

Baseline metrics recorded; no SLO defined.
