# Latency Final Budget — Phase 28.17

## Critical Journey: Homepage Load (guest)

| Segment | Budget (ms) | Measured / Notes |
|---------|-------------:|------------------|
| CDN / static | 50–150 | NOT RUN (Lighthouse) |
| Nginx | 5–15 | Included in API path |
| Laravel Octane | 50–200 | **91–118 ms p95 @ 10–25 RPS** (k6 mix) |
| MySQL | 20–80 | Dominant at catalog/search |
| Redis | 1–10 | Cache hit on categories/theme |
| Network RTT | 20–100 | Dev localhost — not representative |
| Frontend parse/hydrate | 100–500 | NOT RUN |
| **Total TTFB target** | **< 600** | **PASS @ ≤25 RPS API** |

---

## Critical Journey: Product Catalog

| Segment | @ 25 RPS p95 | @ 50 RPS p95 |
|---------|-------------:|-------------:|
| Mixed API | 118 ms | 825 ms |
| Target | < 300 ms | < 300 ms |
| Status | **PASS** | **FAIL** |

---

## Dominant Contributor

At saturation (~50 RPS): **backend processing + MySQL catalog queries** — not Redis, not network.

**Optimize first:** product list queries, worker count, VPS CPU — not new microservices.

---

## Homepage API Count

| State | Requests |
|-------|--------:|
| Before aggregate | ~19 (documented) |
| After `/storefront/home` | Reduced — **browser count NOT RE-MEASURED** |

---

## Targets vs Measured

| Metric | Target | Measured | Pass |
|--------|-------:|----------|:----:|
| API p95 (critical) | 300 ms | 118 ms @ 25 RPS | ✓ |
| LCP | 2.5 s | NOT RUN | — |
| INP | 200 ms | NOT RUN | — |
| CLS | 0.1 | NOT RUN | — |
