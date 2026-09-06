# Phase 28.11 — Deep Pass Issues

---

## Resolved in deep pass

| ID | Sev | Issue | Fix |
|----|-----|-------|-----|
| OPT-CACHE-010 | **P0** | Admin permission cache key `(int)` on UUID → all admins shared key `0` | String UUID in `CacheKeys::adminPermissions` |
| OPT-CACHE-011 | **P1** | Cache invalidation inside DB transactions | `*AfterCommit` methods |
| OPT-CACHE-012 | **P2** | Non-atomic version bump | `Cache::increment` |
| OPT-CACHE-013 | **P2** | No Redis failure fallback on hot cache paths | try/catch in StampedeSafeCache + AnalyticsCache |
| OPT-CACHE-014 | **P3** | No safe ops cache clear command | `php artisan diyar:cache:invalidate {domain}` |
| OPT-INFRA-003 | **P3** | Redis DB separation undocumented | `.env.example` REDIS_DB / REDIS_CACHE_DB |

---

## Open (environment / later phase)

| ID | Sev | Issue | Phase |
|----|-----|-------|-------|
| OPT-REDIS-001 | P4 | Redis latency @ 500+ VU | Staging load |
| OPT-QUEUE-001 | P3 | Worker jobs/sec benchmark | Staging |
| OPT-CACHE-004..007 | P3/P4 | Category/service/vendor facet invalidation gaps | Future |
| OPT-RATE-001 | P3 | TrustProxies production verify | Deploy |
| KI-028-030 | P2 | MySQL 8 CI | Infra |

---

## Cross-reference updates

| Finding | Deep pass status |
|---------|------------------|
| KI-028-054 | RESOLVED — tests still pass |
| KI-028-053 | VERIFIED — no AI response cache |
| First-pass OPT-CACHE-001 | Enhanced with afterCommit |
| First-pass admin key v4 | Fixed UUID collision |

---

## Counts (post deep pass)

| Priority | Open |
|----------|------|
| P0 | 0 |
| P1 | 0 |
| P2 | 2 (staging verify) |
| P3 | 5 |
| P4 | 4 |
