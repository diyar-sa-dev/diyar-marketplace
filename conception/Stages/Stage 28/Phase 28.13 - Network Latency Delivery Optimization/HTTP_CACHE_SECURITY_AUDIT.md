# HTTP Cache Security Audit — Phase 28.13 Re-Audit

**Date:** 2026-08-29  
**Scope:** `ApplyHttpCachePolicy`, `config/diyar_delivery.php`, `SecurityHeaders`

## Policy model

| Condition | Cache-Control | Vary |
|-----------|---------------|------|
| Non-GET/HEAD | `private, no-store, no-cache, must-revalidate` | Cookie, Authorization, Accept-Language, Origin |
| Authenticated user | no-store | + Cookie, Authorization |
| Session cookies present | no-store | + Cookie |
| `Authorization` header present | no-store | + Authorization |
| Private path prefix match | no-store | standard private set |
| Public catalog GET (anonymous) | `public, max-age=60, stale-while-revalidate=120` | Accept-Language, Origin |
| Platform config GET | `public, max-age=300, stale-while-revalidate=120` | Accept-Language, Origin |
| Health endpoints | `public, max-age=15, must-revalidate` | Accept-Language |
| Default (unlisted GET) | no-store | private set |

## Private path deny-list

`cart`, `auth`, `admin`, `dashboard`, `orders`, `checkout`, `payment`, `chat`, `profile`, `wishlist`, `loyalty`, `notifications`, `webhooks`, `assistant`, etc.

## Security boundaries tested (PHPUnit)

1. Anonymous public catalog → public cache ✅
2. Anonymous platform theme → public max-age=300 ✅
3. Authenticated catalog → no-store ✅
4. Session cookie without auth user → no-store ✅
5. Authorization header without auth user → no-store ✅
6. Private prefix (notifications) → no-store ✅
7. Auth `/me` → no-store ✅
8. Admin dashboard → no-store ✅
9. POST login → no-store ✅

## Leakage prevention

- Removed blanket `Cache-Control: no-store` from all API routes in `SecurityHeaders` (first pass)
- Anonymous CDN cacheability strictly limited to configured public prefixes
- `Vary` includes `Authorization` and `Cookie` on all private responses

## Regression coverage

`backend/tests/Feature/Http/HttpCachePolicyTest.php` — **9/9 PASS**
