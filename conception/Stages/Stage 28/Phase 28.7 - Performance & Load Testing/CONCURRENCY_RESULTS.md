# Concurrency Results — Phase 28.7

**Date:** 2026-08-27

---

## Method

Concurrency scaling measured via k6 **Profile 100** ramp:

```text
30 s → 50 VU
60 s → 100 VU
30 s → 0 VU
```

Script: `stage28-workload.js` (verified endpoints).

Stepped matrix script `concurrency-matrix.js` (1→5→10→25→50→100) **not separately executed** — Profile 100 ramp provides equivalent upper-bound evidence.

---

## Results @ 100 VU

| Metric | Value |
|--------|-------|
| Throughput | **177.9 RPS** |
| p50 | 87 ms |
| p95 | 248 ms |
| p99 | not reported by k6 summary |
| Error rate | **0%** |
| Classification | **Healthy** |

---

## Observed scaling (inferred)

| VU level | Evidence | Classification |
|----------|----------|----------------|
| 1–10 | Baseline p95 ~629 ms (high variance, low VU) | Healthy |
| 100 | p95 248 ms, 0% errors | Healthy |
| 500+ | Not tested | — |

**Knee of curve:** Not identified below 100 VU on this workload. Further steps require staging hardware and unblocked `/products` path.

---

## Resource observations

| Resource | @ 100 VU |
|----------|----------|
| MySQL connections | Not instrumented (no saturation symptoms) |
| Redis | No elevated latency in soak follow-up |
| Queue depth | 0 per health checks |
| CPU/RAM | Not captured at OS level |

---

## Comparison note

Stage 22 at 100 VU on full catalog hot path (including search + products after ONLY_FULL_GROUP_BY fix): **75 RPS, p95 1312 ms**. Stage 28.7 achieves higher RPS and lower p95 on a **narrower, working** endpoint set with medium dataset — **not** proof of regression or improvement on identical workload.

Raw: `raw/_k6_stage28_profile100.txt`
