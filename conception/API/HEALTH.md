# Health Endpoint

> **Status:** IMPLEMENTED — Stage 1  
> **Endpoint:** `GET /api/v1/health`

---

## Purpose

Operational health check for load balancers, CI smoke tests, and developer verification that the DIYAR API is running and returning the standard JSON envelope.

This is **not** a business domain endpoint. It exposes application metadata only.

---

## Authentication

**None.** Public endpoint.

---

## Request

```http
GET /api/v1/health HTTP/1.1
Host: localhost:8000
Accept: application/json
```

No query parameters. No request body.

---

## Success Response

**HTTP status:** `200 OK`

**Body** (verified against `HealthController` + live server + `HealthEndpointTest`):

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "diyar-api",
    "version": "1.0.0-stage1",
    "stage": "Stage 1 — Engineering Foundation",
    "environment": "local",
    "timestamp": "2026-08-15T17:38:06+03:00"
  }
}
```

### Field reference

| Field | Type | Source |
|-------|------|--------|
| `data.status` | string | Constant `"ok"` |
| `data.service` | string | Constant `"diyar-api"` |
| `data.version` | string | `config('diyar.api_version')` / `DIYAR_API_VERSION` |
| `data.stage` | string | `config('diyar.stage')` / `DIYAR_STAGE` |
| `data.environment` | string | `app()->environment()` |
| `data.timestamp` | string | ISO 8601 (`now()->toIso8601String()`) |

`message` and `meta` are omitted on success when not provided.

---

## Failure Behavior

This endpoint does not define domain failures. Typical infrastructure failures:

| Condition | Expected behavior |
|-----------|---------------------|
| Server down | Connection error (no JSON) |
| PHP fatal error | 500 (framework) |

For unknown API routes, see [API_CONVENTIONS.md](./API_CONVENTIONS.md) — JSON 404 envelope.

---

## Implementation

| Item | Location |
|------|----------|
| Controller | `backend/app/Http/Controllers/Api/V1/HealthController.php` |
| Route | `backend/routes/api.php` |
| Response helper | `backend/app/Support/Api/ApiResponse.php` |
| Test | `backend/tests/Feature/Api/V1/HealthEndpointTest.php` |

---

## Related Framework Endpoint

Laravel built-in (non-JSON):

```text
GET /up
```

Configured in `bootstrap/app.php` (`health: '/up'`). Use `/api/v1/health` for DIYAR API contract verification.
