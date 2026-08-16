# ADR-007: SPA Session Authentication (Sanctum)

**Status:** Accepted  
**Date:** 2026-08-16  
**Stage:** 2 — Identity & Access

---

## Context

DIYAR's primary client is a React SPA served separately from the Laravel API. Authentication must be secure, compatible with CSRF protection, and must not expose long-lived bearer tokens to JavaScript.

---

## Decision

Use **Laravel Sanctum stateful session authentication** for the browser application:

1. Session stored in HttpOnly cookies
2. CSRF via `/sanctum/csrf-cookie` + `X-XSRF-TOKEN`
3. Axios configured with `withCredentials: true`
4. Frontend does **not** store auth tokens in `localStorage` / `sessionStorage`
5. `auth:sanctum` middleware with `web` guard on protected API routes

Personal access tokens (`HasApiTokens`) remain on the User model for future non-browser API clients but are **not** issued to the SPA in V1.

---

## Consequences

**Positive**

- Reduced XSS credential theft risk (HttpOnly cookies)
- Standard Laravel session + CSRF model
- Works across page refresh without client token management

**Negative / Limits**

- Requires correct CORS, `SANCTUM_STATEFUL_DOMAINS`, and `FRONTEND_URL` configuration
- Mobile/native clients will need a separate token-based flow later
- Cross-domain deployments require careful cookie `SameSite` / domain settings

---

## Related

- `config/sanctum.php`
- `conception/API/AUTHENTICATION.md`
- `frontend/src/lib/csrf.ts`
