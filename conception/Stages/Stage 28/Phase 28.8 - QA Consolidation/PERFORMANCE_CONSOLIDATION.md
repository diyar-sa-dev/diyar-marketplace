# Performance Consolidation — Stage 28

**Source:** Phase 28.7  
**Verdict:** **PASS WITH CONDITIONS**

---

## Authoritative measurements (local Docker Octane + MySQL 8)

| Profile | RPS | p50 | p95 | Errors |
|---------|-----|-----|-----|--------|
| 100 VU | **178** | 87 ms | **248 ms** | 0% |
| Spike 10→100 | 122 | 75 ms | 392 ms | 0% |
| Soak 25 VU × 5 min | 78 | 47 ms | 156 ms | 0% |
| Redis cache p95 | — | — | **1.35 ms** | — |

**NOT:** Hostinger production benchmark. **NOT** an SLA.

---

## PERF-028-001 / OPT-INFRA-002 resolution

| Question | Answer |
|----------|--------|
| Is `/products` broken in production? | **Unknown — verify bcmath on Hostinger PHP-FPM** |
| Is it broken in load-test Docker? | **Yes** — Octane image lacks bcmath |
| Production uses Octane Docker? | **No** — PHP-FPM + Nginx per architecture |
| Classification | **ENVIRONMENT GAP** for load testing; **deploy verification** for production |

---

## Optimization candidates (not blockers)

| ID | Finding | @ current scale |
|----|---------|-----------------|
| OPT-DB-001 | products scan+filesort | ~0.3 ms @ 500 rows |
| OPT-API-002 | admin funnel 438 ms / 7 queries | Acceptable admin |
| OPT-FE-001 | 499 KB JS | KI-028-018 baseline |
| OPT-REDIS-001 | Redis fast | Not limiting |

---

## Not measured

- 60 min soak
- 25K / 500+ VU
- Checkout/cart authenticated load
- Hostinger VPS
- Web Vitals (LCP/INP)
- Assistant load (by design)

---

## Verdict

```text
PERFORMANCE READY: PASS WITH CONDITIONS
```

Conditions: not production-certified; Docker load path incomplete until OPT-INFRA-002; staging benchmark recommended before scale claims.

Optimization: **NOT STARTED**.
