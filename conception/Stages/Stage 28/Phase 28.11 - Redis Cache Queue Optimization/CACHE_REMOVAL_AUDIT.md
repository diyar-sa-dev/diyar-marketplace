# Cache Removal Audit

Every targeted removal/invalidation path in application code.

---

## `Cache::forget()` — single key removal

| Location | Key scope | Safe? | Notes |
|----------|-----------|-------|-------|
| `AdminPermissionService::forget` | Per admin UUID | YES | Fixed UUID string key (pass 2) |
| `EffectiveConfigService::invalidate` | Per setting key | YES | Targeted |
| `NotificationUnreadCounterService::forget` | Per user UUID | YES | |
| `ChatUnreadCounterService::forgetUserTotal` | Per user UUID | YES | |
| `ChatCacheService::forgetSummary` | Per conversation | YES | |
| `ChatTypingService` | Per conversation+user | YES | |
| `OtpCacheStore` / `EmailOtpCacheStore` | Per identifier+purpose | YES | |
| `NotificationCircuitBreaker::reset` | Per provider | YES | |
| `PlatformHealthService` | Per probe | YES | Stale probe cleanup |
| `CachesQueryResults` | Corrupt entry cleanup | YES | Self-healing |

---

## Version bump (preferred for groups)

| Location | Version key | Trigger |
|----------|-------------|---------|
| `VersionedCache::bump` | Configurable | Atomic increment |
| `CatalogCacheInvalidator` | `diyar:catalog:version` | Product/admin product mutations |
| `AdminPermissionService::forgetAll` | `diyar:admin:permissions:version` | Role permission sync |
| `AnalyticsCache::invalidateScope` | `analytics:version:{scope}:{id}` | Domain events (post-commit) |
| `ShippingConfigCache::bump` | `shipping:config:version` | Shipping admin changes |
| `BlogProjectCache::forgetBlog/Projects` | `diyar:blog:cache-v` / projects | CMS publish |

---

## `afterCommit` deferred invalidation (pass 2)

| Service | Method | Reason |
|---------|--------|--------|
| `CatalogCacheInvalidator` | `invalidateSearchCachesAfterCommit` | Avoid invalidation before rollback |
| `AdminPermissionService` | `forgetAllAfterCommit` | Role sync transaction |
| `AdminPermissionService` | `forgetAfterCommit` | User role assign/revoke |
| `ProductService` | uses afterCommit invalidator | create/update/archive |
| `AdminProductService` | uses afterCommit invalidator | activate/deactivate/archive |

---

## Frequency / risk

| Pattern | Risk | Mitigation |
|---------|------|------------|
| Per-message chat forget | Medium churn | Short TTL + targeted keys |
| Settings invalidate | Low | Single key per change |
| Version bump on product save | Low | O(1) increment |

---

## Verdict

**Cache Removal: PASS** — all removals are scoped; no cross-tenant key sharing after UUID fix.
