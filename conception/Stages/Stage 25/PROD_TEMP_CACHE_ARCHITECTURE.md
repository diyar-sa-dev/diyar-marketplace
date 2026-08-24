# PROD_TEMP Cache Architecture

**Branch:** `prod-temp`  
**Production drivers:** `CACHE_STORE=redis`, `SESSION_DRIVER=redis`, `QUEUE_CONNECTION=redis`

## Key namespaces

| Key pattern | TTL | Scope | Invalidation |
|-------------|-----|-------|----------------|
| `diyar:catalog:categories:tree:{type}` | 900s | Public | Category CRUD → `CategoryService::forgetTreeCache()` |
| `diyar:search:facets:v{N}:…` | 300s | Public search | `CatalogCacheVersion::bump()` on product mutations |
| `diyar:search:suggestions:v{N}:…` | 45s | Autocomplete | Same version bump |
| `diyar:catalog:cache_version` | permanent | Global catalog | Incremented on product create/update/archive |
| `diyar:vendor:{id}:dashboard:overview` | 90s | Vendor-scoped | TTL expiry; short stale window |
| `diyar:affiliate:dashboard:…` | 120s | Affiliate-scoped | Version bump in service |
| `diyar:settings:{key}` | 3600s | Platform | Settings mutation listeners |
| `diyar:chat:…` | 120–300s | User/conversation | Per-user forget on message read |

## What is NOT cached

- Order/payment/inventory authoritative state
- Authorization decisions
- Checkout preview totals
- Passwords, tokens, payment secrets

## Failure behavior

- Catalog/search: Redis miss → DB query (safe degradation)
- Production enforces Redis (`DIYAR_ENFORCE_REDIS_IN_PRODUCTION=true`) — boot fails if Redis unavailable (intentional for prod)
- Queue worker optional on FREE tier — notifications may delay; critical checkout remains sync

## Obsolete DB cache tables

Laravel `cache`, `cache_locks`, `jobs`, `failed_jobs` migrations remain for dev/fallback. Production uses Redis; do not use `CACHE_STORE=database` on prod-temp.

## Config (`config/diyar.php`)

```env
DIYAR_CATEGORY_TREE_CACHE_SECONDS=900
DIYAR_SEARCH_FACETS_CACHE_SECONDS=300
DIYAR_SEARCH_SUGGESTIONS_CACHE_SECONDS=45
DIYAR_VENDOR_DASHBOARD_CACHE_SECONDS=90
```
