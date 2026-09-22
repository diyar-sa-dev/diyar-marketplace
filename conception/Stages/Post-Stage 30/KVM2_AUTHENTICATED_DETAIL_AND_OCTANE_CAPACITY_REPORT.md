# DIYAR — KVM2 Authenticated Detail, Cache Mix, and Octane Capacity (Phase 15)

**Date:** 2026-09-22 (HTTP campaign completed same day)  
**Prior authority:** `KVM2_PRODUCT_DETAIL_SEARCH_OPTIMIZATION_REPORT.md` (Phase 14)  
**Evidence:** `backend/storage/certification/kvm2-equivalent/phase15-authenticated-octane/`  
**Naming:** Operational Phase 15 under Post–Stage 30.  
**No git commit.**  
**This is local KVM2-equivalent simulation only. Hostinger remains NOT VERIFIED.**

---

## Executive summary

Phase 15 delivered **public Redis product body + per-user overlay**, **real k6 HTTP certification** on Docker Desktop (Linux engine), **cold/warm/stampede HTTP checks**, **Redis/MySQL/Octane sampling**, and a **2 vs 4 Octane worker experiment** on the same **cpuset 0–1** application slice.

```text
Docker / KVM2 envelope:              VERIFIED WITH LIMITATIONS
Authenticated detail (HTTP):         VERIFIED WITH LIMITATIONS
Public cache + overlay isolation:    VERIFIED WITH LIMITATIONS
mix-realistic (synthetic):           VERIFIED WITH LIMITATIONS
Cold / warm / stampede (HTTP):       VERIFIED WITH LIMITATIONS
Mixed storefront rps/vu (phase2 mix): VERIFIED WITH LIMITATIONS
Redis at 50–200 RPS:                 VERIFIED WITH LIMITATIONS (sampler)
MySQL under load:                    VERIFIED WITH LIMITATIONS (low threads_running)
Octane 2 workers (default):          VERIFIED WITH LIMITATIONS
Octane 4 workers (same 2 CPUs):      VERIFIED WITH LIMITATIONS — not recommended
Queue (failed_jobs, workers):        VERIFIED
Security (PHPUnit catalog/cache):    VERIFIED WITH LIMITATIONS
Frontend build:                      VERIFIED
Playwright login/logout E2E:         NOT VERIFIED
Hostinger:                           NOT VERIFIED
```

**Headline (2 workers, post-overlay):**
\
- Authenticated detail **25 VU:** **83 RPS / 59 ms p95** (Sanctum, rate limits on, 12-product pool).
- Guest detail **25 VU:** **89 RPS / 10 ms p95** (multi-product skew).
- **mix-realistic** (35% list / 20% search / 30% guest detail / 15% auth detail): **86 RPS / 39 ms p95**.
- **Mixed storefront** (phase2 guest-heavy mix): **rps50 49.8 / 11 ms**, **rps100 99 / 71 ms p95**, **rps150 149 / 132 ms**, **rps200 198 / 386 ms** — **0% 5xx**, **0** unexpected 429, **`failed_jobs = 0`** after campaign.
- **4 workers** on the same 2 app CPUs: **rps150 p95 264 ms vs 132 ms (2 workers)** → **keep 2 workers**.

**This is not Hostinger validation.**

---

## Docker verification

| Check | Result |
|-------|--------|
| Docker Desktop 29.x / Linux engine | Reachable 2026-09-22 |
| Compose project `diyar-kvm2-test` | Running |
| App / stack cpuset | **0–1** (see `workers-2/environment-cert.json`) |
| k6 cpuset | **2–3** |
| App + queue images rebuilt together | Yes (before benchmarks) |
| Queue PID 1 cmdline | `queue:work` (critical + default **healthy**) |
| `failed_jobs` post-campaign | **0** |

Harness fixes during execution (documented): k6 Sanctum login via **`http://nginx` session** + **`Origin: http://127.0.0.1:8193`**, login payload `{ method, identifier, password }`, customer seed **`500000010`**, Redis flush stderr handling on Windows, **`REPORT_DIR` path slashes** in phase2 summaries.

---

## Phase 14 baseline (unchanged reference)

| Workload | Phase 14 |
|----------|----------|
| Guest detail 25 VU | 86.5 RPS / **30 ms** p95 |
| Mixed rps50 | 49.8 RPS / **12.7 ms** p95 |
| Mixed rps100 | 99.4 RPS / **23 ms** p95 |
| Mixed rps150 | 149 RPS / **340 ms** p95 |
| Mixed rps200 | 196 RPS / **677 ms** p95 |

Phase 14 had **no** authenticated detail or **mix-realistic** profile.

---

## Authenticated detail HTTP baseline (2 workers)

| Profile | RPS | p50 | p95 | p99 | detail p95 | Errors |
|---------|-----|-----|-----|-----|------------|--------|
| detail-auth-vu5 | 17.2 | 10 ms | **26 ms** | 105 ms | 26 ms | 0 |
| detail-auth-vu10 | 34.1 | — | **24 ms** | 74 ms | 24 ms | 0 |
| detail-auth (25 VU) | 83.0 | 15 ms | **59 ms** | 163 ms | 59 ms | 0 |
| detail-auth-vu50 | 143.5 | 45 ms | **187 ms** | 353 ms | 187 ms | 0 |

Auth detail at marketplace-relevant concurrency (25 VU) stays **sub-60 ms p95** with overlay + warm public cache.

---

## Cold cache / warm cache / stampede (HTTP)

| Profile | Notes | RPS | p95 |
|---------|-------|-----|-----|
| detail-auth-cold | Detail keys flushed immediately before 90s run | 83.4 | **52 ms** |
| detail-auth-warm | Guest GET warm-up then 90s auth | 83.6 | **49 ms** |
| stampede-detail | Flush + **50 VU** same product (guest), 45s | 355 | **279 ms** |

**Face 2:** 90s cold/warm profiles still **re-warm** during the window; treat as **HTTP smoke**, not steady-state cold SLO. Stampede shows elevated p95 vs steady guest detail but **0 errors** and bounded DB threads (sampler during mixed load: `threads_running` ≈ 2–3).

---

## Cache architecture (unchanged)

Public key: `diyar:catalog:products:detail:v1:{version}:{locale}:{md5(id)}`. Overlay: likes, saves, own-store, preorder, `sales_stats` (vendor own-store only). PHPUnit: **0** product-table queries on warm auth hit (customer).

---

## Security

PHPUnit: **162** catalog + cache tests pass; guest leak, archive invalidation, IDOR. **Not** a pentest. **Login/logout browser E2E:** NOT VERIFIED.

---

## Redis analysis (sampler, 2 workers)

Example **rps150** sample (`workers-2/sampler-rps150.jsonl`):

- **Octane app container:** ~**74–86% CPU** (of its cpuset allocation).
- **Redis:** ~**8–13% CPU**, **~2400–3150 ops/s**, **0 evictions**, **0 blocked clients**, ~76 MiB used.
- **MySQL:** ~**5–30% CPU**, **threads_running 2–3**.

**Conclusion:** At 150 RPS mixed (phase2), **Octane/PHP on 2 workers is the dominant limiter**, not Redis saturation. Redis is busy but **healthy**.

---

## MySQL analysis

Under Phase 15 mixed/auth load, MySQL stayed **low contention** (few running threads, no lock-wait growth in samples). Auth overlay avoids full product reload on cache hit (PHPUnit). **Large-catalog scale NOT VERIFIED** (~12 public products in seed).

---

## Mixed traffic

### mix-realistic (synthetic representative)

Skew: 40% / 30% / long-tail over up to **12** IDs; **86.2 RPS / 39 ms p95**, 0 errors.

### phase2 mixed (guest listing + search + detail — regression vs Phase 14)

| Profile | Phase 14 p95 | Phase 15 (2w) RPS / p95 |
|---------|-------------|-------------------------|
| rps50 | 12.7 ms | 49.8 / **11 ms** |
| rps100 | 23 ms | 98.8 / **71 ms** |
| rps125 | 74 ms | 124.4 / **68 ms** |
| rps150 | 340 ms | 149.3 / **132 ms** |
| rps200 | 677 ms | 197.9 / **386 ms** |
| vu25 | — | 87.7 / **19 ms** |
| vu50 | — | 169.1 / **56 ms** |
| detail-guest 25 VU | 30 ms | 88.6 / **10 ms** |

rps100 **p99 spike** (1244 ms) on one run — treat as tail outlier; **p95 71 ms** vs Phase 14 **23 ms** regression worth monitoring (Face 2: possible scheduler noise; re-run if needed).

---

## Octane 2 vs 4 workers (same CPUs 0–1)

| Profile | 2 workers p95 | 4 workers p95 | 2 workers RPS | 4 workers RPS |
|---------|---------------|---------------|---------------|---------------|
| rps50 | **11 ms** | 12 ms | 49.8 | 49.8 |
| rps100 | 71 ms | **22 ms** | 98.8 | 99.6 |
| rps150 | **132 ms** | 264 ms | 149.3 | 149.0 |
| vu25 | **19 ms** | 23 ms | 87.7 | 85.7 |
| vu50 | 56 ms | 55 ms | 169.1 | 170.3 |

**Decision:** **Retain 2 workers.** Four workers **materially worsens rps150 p95** on the same 2-vCPU slice; rps100 improvement alone does not justify the **overall** regression and contention pattern.

Stack restored to **`OCTANE_WORKERS=2`** after experiment.

---

## Queue

Pre/post: **`failed_jobs = 0`**. Queue-critical sampled ~5–38% CPU during peaks (analytics). No retry storm observed.

---

## Regression

| Check | Result |
|-------|--------|
| PHPUnit Catalog + Cache | **162/162** |
| `npm run build` | Pass |

---

## Before/after table (authoritative)

| Workload | Phase 14 | Phase 15 / 2w | 4 workers | Decision |
|----------|---------:|----------------:|----------:|----------|
| Guest detail p95 | 30 ms | **10 ms** | — | Improved (multi-ID harness) |
| Auth detail p95 | N/A | **59 ms** @ 25 VU | — | Overlay verified HTTP |
| Mixed rps50 p95 | 12.7 ms | **11 ms** | 12 ms | Hold 2w |
| Mixed rps100 p95 | 23 ms | **71 ms** | **22 ms** | Investigate tail; still 2w |
| Mixed rps150 p95 | 340 ms | **132 ms** | 264 ms | **2w** |
| Mixed rps200 p95 | 677 ms | **386 ms** | — | Improved vs P14; still degrading |
| mix-realistic p95 | N/A | **39 ms** | — | Synthetic mix OK |

---

## Bottleneck / next phase

**Current boundary (local KVM2-equivalent, 2 Octane workers, ~12 products):**

- **Sustainable:** ~**100 RPS** mixed phase2 with **p95 ~70 ms** (watch p99).
- **First clear degradation:** **150–200 RPS** (p95 **132 → 386 ms**).
- **Resource:** **Octane app CPU ~75–86%** at rps150; Redis **not saturated**.

**Recommended next operational phase:** **Phase 17 — Octane/PHP CPU** (serialization, middleware, worker tuning) **only if** product requires **>100 RPS mixed** on KVM2-class **without** adding vCPU. **Not** Redis cluster / **not** vertical scale yet.

**Phase 19 (larger dataset)** when the question is catalog cardinality, not worker count.

---

## Final certification

| Area | Status |
|------|--------|
| Authenticated detail | **VERIFIED WITH LIMITATIONS** |
| Public cache | **VERIFIED WITH LIMITATIONS** |
| Cache isolation | **VERIFIED WITH LIMITATIONS** |
| Redis capacity | **VERIFIED WITH LIMITATIONS** |
| Octane 2 workers | **VERIFIED WITH LIMITATIONS** |
| Octane 4 workers | **VERIFIED WITH LIMITATIONS** (rejected for default) |
| Mixed storefront | **VERIFIED WITH LIMITATIONS** |
| Queue | **VERIFIED** |
| Security | **VERIFIED WITH LIMITATIONS** |
| KVM2 local simulation | **VERIFIED WITH LIMITATIONS** |
| Hostinger | **NOT VERIFIED** |

---

## Engineering answers (A–M)

| Q | Answer |
|---|--------|
| A. Auth detail efficient under HTTP? | **Yes at 25 VU** (~59 ms p95); **187 ms p95 at 50 VU** auth-only. |
| B. Overlay secure? | **PHPUnit yes**; browser logout **not verified**. |
| C. Overlay reduces DB work? | **Yes** on warm path (tests + low MySQL threads). |
| D. Redis limiting? | **No** at tested loads (ops high, no evictions/blocked). |
| E. MySQL limiting? | **No** on current dataset. |
| F. 4w beats 2w on 2 CPUs? | **No** for overall workload (**rps150 worse**). |
| G. Default workers? | **2** |
| H. First degradation? | ~**125–150 RPS** mixed (p95 climbs). |
| I. Sustainable operating point? | ~**≤100 RPS** mixed with **p95 ~70 ms** (2 workers). |
| J. Next bottleneck? | **Octane/PHP CPU** on cpuset 0–1. |
| K. Further optimization justified? | **Yes**, software-only before hardware. |
| L. Scaling justified? | **Not yet** from this evidence. |
| M. Do not change yet? | vCPU, Redis/MySQL replicas, default 4 workers, Hostinger SLA claims. |

---

## Face 2 notes

- **Warm bias:** Most profiles run hot after first seconds.
- **Dataset:** ~12 products — not 25K row proof.
- **phase2 mixed ≠ mix-realistic** — regression table uses phase2 for Phase 14 parity.
- **rps100 p99 outlier** on one 2w run — do not cert p99 without repeat.
- **Stampede** certifies HTTP behavior, not single-flight DB count (unit tests cover `StampedeSafeCache`).

**This is local KVM2-equivalent simulation only. Hostinger remains NOT VERIFIED.**
