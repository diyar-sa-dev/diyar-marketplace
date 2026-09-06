# Queue Capacity Results — DIYAR Marketplace

**Date:** 2026-08-29

---

## Status: NOT MEASURED (live drain)

Queue wiring **VERIFIED** in code and Redis integration test (`Queue::push` roundtrip).

---

## Planned Test (not executed this pass)

| Batch | Target metric |
|-------|---------------|
| 1k jobs | jobs/sec, p95 latency |
| 5k jobs | queue depth over time |
| 10k jobs | time to drain |

---

## Code Evidence

| Item | Status |
|------|--------|
| QUEUE_CONNECTION=redis in Docker | ✅ |
| Failed job handling | ✅ PHPUnit |
| Horizon / supervisor | Documented in Phase 28.14 |

---

## Verdict

**PROJECTED** — queue architecture production-ready; throughput **NOT VERIFIED** under load.
