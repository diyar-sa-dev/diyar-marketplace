# API Conventions

> **Status:** CURRENT — reflects Stage 1 implementation  
> **Last updated:** 2026-08-15

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
| **422** | Planned | Laravel validation errors — envelope alignment in Stage 2+ |
| **429** | Framework | Laravel `RateLimiter::for('api')` — 60/min default (`API_RATE_LIMIT_PER_MINUTE`) |
| **500** | Framework | Unhandled server errors — generic JSON when `Accept: application/json` |

Only document as **verified in Stage 1:** 200, 401, 403, 404 (plus framework 429/500).

---

## Authentication Strategy

| Stage | Status |
|-------|--------|
| **Stage 1** | Sanctum **infrastructure only** — `HasApiTokens`, CORS, stateful domains |
| **Stage 2** | Login, register, logout, OTP, password reset workflows |

**Current endpoints:** No authentication required except future protected routes.

**Future (Stage 2+):**

- SPA: Sanctum cookie + CSRF (`/sanctum/csrf-cookie`)
- Mobile/third-party: Bearer token (`Authorization: Bearer {token}`)

See [AUTHENTICATION.md](./AUTHENTICATION.md).

---

## Pagination (Planned)

Not used in Stage 1. Planned convention:

- Query: `?page=1&per_page=20` (max 100)
- Success envelope with `meta` + paginated `data` via `ApiResponse` paginator normalization

---

## Validation Errors (Planned)

Stage 2+ Form Requests will return **422** with:

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "phone": ["The phone field is required."]
  }
}
```

Exact 422 envelope harmonization is scheduled for Stage 2 Identity implementation.

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
