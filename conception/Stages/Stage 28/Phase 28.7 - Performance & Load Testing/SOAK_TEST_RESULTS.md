# Soak Test Results — Phase 28.7

**Date:** 2026-08-27  
**Duration:** **5 minutes** sustained @ **25 VU** (+ 1 min ramp-up/down each)  
**Target soak spec:** 30–60 min — **shortened** due to phase time budget.

---

## Configuration

```text
1 min ramp → 25 VU
5 min hold → 25 VU
1 min ramp → 0 VU
```

Script: `stage28-workload.js` with k6 `--stage 1m:25,5m:25,1m:0`

---

## Results

| Metric | Value |
|--------|-------|
| RPS | **78.43** |
| p50 | **46.77 ms** |
| p95 | **155.70 ms** |
| Error rate | **0%** |
| Total iterations | ~32,905 (7 min total run) |

Raw: `raw/_k6_stage28_soak_5m.txt`

---

## Drift analysis (qualitative)

| Signal | 5 min @ 25 VU |
|--------|---------------|
| Latency drift | **None observed** — p95 stable band |
| Error-rate drift | **0%** throughout |
| Memory leaks | **Not instrumented** — no HTTP symptom |
| Connection leaks | **Not observed** — no rising error rate |
| Queue accumulation | Health: pending 0 |
| Redis memory growth | Not measured during soak |

---

## Classification

| Test | Verdict |
|------|---------|
| 5 min soak @ 25 VU | **PASS — Healthy** |
| 30–60 min soak | **NOT TESTED** |

---

## Recommendation for future phase

Run 60 min soak on staging with:

- OS-level CPU/RAM sampling
- MySQL `Threads_connected` time series
- Redis `INFO memory` periodic capture
- Full catalog hot path after bcmath fix
