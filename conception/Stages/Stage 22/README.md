# Stage 22 — Enterprise Performance

**Status:** PARTIAL  
**Last updated:** 2026-08-23

## Scope

- Database query optimization (N+1 removal)
- API payload discipline (resources/DTOs)
- Redis for cache/queue in production
- React Query cache boundaries
- Load testing (k6)

## Completed optimizations

| Area | Change |
|------|--------|
| Product cards | `withCount`/`withAvg` on `ProductService::cardQuery()` |
| Vendor cards | Batch review aggregates in `VendorService` |
| Catalog search facets | Batch `whereIn` vendor lookup |
| Catalog facets cache | 5 min Redis TTL in `CatalogSearchService` |
| Search suggestions | 45s Redis cache |
| Health endpoint | DB + cache probes; hides `environment` in production |

## Redis / queue

- `.env.example` documents `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`
- CI uses sqlite + database cache (acceptable for CI only)
- Production Redis is **deploy-time** — not enforced in local/CI

## Load testing

- Smoke script: `scripts/performance/smoke.js` (k6)
- Targets: 100 VUs ramp — **not** 25K capacity proof
- Run: `k6 run scripts/performance/smoke.js` (requires k6 + running API)

## React Query

- Marketplace keys: `['marketplace', ...]` / catalog namespaces
- Admin keys: `['admin', ...]` — separate from marketplace

## Acceptance gates

| Gate | Status |
|------|--------|
| N+1 audit (catalog/product/vendor/search) | VERIFIED |
| Index audit (full platform) | PARTIAL |
| Redis production config documented | VERIFIED |
| Queue workers documented | PARTIAL |
| Load test executed | BLOCKED (needs staging + k6) |
| p95/p99 measured | BLOCKED |
| 25K VUs | **NOT VERIFIED** |

See [STAGE_22_COMPLETION_REPORT.md](./STAGE_22_COMPLETION_REPORT.md).
