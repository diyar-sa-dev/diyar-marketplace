# KVM2 Phase 19 — Search Performance, Octane Throughput & Scalability (Deep Root-Cause Verification)

**Date:** 2026-09-22 · **LOCAL KVM2-EQUIVALENT** · **Hostinger NOT VERIFIED** · **Git: NO COMMIT**

---

## 1. Executive summary

Phase 19 **independently verified** what limits DIYAR after Phase 18.3 async analytics:

**Primary limiting mechanism (confidence HIGH for waiting, MEDIUM for full chain):** **request waiting / Octane worker throughput** on **2 Swoole workers** pinned to **2 CPUs** — not warm-path catalog SQL for k6-style q searches on a **12-product** dataset.

**Contributing mechanisms (MEDIUM):** **~40k+ analytics jobs** on `default` queue (enqueue faster than drain); **sequential benchmark campaigns** without queue reset (invalidates late rps175–200 vs Phase 18.3); **k6 VU ceiling** at rps175 (320 VUs).

**Application optimization:** **NONE** (gate **REJECTED** — no HIGH-confidence single change).

**Face 3:** **REQUIRED and completed.**

**Certification:** **VERIFIED WITH LIMITATIONS**

---

## 2. Environment

Evidence: `phase19-search-performance/environment/environment-cert.json`

Validated: Docker stack, app **cpuset 0–1**, **OCTANE_WORKERS=2**, health **200**, **failed_jobs=0**, **12** public products, Laravel **13.26.1**, PHP **8.3.33**, rate limits **on** (`DIYAR_LOADTEST_MODE=false`).

---

## 3. Previous assumptions challenged

| Assumption | Verdict |
|------------|---------|
| Bottleneck is `CatalogSearchService` warm SQL | **DISPROVEN** for q (0 SQL warm) |
| Async analytics = zero HTTP cost | **DISPROVEN** (sync dispatch + backlog) |
| Phase 18.3 k6 directly comparable to any Phase 19 rps200 run | **DISPROVEN** (contamination) |
| ~0.6 ms CLI ⇒ Octane is fast | **DISPROVEN** as macro claim (89 ms+ serial HTTP) |

---

## 4. Baseline

- **Reference:** `baseline/reference-phase183.json` (Phase 18.3 post-async).
- **Phase 19 ladder (complete):** `baseline/baseline/campaign.json` — rps125/150/175/200 ×3 mixed + rps150 isolated workloads.
- **Comparable steady-state (Phase 19):** rps125 runs **2–3** (p95 **48 / 39 ms**); rps150 run **1** (p95 **112 ms**).
- **Contaminated / non-comparable:** rps150 runs 2–3, rps175–200 after **~40k queue backlog** accumulated.

---

## 5. Workload matrix

| Workload | rps150 p95 (Phase 19) | Notes |
|----------|----------------------:|-------|
| Mixed | 112–547 ms (variance) | See §14 |
| Search-only | **502 ms** | After ladder; backlog |
| Products-only | **54 ms** | Iso run |
| Detail-only | **71 ms** | Iso run |
| Serial curl q=sofa | **89 ms** | Warm, no k6 |
| Parallel 16 curl | **392 ms** | Discriminating |

Evidence: `baseline/baseline/summary-rps150-runiso-*.json`, `octane/concurrent-curl-probe.json`, `traffic/cold-warm-curl-matrix.json`

---

## 6. CPU evidence

| Source | App CPU @ ~rps150 mixed |
|--------|-------------------------|
| Phase 19 paired sampler during load | **NOT MEASURED** (background Start-Process failed to write) |
| Phase 15 sampler (historical, same envelope) | **~65% avg** (17 samples) |
| Correlation table | `final/correlation-table.json` (CPU columns null) |

**Conclusion:** Latency–CPU correlation for Phase 19 is **inferential** (Phase 15 + saturation curve), not **re-measured**.

---

## 7. Octane evidence

- **Workers:** 2 (fixed).
- **Waiting proven:** parallel vs serial curl (`octane/request-waiting-evidence.md`).
- **Direct worker queue metrics:** **UNMEASURED** (no Octane-native queue probe).
- **Worker restarts / memory:** **NOT MEASURED**

---

## 8. Request queueing evidence

**HIGH confidence:** p95 scales with **concurrency** at constant cache warmth (89 ms serial → 392 ms @ 16 parallel).

**Interpretation:** Majority of k6 p95 above serial HTTP is **waiting/contention**, not additional catalog SQL.

---

## 9. PHP / search decomposition evidence

`search/decomposition.json` — guest, in-process:

| Case | Warm wall | SQL |
|------|----------:|----:|
| q=sofa type=all | 0.63 ms | 0 |
| no_q type=all | 0.88 ms | 0 |
| no_q cold | 44.7 ms | 19 |

**HTTP gap:** serial nginx warm q **~89 ms** vs **0.6 ms** service = middleware + Octane + JSON + **analytics dispatch** + nginx (UNMEASURED split).

---

## 10. Redis evidence

- Warm search: multiple cache GETs per request (Phase 18 MONITOR sample).
- **Queue list depth:** **40,047 → 43,172** in 30s (`queue/depth-drain-sample.json`).
- Redis CPU during load: **NOT MEASURED**

---

## 11. MySQL evidence

Warm q under decomposition: **0 SQL**. Not primary for k6 q workload at n=12.

Cold no_q: **19 queries** — separate storefront browse path (`sql/facet-path-analysis.md`).

---

## 12. Queue evidence

`queue/backlog-evidence.md` — analytics jobs accumulate under sustained search; **failed_jobs=0**; worker drains slower than enqueue during campaign.

**Dispatch is synchronous** on HTTP thread (Redis LPUSH) — async ≠ zero cost.

---

## 13. Nginx evidence

Serial/parallel probes via **127.0.0.1:8193**. Upstream timing breakdown: **NOT MEASURED** (no stub_status correlation during k6).

---

## 14. Benchmark validity

`final/benchmark-validity.md`

- **VU exhaustion** at rps175 (320 cap) — fixed in harness to 400/450 for future runs.
- **No warm-up stage** — rps125 run1 **p95 254 ms** outlier after prior `cache:clear`.
- **Cumulative queue backlog** — late ladder runs **not** comparable to Phase 18.3 fresh runs.
- **XFF spread** — 0× 429; limits not mistaken for saturation.

---

## 15. Search decomposition (Octane HTTP)

**Not captured** via SPX on Octane HTTP. Evidence is **curl + k6 + CLI decomposition** — classify Octane in-worker timing as **UNMEASURED**.

---

## 16. Cardinality findings

**Dataset: 12 products.** Scalability to 1K/10K+ **NOT VERIFIED**. No cardinality experiment run (Phase 20).

---

## 17. Root-cause classification

`final/root-cause-classification.json`

**Primary:** worker queueing / Octane throughput (2 workers, 2 CPUs).

**Secondary:** analytics queue backlog; benchmark campaign state.

**Excluded primary:** warm q MySQL; rate limiter.

---

## 18. Confidence

| Claim | Level |
|-------|-------|
| Waiting dominates concurrent latency | **HIGH** |
| App CPU saturates at high mixed RPS | **MEDIUM** |
| Queue backlog hurts tail latency | **MEDIUM** |
| Exact % wait vs execute on Octane HTTP | **LOW / UNMEASURED** |

---

## 19–21. Face 1 / 2 / 3

- **Face 1:** Reject code optimization; continue measurement.
- **Face 2:** `face2/adversarial-review.md` — accepts rejection; warns against contaminated rps200 comparisons.
- **Face 3:** `face3/root-cause-reconstruction.md` — **triggered and closed** with waiting + backlog model.

---

## 22. Optimization decision

**REJECTED** — `implementation/pre-implementation-hypothesis.md` unchanged; no HIGH-confidence single change.

---

## 23. Implementation

**None.**

Harness-only: `rps175`/`rps200` **maxVUs** increase; k6 summary **p90/max**; sampler **queue depth** field; Phase 19 scripts under `scripts/performance/kvm2-phase19-*`.

---

## 24–26. Regression

- **Functional:** PHPUnit catalog search + analytics **13/13** (`tests/phpunit-catalog-search.json`).
- **Security:** No code changes; rate limits unchanged.
- **Performance:** No post-optimization (no optimization).

---

## 27. Bottleneck movement

Unchanged from 18.3 directionally: **worker/CPU envelope**; analytics INSERT no longer on HTTP. **New clarity:** **queue backlog** is a measurable **secondary** stressor.

---

## 28. Scalability assessment

**LOCAL KVM2-EQUIVALENT observed envelope (steady-state, not contaminated):**

- ~**125 RPS mixed:** p95 **~40–50 ms** (runs 2–3).
- ~**150 RPS mixed:** p95 **~112 ms** (run 1) before heavy backlog.
- **Degradation region:** begins between **125–150** with high variance; **175+** unreliable under contaminated campaign.

**NOT** a production or Hostinger capacity statement.

---

## 29. Remaining limitations

Octane HTTP phase timing; Phase 19 CPU sampler; Redis/MySQL CPU correlation; cardinality; clean rps175–200 ladder with queue drain + warm-up.

---

## 30. Next phase (Phase 20)

1. **Clean benchmark protocol:** drain/pause queue, warm-up stage, paired CPU sampler (foreground).
2. **Analytics queue isolation** experiment (dedicated worker/queue) — **one variable**.
3. **Cardinality seed** (1K SKUs) + facet SQL scaling.
4. Optional Octane-safe **response-phase timing** (diagnostic flag only).

---

## 31. Final certification

**VERIFIED WITH LIMITATIONS** — root cause **class** proven (waiting); full resource correlation incomplete.

---

## Scorecard

See `final/scorecard.json` (full table with NOT MEASURED where applicable).

---

## Final questions A–U

| ID | Answer |
|----|--------|
| **A** | **Real bottleneck:** Octane **worker/request waiting** + envelope throughput; **not** warm catalog SQL for q. |
| **B** | **Proof:** parallel curl probe; decomposition 0 SQL warm; queue growth; workload iso (products 54 ms vs search 502 ms under stress). |
| **C** | **Contradicts:** “CatalogSearchService CPU-heavy warm path” — CLI 0.6 ms; “async is free” — 40k backlog. |
| **D** | **Confidence:** **MEDIUM–HIGH** waiting; **MEDIUM** overall chain. |
| **E** | **Class:** **worker queueing**, **PHP/Octane occupancy**, **queue/Redis**, **benchmark** artifacts — not MySQL for warm q. |
| **F** | **Time spent:** **UNMEASURED** in-worker; **inferred** mostly **waiting** from concurrency probe + micro/macro gap. |
| **G** | **0.6 ms vs 100+ ms:** CLI skips nginx/Octane/concurrency; serial HTTP ~89 ms; k6 adds **arrival pressure** + **system load**. |
| **H** | **Execution vs waiting:** Most macro gap is **waiting/contention** (HIGH); exact % **UNMEASURED**. |
| **I** | **Saturation curve:** Reproducible **pressure** 125→150; **175–200 contaminated** — not a clean curve in this campaign. |
| **J** | **CPU vs latency:** **NOT MEASURED** Phase 19; Phase 15 **suggests** correlation. |
| **K** | **Redis vs latency:** **NOT MEASURED** CPU; backlog **correlates temporally** with tail explosion. |
| **L** | **MySQL vs latency:** **Weak** for warm q (**HIGH** exclusion). |
| **M** | **Worker occupancy vs latency:** **Indirect HIGH** (concurrency probe). |
| **N** | **Queue depth vs latency:** **MEDIUM** (growth during campaign; iso search worst after ladder). |
| **O** | **Benchmark artifacts:** **YES** — VU cap, no warm-up, cumulative queue. |
| **P** | **Cardinality scale:** **UNPROVEN** (n=12). |
| **Q** | **Optimization justified?** **NO.** |
| **R** | **Face 2 agree?** **Yes** on rejection; **no** on naive rps200 comparison. |
| **S** | **Face 3 required?** **YES — done.** |
| **T** | **Unproven:** Octane phase timings; Phase 19 CPU; clean high-RPS ladder; cardinality. |
| **U** | **Phase 20:** Clean protocol + queue isolation + cardinality + CPU correlation. |
