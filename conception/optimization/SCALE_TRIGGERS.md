# Scale Triggers — DIYAR Marketplace

**Date:** 2026-08-29  
**Based on:** Measured Octane rps10–50 on dev Docker (see `K6_CAPACITY_RESULTS.md`)

---

## Vertical Scale (single VPS)

| Trigger | Action |
|---------|--------|
| CPU > 75% sustained during peak | Upgrade VPS CPU tier |
| RAM > 75% (Octane workers + MySQL buffer) | Add RAM; reduce Octane workers if OOM |
| p95 > 300 ms public reads at **measured** RPS | Optimize cache TTL / reduce workers contention |
| Actual RPS < 80% of k6 target with p95 > 2 s | At capacity — scale up or out |
| MySQL connections > 80% max_connections | Reduce FPM/Octane workers or raise MySQL limit |
| Redis memory > 80% maxmemory | Increase Redis memory or tighten TTLs |

---

## Application Scale

| Trigger | Action |
|---------|--------|
| Safe RPS exceeded on single node | Add second app node + load balancer |
| Queue depth > 1000 for > 5 min | Add queue workers |
| Catalog p95 rises with product count > 50k | Verify indexes; consider read replica for reports |
| Media bandwidth high | CDN for `/storage` and `/assets` |

---

## When to Choose Octane vs FPM

| Condition | Choice |
|-----------|--------|
| Measured p95 at target RPS (Octane << FPM) | **Octane** (evidence: 28× p95 at rps10) |
| Ops team cannot manage persistent workers | **FPM** with tuned `pm.max_children` |
| Memory leaks suspected in Octane | Recycle workers (`max-requests=2000`) + fix leaks |

---

## Re-benchmark Required

Before claiming **278 RPS** or **1M requests/hour**:

1. Deploy to target VPS (2–4 vCPU, 4–8 GB RAM minimum)
2. Run k6 rps10 → rps25 → rps50 → rps100 until saturation
3. Run 15-minute soak at highest passing RPS
4. Update `PLATFORM_MEASUREMENTS_AND_PRODUCTION_CAPACITY.md`
