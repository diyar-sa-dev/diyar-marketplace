# Phase 28.11 — Issue Register (Final)

| ID | Status | Summary |
|----|--------|---------|
| OPT-CACHE-001 | **RESOLVED** | Admin flush → version bump |
| OPT-CACHE-002 | **RESOLVED** | Catalog stampede protection |
| OPT-CACHE-003 | **RESOLVED** | Standardized cache keys |
| OPT-CACHE-008 | **RESOLVED** | Catalog invalidation on product lifecycle |
| OPT-CACHE-010 | **RESOLVED** | UUID admin permission key collision (P0) |
| OPT-CACHE-011 | **RESOLVED** | afterCommit invalidation |
| OPT-CACHE-012 | **RESOLVED** | Atomic version increment |
| OPT-CACHE-013 | **RESOLVED** | Redis failure fallback |
| OPT-CACHE-014 | **RESOLVED** | `diyar:cache:invalidate` command |
| OPT-QUEUE-002 | **RESOLVED** | Webhook job ShouldBeUnique |
| OPT-FE-CACHE-001 | **RESOLVED** | useVendor/useProvider staleTime |
| OPT-FE-CACHE-002 | **RESOLVED** | useSearchProducts staleTime |
| OPT-REDIS-001 | **RESOLVED** | Redis latency verified Docker 7.4.7 |
| OPT-QUEUE-001 | **RESOLVED** | Queue dispatch+worker verified |
| KI-028-054 | **RESOLVED** | Rate limit tests pass on Redis |
| KI-028-053 | **VERIFIED** | Public assistant + safe controls |

---

## Deferred (non-blocking)

| ID | Status | Reason |
|----|--------|--------|
| OPT-CACHE-004..007 | DEFERRED | Category/service/vendor facet gaps — TTL+version acceptable |
| OPT-RATE-001 | DEFERRED | TrustProxies — deploy checklist item |
| KI-028-030 | DEFERRED | MySQL 8 CI infra — not cache scope |

---

## Counts

P0: 0 | P1: 0 | P2: 0 | P3: 3 | P4: 3
