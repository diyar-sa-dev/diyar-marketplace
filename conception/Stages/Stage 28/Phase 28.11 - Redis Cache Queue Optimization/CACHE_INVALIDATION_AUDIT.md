# Cache Invalidation Audit

---

## Implemented (28.11)

| Entity change | Invalidation mechanism | Files |
|---------------|------------------------|-------|
| Product create/update/archive (vendor) | `CatalogCacheInvalidator::invalidateSearchCaches()` | `ProductService` |
| Product activate/deactivate/archive (admin) | Same | `AdminProductService` |
| Admin role permission sync | Version bump `diyar:admin:permissions:version` | `AdminPermissionService::forgetAll()` |
| Single admin user role change | `forget($user)` | `AdminUserService` |
| Analytics commerce events | Scope version bump | `AnalyticsCacheInvalidator` + listeners |
| System settings | Key/group forget | `EffectiveConfigService` |
| Chat messages/reads | Targeted forget | `ChatCacheService` |
| Shipping config | Version bump | `ShippingConfigCache` |

---

## TTL-only (acceptable)

| Cache | TTL | Rationale |
|-------|-----|-----------|
| Catalog facets/suggestions | 300s / 45s | Public data; version bump on product lifecycle |
| OTP / idempotency | Short | Security semantics |
| Rate limit counters | Framework | Auto-expire |
| Health probes | Configurable | Operational |

---

## Gaps (documented, not blocking)

| Gap | ID | Priority | Trigger |
|-----|-----|----------|---------|
| Category CRUD does not bump catalog version | OPT-CACHE-004 | P3 | If category admin churn causes stale facets >5min |
| Service catalog mutations | OPT-CACHE-005 | P3 | Service search facet parity |
| Vendor profile changes (name/slug) | OPT-CACHE-006 | P3 | Facet vendor labels until TTL |
| Inventory-only stock change | OPT-CACHE-007 | P4 | Facets filter by visibility not stock |

---

## Anti-patterns removed

| Before | After |
|--------|-------|
| `AdminPermissionService::forgetAll()` → `Cache::flush()` | Version bump — preserves unrelated cache entries |

**Never use global flush in production hot paths.**
