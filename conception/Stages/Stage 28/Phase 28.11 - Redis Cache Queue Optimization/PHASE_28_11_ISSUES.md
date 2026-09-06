# Phase 28.11 — Issues Register

---

## Resolved this phase

| ID | Severity | Description | Resolution |
|----|----------|-------------|------------|
| OPT-CACHE-001 | P1 | `AdminPermissionService::forgetAll()` called `Cache::flush()` | Version bump via `VersionedCache` |
| OPT-CACHE-002 | P1 | Catalog search facets lacked stampede protection | `StampedeSafeCache` + config TTL |
| OPT-CACHE-003 | P2 | Inconsistent catalog cache keys | `CacheKeys` standardization |
| OPT-CACHE-008 | P2 | No catalog cache invalidation on product change | `CatalogCacheInvalidator` wired |
| OPT-QUEUE-002 | P2 | Payment webhook job not unique | `ShouldBeUnique` on event ID |
| OPT-FE-CACHE-001 | P2 | `useVendor` / `useProvider` forced `staleTime: 0` | Set to 60_000 ms |
| OPT-FE-CACHE-002 | P3 | Search hook no explicit staleTime | 30_000 ms |

---

## Open / deferred

| ID | Severity | Description | Phase |
|----|----------|-------------|-------|
| OPT-REDIS-001 | P4 | Re-verify Redis latency @ 500+ VU | Staging load test |
| OPT-REDIS-002 | P3 | Optional Redis in CI | Infra |
| OPT-QUEUE-001 | P3 | Worker throughput benchmark | Staging |
| OPT-CACHE-004 | P3 | Category admin → catalog version bump | Future |
| OPT-CACHE-005 | P3 | Service catalog invalidation | Future |
| OPT-CACHE-006 | P3 | Vendor profile change → facet label freshness | TTL acceptable |
| OPT-CACHE-007 | P4 | Inventory-only changes | TTL acceptable |
| OPT-QUEUE-003 | P4 | Explicit tries on audit log job | Future |
| OPT-RATE-001 | P3 | Production TrustProxies verification | Deploy checklist |
| KI-028-030 | P2 | MySQL 8 full CI | Infra (unchanged) |
| KI-028-055 | P2 | B2B HTML sanitize | Frontend |
| KI-028-056 | P2 | CSP | Security phase |

---

## Cross-reference status

| Finding | Status |
|---------|--------|
| KI-028-053 (public assistant) | VERIFIED — throttle + tests; no unsafe caching |
| KI-028-054 (rate limits) | RESOLVED (28.10) |
| KI-028-037/057 (assistant tests) | RESOLVED (28.10) |
| OPT-API-005 (assistant limiter) | Retained; complements 28.11 |
| DB-PAG-001 | ACCEPTED WITH SCALE TRIGGER (28.9) |

---

## Counts

| Priority | Open |
|----------|------|
| P0 | 0 |
| P1 | 0 |
| P2 | 3 (infra/staging verification) |
| P3 | 6 |
| P4 | 4 |
