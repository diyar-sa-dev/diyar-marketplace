# Final Scaling Model — Phase 28.17

Based on **MEASURED** k6 (dev Docker, Aug 2026) + **PROJECTED** production tiers.

---

## Tier A — Dev / CI Docker (MEASURED)

| Resource | Config |
|----------|--------|
| Octane workers | 4 |
| MySQL | 8.0 single instance |
| Redis | 7, 256 MB policy (prod-like compose) |

| Metric | Value |
|--------|------:|
| Safe RPS | **25** |
| Saturation RPS | **~50** |
| p95 @ safe | **118 ms** |
| p95 @ saturation | **825 ms** |

**Use for:** regression load smoke only — not production sizing.

---

## Tier B — Single VPS Production (PROJECTED)

| Resource | Assumption |
|----------|------------|
| 8 vCPU / 16 GB RAM | KSA VPS |
| Octane workers | 8 |
| Nginx reverse proxy | yes |
| CDN static | yes |

| Metric | Projected |
|--------|----------:|
| Safe RPS | 75–100 |
| p95 target | < 300 ms |

**Requires:** k6 validation on actual VPS — **NOT VERIFIED** in 28.17.

---

## Tier C — Horizontal (PROJECTED)

| Trigger | Action |
|---------|--------|
| CPU > 75% sustained 15 min | +1 API node |
| p95 > 300 ms sustained | +CDN cache TTL / +worker |
| MySQL connections > 80% | read replica or PgBouncer-style pooler |
| Redis memory > 80% | increase maxmemory / split cache namespace |
| Queue depth > 5000 | +2 queue workers |

---

## Scale Triggers (evidence-adjusted)

Replace theoretical 278 RPS trigger with:

```text
MEASURED safe:     25 RPS  (dev Docker)
MEASURED saturate: 50 RPS  (dev Docker)
TARGET production: 100 RPS (Tier B — verify before launch)
NOT VERIFIED:      278 RPS (1M/hour)
```

---

## 100k Registered Users

See [FINAL_CAPACITY_CERTIFICATION.md](./FINAL_CAPACITY_CERTIFICATION.md) — architecture supports growth via horizontal API + CDN without rewrite, but **must be validated** on staging hardware.
