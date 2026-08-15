# Authentication

> **Status:** INFRASTRUCTURE ONLY (Stage 1) — workflows **NOT IMPLEMENTED**  
> **Last updated:** 2026-08-15

---

## Stage 1 — What Exists

| Item | Status |
|------|--------|
| Laravel Sanctum package | Installed |
| `config/sanctum.php` | Published |
| `personal_access_tokens` migration | Published |
| `HasApiTokens` on `User` model | Yes |
| CORS + stateful domains | Configured |
| Login / register / logout API | **NOT IMPLEMENTED** |
| OTP send / verify API | **NOT IMPLEMENTED** |
| Password reset API | **NOT IMPLEMENTED** |

Sanctum is **infrastructure** for Stage 2. Do not use Postman or frontend code as if auth endpoints exist.

---

## Stage 2 — Planned Work (Authorized Next)

| Area | Planned endpoints (see API_SPECIFICATION) |
|------|-------------------------------------------|
| Registration | `POST /api/v1/auth/register` |
| Login | `POST /api/v1/auth/login` |
| Logout | `POST /api/v1/auth/logout` |
| OTP send | `POST /api/v1/auth/otp/send` |
| OTP verify | `POST /api/v1/auth/otp/verify` |
| Forgot password | `POST /api/v1/auth/forgot-password` |
| Reset password | `POST /api/v1/auth/reset-password` |
| Current user | `GET /api/v1/auth/me` |

Full request/response contracts: [`../architecture/API_SPECIFICATION.md`](../architecture/API_SPECIFICATION.md) § Authentication.

---

## OTP / SMS Provider (Selected — Deferred)

| Field | Value |
|-------|-------|
| Provider | **MSEGAT / مسجات** |
| Region | Saudi Arabia |
| Integration status | **NOT YET IMPLEMENTED** |
| Target stage | Stage 2 — Identity & Authentication |

Architecture:

```text
Identity / OtpService
    ↓
SmsProvider (interface)
    ↓
MsegatSmsProvider
    ↓
MSEGAT API
```

Documentation: [providers/MSEGAT.md](./providers/MSEGAT.md)

Business logic must **not** call MSEGAT directly.

---

## Authentication Methods (Product Baseline)

From [`../REQUIREMENTS_BASELINE.md`](../REQUIREMENTS_BASELINE.md):

- Phone + password
- Email + password
- Phone OTP verification (MSEGAT)
- Password recovery (OTP + email when verified)
- Social login: **not V1**

---

## SPA Integration (Future)

1. `GET /sanctum/csrf-cookie` (with credentials)
2. `POST /api/v1/auth/login` (with credentials)
3. Subsequent API calls with session cookie **or** Bearer token for mobile

Frontend already sets `withCredentials: true` in `frontend/src/api/client.ts`.

---

## Error Responses (Infrastructure Ready)

When auth middleware is applied in Stage 2:

| Status | Message (current handler) |
|--------|---------------------------|
| 401 | `"Unauthenticated."` |
| 403 | `"Forbidden."` |

Implemented in `backend/bootstrap/app.php` exception rendering.
