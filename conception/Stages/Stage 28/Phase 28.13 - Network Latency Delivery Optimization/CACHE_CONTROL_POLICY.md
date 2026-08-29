# Cache-Control Policy — Phase 28.13

## Layer model

```text
Browser
  ↓ Cache-Control from Nginx (static) or Laravel (API)
CDN (optional)
  ↓ Respects Cache-Control + Vary; never caches Cookie requests
Nginx origin
  ↓
Laravel ApplyHttpCachePolicy + Redis (28.11)
  ↓
MySQL
```

## Static assets (Nginx)

| Resource | Policy | Rationale |
|----------|--------|-----------|
| `/assets/*` (hashed JS/CSS) | `public, max-age=31536000, immutable` | Content-hashed; safe forever |
| `/index.html` | `no-cache, must-revalidate` | Deployment propagation |
| SPA fallback routes | `no-cache, must-revalidate` | Avoid stale shell |
| `/storage/*` public media | `public, max-age=604800` (7d) | Reduce origin load; URLs should be stable |
| favicon, manifest, robots | `public, max-age=604800` | Low churn |

## API (Laravel `ApplyHttpCachePolicy`)

| Request class | Policy |
|---------------|--------|
| Authenticated user/admin | `private, no-store, no-cache, must-revalidate` |
| Any session cookie (Sanctum SPA) | `private, no-store` |
| Mutating methods (POST/PATCH/DELETE) | `private, no-store` |
| Anonymous public GET (catalog, blog, B2B public, platform config) | `public, max-age=60, stale-while-revalidate=120` |
| Platform theme/commerce | `public, max-age=300` |
| Health/readiness | `public, max-age=15, must-revalidate` |
| All other API | `private, no-store` |

## Vary headers

| Context | Vary |
|---------|------|
| Private responses | `Cookie, Authorization, Accept-Language, Origin` |
| Public catalog | `Accept-Language, Origin` |

## CDN rules (when enabled)

1. **Do not cache** requests with `Cookie` or `Authorization` headers.
2. **Do cache** anonymous GET to public catalog paths only when origin returns `public`.
3. **Purge** catalog CDN keys on admin publish via versioned Redis invalidation (28.11) — CDN purge is operational step documented in `DEPLOYMENT_REQUIREMENTS.md`.
4. **Never** enable "cache all API" edge rules.

## Configuration

```env
DIYAR_HTTP_PUBLIC_API_CACHE_SECONDS=60
DIYAR_HTTP_PUBLIC_API_SWR_SECONDS=120
DIYAR_HTTP_PLATFORM_CONFIG_CACHE_SECONDS=300
DIYAR_HTTP_HEALTH_CACHE_SECONDS=15
```
