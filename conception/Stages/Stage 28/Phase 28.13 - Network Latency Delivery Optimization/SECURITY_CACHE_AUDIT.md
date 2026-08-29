# Security Cache Audit — Phase 28.13

**Date:** 2026-08-29  
**Result:** PASS — no P0/P1 cache isolation issues

---

## Threat model reviewed

| Threat | Mitigation | Status |
|--------|------------|--------|
| User A receives User B cached API response | Session/auth → `no-store`; CDN must not cache Cookie requests | ✅ |
| Admin data at CDN edge | Admin routes always `private, no-store` | ✅ |
| Payment/financial data cached | Mutations + auth paths `no-store` | ✅ |
| Cart/checkout personalization leak | Session cookie forces `no-store` | ✅ |
| Stale catalog after publish | Redis versioned invalidation (28.11) + short HTTP TTL | ✅ |
| Private media on public CDN | Only `/storage/app/public` paths; no signed private URLs exposed | ✅ |

---

## Middleware behavior verified (PHPUnit)

- Anonymous `/api/v1/categories` → `public, max-age=60`
- Authenticated catalog → `private, no-store`
- Cookie header present → `private, no-store`
- POST `/api/v1/auth/login` → `private, no-store`
- Admin dashboard (401) → `private, no-store`

---

## Nginx template review

- API proxy does **not** override Laravel `Cache-Control`
- Static SPA HTML uses `no-cache` (prevents stale index referencing deleted chunks)
- `/storage/` alias is public-read only (Laravel public disk)

---

## Recommendations for production CDN

1. Configure **Cache Key** to include `Accept-Language` for public catalog only.
2. Set **Bypass cache on cookie** rule globally for `api.*` hostnames.
3. Enable **HSTS** at CDN + origin (template includes HSTS for production).
