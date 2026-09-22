# Phase 18.1 — Face 2 adversarial review

| ID | Sev | Finding |
|----|-----|---------|
| F2-18.1-01 | P2 | SPX profiles are **HTTP kernel CLI**, not Swoole Octane worker — Octane-specific state not identical. |
| F2-18.1-02 | P2 | Saturation ladder **rps175/225/250/300** not executed; curve uses Phase 18 aggregates. |
| F2-18.1-03 | P2 | Container CPU JSONL sampler not re-attached (Phase 15 sampler used for CPU saturation class). |
| F2-18.1-04 | P3 | ~12 products — facet/search cache paths may not scale. |

## Challenge answers

| Question | Verdict |
|----------|---------|
| Did we saturate the application? | **Pressure/degradation** at rps200 mixed; **0× 5xx** — collapse not seen. |
| Which resource first? | **App CPU** (Phase 15 sampler at rps150); Redis/MySQL not container-saturated. |
| Is search the hotspot path? | **Yes** for mixed latency tails (`search_p95_ms`). |
| Is `CatalogSearchService::facets()` the CPU hog? | **NOT PROVEN** — warm no-query search **20ms**; facets not top in SPX. |
| Is analytics responsible? | **PROVEN for q-bearing search** in warm kernel SPX (**~90%** profile window on DB insert). |
| Reproducible? | SPX warm profiles reproduced; k6 p95 remains variable. |

**Blockers:** None P0/P1 for profiling-only close with limitations.
