# Scalability Master Plan — DIYAR Marketplace

**Date:** 2026-08-29  
**Objective:** Start efficient on limited VPS; grow to horizontal production without rewrite.

---

## Architecture (unchanged)

```text
React SPA → CDN/Nginx → Laravel PHP-FPM → Redis → MySQL 8 → Queue workers
```

No microservices, Kafka, K8s, or sharding unless metrics prove necessity.

---

## Tier strategy

| Tier | Profile | Target load | Key config |
|------|---------|-------------|------------|
| A | Limited VPS (2–4 CPU, 4–8 GB) | <100 concurrent, <30 RPS sustained | FPM 10–20, Redis 256–512 MB |
| B | Production VPS (4–8 CPU, 8–16 GB) | 100–500 concurrent, 30–150 RPS | FPM 20–36, CDN, 6–8 workers |
| C | Horizontal (2–5 app nodes) | 500–2000 concurrent, 150–500+ RPS | LB, shared Redis/MySQL, object storage |

---

## 1M request objective (capacity math)

**1,000,000 requests** must be interpreted by time window:

| Profile | Window | Avg RPS | Peak factor | Peak RPS | Tier required |
|---------|--------|---------|-------------|----------|---------------|
| Normal day | 24h | ~11.6 | 3× | ~35 | Tier A/B |
| Busy day | 12h active | ~23 | 4× | ~90 | Tier B |
| Campaign hour | 1h | ~278 | 2× | ~555 | Tier C (2–3 nodes) |
| Spike | 10 min | ~1667 | — | ~1667 | Tier C + CDN/WAF |

**Assumptions:** 70% cacheable reads, 15 DB queries/request uncached (worst), 2 Redis ops/request.

At **278 RPS** (1M/hour campaign):
- PHP-FPM: 36 workers × ~8 req/s each = ~288 RPS theoretical (**PROJECTED**)
- MySQL: 278 × 15 = 4170 QPS uncached — **requires Redis cache hit rate >80%** (**PROJECTED**)
- Redis: 556 ops/s — single instance OK (**VALIDATED** config)

**Claim rigor:** 1M/day on medium VPS = **PROJECTED feasible** with CDN + cache. 1M/hour = **PROJECTED requires horizontal**. 1M/10min = **NOT YET TESTED** — needs WAF + multi-node.

---

## Implementation phases

### Phase 1 — NOW (completed this pass)

- [x] Public catalog deep page cap (`PaginationBounds`, max page 200)
- [x] External HTTP connect/request timeouts (FCM, OpenAI)
- [x] CI MySQL index EXPLAIN job
- [x] Master gap/risk documentation

### Phase 2 — BEFORE PRODUCTION

- [ ] nginx CSP + HSTS
- [ ] Hostinger bcmath/OPcache verify
- [ ] Staging k6 smoke (50–100 VU) with evidence
- [ ] Redis integration on CI/staging
- [ ] Cloudflare/WAF for DDoS (documented requirement)

### Phase 3 — AT SCALE (monitor triggers)

- [ ] Homepage aggregate API (OPT-004) when home p95 >200ms
- [ ] Cursor pagination (DB-PAG-001) when catalog >50k SKUs
- [ ] Read replica for admin analytics
- [ ] Object storage for media

### Phase 4 — HORIZONTAL

- [ ] Load balancer + 2–3 app nodes
- [ ] Reverb WebSocket scaling
- [ ] Queue worker scaling (Supervisor)

---

## Connection budget (medium VPS)

```text
FPM 20 × 1.2 + queue 6 × 2 + 20 admin = 56 → MySQL max_connections ≥ 80
```

---

## Cross-references

- [SCALE_MODEL.md](./SCALE_MODEL.md) — traffic profiles
- [CAPACITY_PLAN.md](./CAPACITY_PLAN.md) — 10k→100k user stages
- [LATENCY_BUDGET.md](./LATENCY_BUDGET.md) — per-layer targets
- [PRODUCTION_RISK_REGISTER.md](./PRODUCTION_RISK_REGISTER.md) — prioritized risks
- [MASTER_OPTIMIZATION_REGISTER.md](./MASTER_OPTIMIZATION_REGISTER.md) — issue tracker
