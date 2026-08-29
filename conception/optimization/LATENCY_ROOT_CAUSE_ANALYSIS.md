# Latency Root Cause Analysis

## Request path model

```text
Browser → Nginx → PHP-FPM → Laravel middleware (~5-15ms)
  → Auth (Sanctum/session) → Controller → Service
  → Redis (cache hit: ~1ms) / MySQL (indexed: ~1-10ms)
  → API Resource serialization → JSON
```

## Measured / evidenced bottlenecks

| Bottleneck | Where | Evidence | Fix status |
|------------|-------|----------|------------|
| Admin analytics PHP aggregation | AdminAnalyticsService | OPT-API-002: 438ms wall / 5.6ms SQL | **FIXED** 28.10 |
| Auth /me per navigation | AuthContext | Extra HTTP every route change | **FIXED** OPT-002 |
| Homepage catalog fan-out | 10+ useProducts hooks | Parallel but multi-query | MONITOR |
| ServicesSection waterfall | useCategories then useQueries | Sequential dependency | DEFER |
| Product detail vendor profile | useProduct then useVendor | 2 RTT | Acceptable |
| Checkout preview | cart flush → address → preview | Required sequence | By design |
| BCMath catalog math | Product pricing | Required for money correctness | Not optimizable |

## Rule

**Wall time >> SQL time** usually indicates PHP aggregation, serialization, or N+1 — not missing indexes. Profile before adding indexes.
