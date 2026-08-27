# Spike Test Results — Phase 28.7

**Date:** 2026-08-27  
**Profile:** 10 → 50 → 100 → 10 → 0 VU over **4m 30s**

---

## Configuration

k6 custom stages on `stage28-workload.js`:

```text
30s @ 10 VU  →  60s @ 10 VU
15s ramp 50  →  45s @ 50 VU
15s ramp 100 →  45s @ 100 VU
30s ramp 10  →  30s ramp 0
```

---

## Aggregate results

| Metric | Value |
|--------|-------|
| RPS (overall) | **122.06** |
| p50 | **74.84 ms** |
| p95 | **391.65 ms** |
| Error rate | **0%** |
| Iterations | 32,984 |

Raw: `raw/_k6_stage28_spike.txt`

---

## Recovery behavior

| Observation | Result |
|-------------|--------|
| Latency spike at 100 VU | p95 ~392 ms — elevated vs steady 100 VU profile (248 ms) but acceptable |
| Error rate during spike | **0%** |
| Post-spike ramp-down | Completed without timeout storm |
| Queue growth | Not observed (health queue pending = 0) |
| Apparent recovery | **Immediate** on ramp-down (no extended error tail) |

---

## Classification

| Phase | Level | Status |
|-------|-------|--------|
| 10 VU steady | Healthy | p50 low, 0% errors |
| 50 VU | Healthy | No errors |
| 100 VU spike | **Degraded but acceptable** | p95 < 400 ms, 0% errors |
| Recovery | Healthy | Clean ramp-down |

---

## Limits

- Did not spike beyond 100 VU
- Did not include `/products` (500 path)
- Single-machine Docker — not staging multi-node behavior
