# Phase 17.2 — Face 2 review

**Date:** 2026-09-22

## Questions

| Question | Answer |
|----------|--------|
| Is the improvement repeatable? | **No stable improvement claim** — rps100 p95 swings 10–71 ms across Phase 15 / single opt / 3× replicates. |
| Is it larger than run variance? | **Cannot certify capacity gain** — same optimized code: rps150 p95 **28–154 ms** (5×). |
| Does it survive rps150? | **431 ms not reproduced** — median replicate **127 ms**; not worse than Phase 15 **132 ms** on median. |
| Does it survive rps200? | **Not re-run in 17.2** — use Phase 15 frozen **386 ms**. |
| Does it reduce CPU? | **Not measured in 17.2** — samplers not retained; Phase 15 still shows Octane CPU dominant at rps150. |
| Move work elsewhere? | 01b reduces catalog-version Redis GETs on search — **unit-tested**; no 17.2 Redis GET/request proof. |
| Redis/MySQL/queue pressure? | Replicates: **0× 5xx/429**; queue not re-sampled per run. |
| Auth / cache isolation? | 01c caches **ReflectionProperty only** — no user/session in static state; Octane reset path unchanged. |
| Octane-safe? | **Yes by code review**; formal multi-user isolation k6 **not run in 17.2**. |

## Findings

| ID | Sev | Finding |
|----|-----|---------|
| F2-17.2-01 | P2 | Paired pre-opt01 completed but invalid for opt01: git HEAD control vs full working tree; control runs had ~6k 5xx each. |
| F2-17.2-02 | P2 | Tail latency (p99) still volatile — do not certify on single p95. |
| F2-17.2-03 | P3 | Low-load rps100 p95 **~12 ms** vs Phase 15 **71 ms** suggests different cache warm state or harness drift — not attributed to optimization. |

## Blockers

**None P0/P1** for accepting 01b/01c on correctness grounds.
