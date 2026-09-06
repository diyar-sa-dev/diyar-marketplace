# Scale Model — Traffic Profiles & Capacity

**Date:** 2026-08-29  
**Companion:** [SCALABILITY_MODEL.md](./SCALABILITY_MODEL.md), [SCALABILITY_MASTER_PLAN.md](./SCALABILITY_MASTER_PLAN.md)

---

## 1M request scenarios

### Scenario A: 1M requests / 24 hours (normal heavy day)

| Metric | Value |
|--------|-------|
| Average RPS | 11.6 |
| Peak RPS (3×) | ~35 |
| Concurrent users (est.) | 50–150 |
| DB queries/s (uncached worst) | ~175 |
| Redis ops/s | ~35 |
| Tier | **A/B — Limited/Medium VPS** |
| Rigor | **PROJECTED** |

### Scenario B: 1M requests / 1 hour (campaign flash)

| Metric | Value |
|--------|-------|
| Average RPS | 278 |
| Peak RPS (2×) | ~555 |
| Concurrent users (est.) | 500–1500 |
| DB queries/s (80% cache hit) | ~830 |
| Redis ops/s | ~555 |
| Tier | **C — Horizontal (2–3 nodes)** |
| Rigor | **PROJECTED** |

### Scenario C: 1M requests / 10 minutes (attack/spike)

| Metric | Value |
|--------|-------|
| Average RPS | 1667 |
| Concurrent users | Unknown |
| Tier | **C + WAF/CDN** |
| Application alone | **INSUFFICIENT** |
| Rigor | **NOT YET TESTED** |

---

## Traffic profiles

### Normal traffic
- Browse-heavy, 85% GET
- Cache hit rate 70–85%
- Queue: low steady state

### Busy traffic (sale event)
- Search + checkout spike
- Cache hit rate 60–70%
- Queue: notification burst

### Peak traffic
- FPM queue forms
- Rate limits activate
- Priority: checkout > browse

### Spike traffic
- Requires CDN + WAF
- Rate limits + captcha on auth
- May degrade non-critical (assistant off)

### Failure traffic
- Redis down: DB fallback, slower
- MySQL slow: timeouts, 503 on writes
- OpenAI down: assistant 503, rest OK

---

## Resource model (medium VPS, Tier B)

| Resource | Allocation | Limit |
|----------|------------|-------|
| RAM | 4 GB | FPM 20 × 64 MB ≈ 1.3 GB |
| PHP-FPM workers | 20 | ~8 req/s each → ~160 RPS theoretical |
| MySQL connections | 80 max | Budget 56 used |
| Redis | 512 MB | ~100k cache keys est. |
| Queue workers | 6 | ~50 jobs/s est. |
| Network | 1 Gbps VPS | Not bottleneck until CDN |

---

## Per-request resource estimate

| Operation | DB queries | Redis ops | External | Queue jobs |
|-----------|------------|-----------|----------|------------|
| Product list (cached) | 0–1 | 2 | 0 | 0 |
| Product list (miss) | 2–4 | 2 | 0 | 0 |
| Product detail | 3–5 | 1 | 0 | 0 |
| Search | 3–6 | 3 | 0 | 0 |
| Login | 2–4 | 1 | 0 | 0 |
| Checkout | 8–15 | 2 | 1 payment | 1–3 |
| Assistant | 1 | 0 | 1 OpenAI | 0 |

---

## Scale milestones

```text
Current     →  10k users   →  100k users  →  1M req/hour
   ↓              ↓               ↓              ↓
Small VPS    Medium VPS      Large/Horizontal   LB+3 nodes+CDN
~30 RPS      ~80 RPS         ~200 RPS           ~500+ RPS
```

---

## Capacity claims summary

| Claim | Rigor |
|-------|-------|
| 35 RPS sustained on medium VPS | PROJECTED |
| 160 RPS theoretical FPM max | PROJECTED (math) |
| 1M req/day on Tier B | PROJECTED |
| 1M req/hour | PROJECTED needs horizontal |
| k6 100 VU smoke pass | VALIDATED (CI exists) |
| 500 VU local | NOT YET TESTED |

---

## Hostinger / VPS guidance

| VPS size | Max comfortable RPS | Max concurrent | Notes |
|----------|--------------------|--------------------|-------|
| 2 GB | ~15 | ~50 | Dev/demo only |
| 4 GB | ~80 | ~200 | Production MVP |
| 8 GB | ~200 | ~500 | Single-node growth |
| 2×8 GB + LB | ~400+ | ~1000 | 1M/hour target |

Upgrade triggers: FPM >80% sustained, MySQL CPU >70%, queue lag >5 min, p95 > budget.
