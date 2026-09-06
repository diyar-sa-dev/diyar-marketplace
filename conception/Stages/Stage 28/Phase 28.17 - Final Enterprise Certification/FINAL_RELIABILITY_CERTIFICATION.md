# Final Reliability Certification — Phase 28.17

## Health & Readiness (VERIFIED)

| Probe | Route | Docker loadtest |
|-------|-------|-----------------|
| Liveness | `/api/v1/health/live` | Used by fixed healthcheck |
| Readiness | `/api/v1/health/ready` | MySQL + Redis dependency check |
| Legacy | `/api/v1/health` | 200 OK |

**Fix applied:** Docker healthcheck no longer false-negative (shell `$` bug).

---

## Failure Simulation

| Scenario | Status |
|----------|--------|
| Redis unavailable → readiness | Code exists; **NOT RUN** live restart this pass |
| MySQL restart | **NOT RUN** |
| Queue worker restart | Integration test PASS |
| Octane worker recycle | `OCTANE_MAX_REQUESTS=2000` configured |
| Duplicate payment / webhook | Unit/feature coverage; **NOT RUN** chaos |

---

## Queue (VERIFIED partial)

- `QueueWorkerIntegrationTest` — 12 pass, 1 skip
- Redis queue driver in loadtest compose

---

## Soak Test

- **15 min @ 10 RPS** — started 2026-08-29 → `_raw/2026-08-29-soak15.txt`
- Result: pending completion

---

## Verdict

**Reliability: 8.5/10** — health probe fixed; controlled failure matrix incomplete.
