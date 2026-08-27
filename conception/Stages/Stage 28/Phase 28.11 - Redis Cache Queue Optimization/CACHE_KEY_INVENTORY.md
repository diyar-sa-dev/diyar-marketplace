# Cache Key Inventory

**Convention:** `diyar:{domain}:{resource}:{identifier}:v{N}` (+ Laravel `CACHE_PREFIX`)

| Location | Purpose | Key pattern | TTL | Store | Invalidation | Risk | Traffic |
|----------|---------|-------------|-----|-------|--------------|------|---------|
| `CatalogSearchService` | Search facets | `diyar:catalog:search:facets:v1:{ver}:{hash}` | 300s | redis | Catalog version bump | Low | High (public search) |
| `CatalogSearchSuggestionService` | Autocomplete | `diyar:catalog:search:suggestions:v1:{ver}:{hash}:{limit}` | 45s | redis | Catalog version bump | Low | High |
| `AdminPermissionService` | Admin RBAC | `diyar:admin:permissions:v4:{userId}:{ver}` | 3600s | redis | Admin version bump / per-user forget | Medium | Medium (admin) |
| `AnalyticsCache` | KPI/charts | `analytics:{scope}:{id}:{metric}:{dates}:{hash}` | 60–900s | redis | Scope version bump | Low | Medium |
| `AffiliateDashboardService` | Affiliate KPIs | `diyar:affiliate:dashboard:{profileId}:{ver}:...` | 120s | redis | Profile version | Low | Low |
| `ShippingConfigCache` | Shipping rules | Version key + derived keys | 10 min zones | redis | Config version bump | Low | Medium checkout |
| `EffectiveConfigService` | System settings | `diyar:config:{group}.{key}` | Long | redis | Setting update listener | Low | Medium |
| `ChatCacheService` | Conversation summary | `{prefix}summary:{id}` | 120s | redis | Message/read events | Medium | Medium |
| `ChatUnreadCounterService` | Unread count | `{prefix}unread:{userId}` | 300s | redis | Read/mark events | Low | Medium |
| `NotificationUnreadCounterService` | Unread count | `diyar:notifications:unread:{userId}` | 300s | redis | Delivery + reconcile | Low | High |
| `NotificationCircuitBreaker` | Provider breaker | `diyar:notifications:breaker:*` | Dynamic | redis | Failure thresholds | Low | Low |
| `B2bCache` / `BlogProjectCache` | CMS lists | `diyar:b2b:*` / `diyar:blog:*` | Config | redis | Version bump | Low | Low |
| `PlatformHealthService` | Health probes | `diyar:health:probe:{name}` | Env (0=off) | redis | TTL | Low | Low |
| `EmailOtpCacheStore` / `OtpCacheStore` | OTP codes | Purpose-scoped | Minutes | redis | Verify/consume | High if leaked | Medium |
| `AffiliateAttributionService` | Click attribution | User/session scoped | Window | redis | TTL | Medium | Medium |
| `CheckoutController` | Idempotency | Request-scoped `Cache::add` | Short | redis | Single use | High | Checkout |
| `ProductViewAnalyticsService` | View dedupe | Session/product | 1800s | redis | TTL | Low | High |
| `ZoneResolver` | Shipping zone | Carrier+address hash | 600s | redis | Config version | Low | Checkout |

**`Cache::flush()` in application code:** **0** (removed from `AdminPermissionService`; tests only).
