# API Conventions

> **Status:** CURRENT — reflects Stage 2 Identity & Access  
> **Last updated:** 2026-08-16

---

## Base URL

| Environment | Example base URL | API prefix |
|-------------|------------------|------------|
| Local | `http://localhost:8000` | `/api/v1` |
| Staging | TBD | `/api/v1` |
| Production | TBD | `/api/v1` |

Full endpoint example:

```text
GET http://localhost:8000/api/v1/health
```

Frontend default (Axios): `VITE_API_URL=http://localhost:8000/api/v1`

---

## Versioning

- Version is in the URL path: `/api/v1/...`
- Configured in `backend/bootstrap/app.php` (`apiPrefix: 'api/v1'`)
- Breaking changes require `/api/v2` (future)

---

## Content Type

| Direction | Header |
|-----------|--------|
| Request | `Accept: application/json` |
| Request (body) | `Content-Type: application/json` |
| Response | `application/json` |

---

## Response Envelope (Implemented — Stage 1)

Implemented in `App\Support\Api\ApiResponse`.

### Success

```json
{
  "success": true,
  "data": {},
  "message": "optional string",
  "meta": {}
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `success` | Yes | Always `true` |
| `data` | Yes | Payload; may be `null`, object, or array |
| `message` | No | Human-readable success message |
| `meta` | No | Pagination or auxiliary metadata (future) |

### Error

```json
{
  "success": false,
  "message": "Human-readable message",
  "errors": {}
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `success` | Yes | Always `false` |
| `message` | Yes | Primary error message |
| `errors` | No | Validation details (object/array) when applicable |

**Note:** The Stage 0 document [`../architecture/API_SPECIFICATION.md`](../architecture/API_SPECIFICATION.md) described a Laravel-only error shape without `success`. Stage 1 **implemented** the envelope above. Future endpoints should follow this envelope.

---

## HTTP Status Codes

| Code | Stage 1 behavior | Notes |
|------|------------------|-------|
| **200** | Yes | Successful GET/POST responses using `ApiResponse::success()` |
| **201** | Planned | Created — helper supports it; no endpoint uses it yet |
| **400** | Planned | Default for `ApiResponse::error()` when status not specified |
| **401** | Yes | `AuthenticationException` → JSON `"Unauthenticated."` |
| **403** | Yes | `AuthorizationException` → JSON `"Forbidden."` |
| **404** | Yes | Unknown API route → JSON `"Resource not found."` |
| **422** | Yes | Laravel validation errors on auth Form Requests (register, login, OTP, etc.) |
| **429** | Framework | Laravel `RateLimiter::for('api')` — 60/min default (`API_RATE_LIMIT_PER_MINUTE`) |
| **500** | Framework | Unhandled server errors — generic JSON when `Accept: application/json` |

Only document as **verified in Stage 1:** 200, 401, 403, 404 (plus framework 429/500).

---

## Authentication Strategy

| Stage | Status |
|-------|--------|
| **Stage 1** | Sanctum **infrastructure** — `HasApiTokens`, CORS, stateful domains |
| **Stage 2** | **Implemented** — register, login, logout, OTP, password reset, `/me`, CSRF |

**Browser SPA:** Sanctum HttpOnly session cookie + CSRF (`/sanctum/csrf-cookie`). **No JWT. No localStorage tokens.**

**Future:** Bearer tokens for non-browser clients (not issued to SPA in V1).

See [AUTHENTICATION.md](./AUTHENTICATION.md) and [ADR-007](../adr/ADR-007-spa-session-authentication.md).

---

## Pagination (Planned)

Not used in Stage 1. Planned convention:

- Query: `?page=1&per_page=20` (max 100)
- Success envelope with `meta` + paginated `data` via `ApiResponse` paginator normalization

---

## Validation Errors

Auth Form Requests return **422** with:

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "phone": ["رقم الجوال مسجل مسبقاً."]
  }
}
```

Messages are localized via `backend/lang/{ar,en}/`.

---

## Rate Limiting

- Configured in `App\Providers\AppServiceProvider`
- Default: **60 requests/minute** per IP (or authenticated user ID when available)
- Override: `API_RATE_LIMIT_PER_MINUTE` in `backend/.env`

---

## CORS

- Config: `backend/config/cors.php`
- Allowed origin: `FRONTEND_URL` (default `http://localhost:3000`)
- Credentials: **supported** (`supports_credentials: true`)
- Paths: `api/*`, `sanctum/csrf-cookie`

Frontend Axios: `withCredentials: true` in `frontend/src/api/client.ts`

---

## Security Headers

Applied globally via `App\Http\Middleware\SecurityHeaders`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- API responses: `Cache-Control: no-store`

---

## Idempotency (Planned)

Required for checkout and payment webhooks in future Payments stage. Header:

```text
Idempotency-Key: {uuid}
```

Not implemented in Stage 1.

---

## Authentication (Stage 2 — Implemented)

Browser SPA authentication uses **Sanctum stateful sessions** (HttpOnly cookies), not bearer tokens in JavaScript.

| Step | Action |
|------|--------|
| 1 | `GET /sanctum/csrf-cookie` (from backend origin, credentials included) |
| 2 | POST auth endpoints with `X-XSRF-TOKEN` header (Axios auto-reads cookie) |
| 3 | Session cookie issued on login / OTP verify — sent automatically on subsequent requests |

Additional rate limiters:

| Limiter | Default | Scope |
|---------|---------|-------|
| `auth` | 20/min | Auth endpoints per IP |
| `otp` | 10/min | OTP endpoints per phone + IP |

See [AUTHENTICATION.md](./AUTHENTICATION.md) for full endpoint list and OTP cache strategy.
