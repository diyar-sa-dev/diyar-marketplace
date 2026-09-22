# Phase 18 — Face 2 adversarial review

**Date:** 2026-09-22

| ID | Sev | Finding |
|----|-----|---------|
| F2-18-01 | P2 | **SPX produced no `/tmp/spx-data` reports** under Octane+Swoole without per-request SPX trigger — function-level CPU ranking not certified. |
| F2-18-02 | P2 | **Full baseline matrix** (detail/search/listing VU grids) not executed — only critical mixed RPS 3× + one isolated search rps150. |
| F2-18-03 | P2 | **High p95 variance** persists (rps125 53–269 ms; rps150 86–195 ms) — bottleneck claims must use distributions, not single runs. |
| F2-18-04 | P3 | **~12 products** — search/cache paths may not represent large-catalog CPU. |
| F2-18-05 | P3 | **Sampler JSONL missing** for Phase 18 (background sampler path issue) — container CPU reuses Phase 15 sampler as corroboration. |

## Challenge responses

| Question | Answer |
|----------|--------|
| Is CPU the bottleneck? | **Yes** at rps150 mixed (Phase 15 app ~67–94% CPU; Redis/MySQL not saturated). |
| Profiler distortion? | SPX not active during certified runs; no distortion claim. |
| Workload representative? | Phase 15/17 **mix-realistic** script unchanged; search-heavy tails visible in sub-metrics. |
| Redis/MySQL after opt? | No Phase 18 optimization applied. |
| Octane leak? | **11/11** isolation/cache tests pass (detail + auth + locale). |

**Blockers:** None P0/P1 for **profiling-only** certification.
