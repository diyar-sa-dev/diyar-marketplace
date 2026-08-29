# Performance Architecture — Latency & Bottleneck Model

**Date:** 2026-08-29

---

## Request path

```text
Browser
  ↓ DNS/TLS (CDN edge if configured)
CDN / Nginx (static) OR Nginx → PHP-FPM (API)
  ↓
Laravel middleware stack
  ↓ ApplyHttpCachePolicy, SecurityHeaders, Sanctum, throttle
Controller → Service → {Redis, MySQL, Queue, External API}
  ↓
JSON serialization → Response
  ↓
Browser: React hydrate, TanStack Query, lazy chunks
```

---

## Latency budgets

| Endpoint class | P95 target | Current evidence | Rigor |
|----------------|------------|------------------|-------|
| Static assets (CDN) | <50ms | Immutable hashed chunks in Vite build | **VALIDATED** (build) |
| Public catalog list | <200ms | Composite indexes; EXPLAIN pass | **VALIDATED** (MySQL tests) |
| Public product detail | <200ms | Eager-load patterns in services | **PROJECTED** |
| Catalog search | <300ms | Throttled; indexed LIKE | **PROJECTED** |
| Auth login/register | <300ms | Throttle + bcrypt | **PROJECTED** |
| Authenticated reads | <300ms | Policy cache | **PROJECTED** |
| Checkout create | <500ms | BCMath + TX | **VALIDATED** (E2E) |
| Payment webhook | <1000ms | Async job dispatch | **VALIDATED** (tests) |
| Admin analytics | <800ms | OPT-API-002 consolidated queries | **VALIDATED** (code) |
| Assistant chat | <45000ms | OpenAI bound; 45s timeout | **VALIDATED** (config) |
| Cache hit (Redis) | <50ms | VersionedCache | **NOT YET TESTED** (Redis offline) |

---

## Known latency root causes

| ID | Layer | Root cause | Impact | Fix status |
|----|-------|------------|--------|------------|
| LAT-001 | Frontend | Homepage 10+ parallel API calls | High TTFB on home | **MONITOR** |
| LAT-002 | Frontend | Auth `/me` per navigation | +1 RTT/page | **FIXED** (OPT-002) |
| LAT-003 | Frontend | ServicesSection category waterfall | +1 RTT | **DEFER** |
| LAT-004 | Database | Deep OFFSET at high page numbers | Slow pagination | **ACCEPTED** (DB-PAG-001) |
| LAT-005 | Delivery | `/app-mockup.png` proxy error in preview | E2E noise | **FIXED** (ENT-002) |
| LAT-006 | External | OpenAI assistant latency | User wait | Inherent; disable toggle |

---

## Bottleneck hierarchy (predicted)

```text
1k users:   No bottleneck (dev machine)
10k users:  PHP-FPM worker queue (marketing spikes)
25k users:  Homepage API fan-out + search load
50k users:  MySQL read path (analytics) + Redis memory
100k users: Single-node CPU/RAM ceiling → requires horizontal app tier
```

---

## Frontend performance (Phase 28.12 re-verified)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Main entry JS gzip | <40 KB | 37.15 KB | **PASS** |
| Route-based code splitting | Yes | Lazy routes + manualChunks | **PASS** |
| TanStack Query staleTime | Sensible defaults | Per-hook config | **PASS** |
| Auth bootstrap dedup | Once per session | AuthContext fix | **FIXED** |
| recharts chunk | Admin-only | vendor-recharts isolated | **PASS** |

---

## Database query performance

| Pattern | Status | Evidence |
|---------|--------|----------|
| Catalog list index range scan | **VALIDATED** | `CatalogIndexExplainTest` |
| Order list by vendor | **VALIDATED** | Composite indexes |
| N+1 on hot paths | **VALIDATED** | Query count tests in feature suite |
| Admin analytics raw aggregates | **FIXED** | Phase 28.10 |
| Unbounded public queries | **MONITOR** | Category tree, search |

---

## Caching layers (must not fight)

| Layer | Policy | Owner |
|-------|--------|-------|
| Browser | Immutable `assets/*` (Vite hash) | Nginx/CDN |
| CDN | Long TTL static; no HTML cache | Deploy config |
| Nginx | `production.conf.example` gzip + cache headers | Deploy |
| Laravel HTTP | `ApplyHttpCachePolicy` — no-store on auth | **PROVEN** |
| Redis | Versioned domain keys; no flush in prod | **PROVEN** |
| TanStack Query | Client staleTime/gcTime | Frontend |

---

## Measurement gaps (honest)

| Measurement | Status |
|-------------|--------|
| Live P95 API latency | **NOT YET TESTED** |
| 10/50/100 VU load test | **NOT YET TESTED** |
| Redis cache hit ratio | **NOT YET TESTED** |
| Web Vitals LCP/INP | **NOT YET TESTED** |
| CDN edge latency | **NOT YET TESTED** |

Recommend: run `scripts/test-phpunit-mysql.ps1` on staging + optional k6 smoke at 50 VU before claiming production SLOs.
