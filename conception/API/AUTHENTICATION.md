# Authentication

> **Status:** IMPLEMENTED (Stage 2 — audited 2026-08-16)  
> **Last updated:** 2026-08-16

---

## Overview

DIYAR V1 uses **Laravel Sanctum stateful session authentication** for the React SPA:

| Mechanism | Browser SPA | Future non-browser clients |
|-----------|-------------|----------------------------|
| Auth | HttpOnly **session cookie** (Sanctum) | Personal access tokens (not issued to SPA) |
| CSRF | `/sanctum/csrf-cookie` + `X-XSRF-TOKEN` | N/A |
| Client storage | **None** — no localStorage/sessionStorage tokens | TBD |

See `conception/adr/ADR-007-spa-session-authentication.md`.

---

## Localization

User-facing auth messages are localized via Laravel translation files:

- `backend/lang/ar/diyar.php` — registration, OTP, login/logout, password reset messages
- `backend/lang/ar/auth.php` — invalid credentials, login throttle
- `backend/lang/ar/account.php` — pending / not verified / suspended
- `backend/lang/ar/validation.php` — validation errors

English equivalents live under `backend/lang/en/`. Set `APP_LOCALE=ar` for Arabic responses (default in local `.env`).

Controllers and services call `__('diyar.*')` etc. — messages are not hardcoded in controllers.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sanctum/csrf-cookie` | No | Bootstrap CSRF cookie |
| POST | `/api/v1/auth/register` | No | Create pending user + send OTP |
| POST | `/api/v1/auth/verify-otp` | No | Verify OTP, activate user, assign roles, establish session |
| POST | `/api/v1/auth/resend-otp` | No | Resend registration OTP |
| POST | `/api/v1/auth/login` | No | Phone/email + password |
| POST | `/api/v1/auth/logout` | Yes | End session |
| GET | `/api/v1/auth/me` | Yes | Current user + roles |
| POST | `/api/v1/auth/forgot-password` | No | Send recovery OTP |
| POST | `/api/v1/auth/verify-password-reset-otp` | No | Validate recovery OTP (non-consuming) |
| POST | `/api/v1/auth/reset-password` | No | Reset password with OTP + confirmation |

---

## Registration Flow (Corrected)

```text
POST /auth/register
  → validate input + roles (server-side, admin rejected)
  → DB transaction: create user (status=pending) ONLY
  → generate OTP + store HASH in cache (with role_keys metadata)
  → send OTP via SmsProvider
  → return generic success

POST /auth/verify-otp
  → locate pending user
  → verify OTP from cache (hash, expiry, attempts)
  → DB transaction:
      → activate user + phone_verified_at
      → assign roles
      → create vendor/provider account stubs when applicable
  → delete OTP cache entry
  → establish Sanctum session (HttpOnly cookie)
```

**Important:** Registration and verification are separate HTTP requests. The registration DB transaction does **not** remain open during OTP verification.

**Before OTP verification:**
- No roles assigned
- No vendor/provider accounts created

---

## OTP Cache Strategy

OTP state is stored in **Laravel Cache** — there is **no** `otp_verifications` database table.

Cache key: `diyar:otp:{purpose}:{phone}`

Stored payload (hashed code only):

| Field | Purpose |
|-------|---------|
| `code_hash` | bcrypt hash of OTP |
| `attempts` | Brute-force counter |
| `resend_count` | Resend abuse limit |
| `last_sent_at` | Cooldown enforcement |
| `user_id` | Optional linked user |
| `provider_ref` | Reserved for SMS provider reference |
| `metadata` | e.g. `role_keys` during registration |

TTL: `diyar.otp.expires_minutes` (default 10 minutes)

**Never:**
- Store plaintext OTP in DB/cache/logs (production)
- Return OTP in API responses

**Local development:** When `LogSmsProvider` is active (no MSEGAT credentials, `APP_ENV` is `local` or `testing`), the backend writes a structured log entry:

```text
OTP issued for development testing
{"phone":"966501234567","purpose":"registration","otp":"123456"}
```

Plain OTP values are **never** logged when `APP_ENV=production` or when MSEGAT credentials are configured. Cache always stores only the hash.

---

## SMS Provider Architecture

```text
OtpService
    ↓
SmsProvider (interface)
    ├── LogSmsProvider      ← local / CI / tests
    └── MsegatSmsProvider   ← production (env credentials)
```

| Environment | Provider | OTP delivery |
|-------------|----------|--------------|
| Local / CI / tests | `LogSmsProvider` | Plain OTP logged to `storage/logs/laravel.log` (dev only) |
| Production | `MsegatSmsProvider` | HTTPS JSON POST to MSEGAT |

DIYAR generates and verifies OTP internally. MSEGAT delivers the SMS message. Identity services never call MSEGAT directly.

MSEGAT credentials (`MSEGAT_USERNAME`, `MSEGAT_API_KEY`, `MSEGAT_SENDER_ID`) live in environment variables only.

---

## UUID Identity Model

All Identity domain primary keys use UUIDs:

- `users`
- `roles`
- `user_roles`
- `vendor_accounts`
- `provider_accounts`

---

## Roles

| Role | Self-registration | Notes |
|------|-------------------|-------|
| customer | Yes | Default buyer |
| vendor | Yes | Account stub created **after** OTP verify |
| provider | Yes | Account stub created **after** OTP verify |
| marketer | Yes | Multi-role supported |
| admin | **No** | Seeder only |

Backend validates roles independently of the frontend.

---

## Authorization

- Middleware: `role:vendor,admin` etc.
- Policies: `VendorAccountPolicy`, `ProviderAccountPolicy`
- Ownership stubs:
  - `GET /api/v1/vendor/accounts/{vendorAccount}`
  - `GET /api/v1/provider/accounts/{providerAccount}`

---

## Frontend Integration

Sanctum session auth is wired in the React SPA (`frontend/`).

| File | Role |
|------|------|
| `src/context/AuthContext.tsx` | Single auth state source (`user`, `roles`, `login`, `logout`, OTP flows) |
| `src/api/auth.ts` | Stage 2 API calls |
| `src/lib/csrf.ts` | CSRF bootstrap (`GET /sanctum/csrf-cookie`) |
| `src/api/client.ts` | Axios `withCredentials`, XSRF header, 401 session clearing |
| `src/lib/auth/roles.ts` | Canonical role helpers + dashboard routing |
| `src/lib/auth/validation.ts` | Password UX hints (login method is explicit in UI) |
| `src/components/common/ToastProvider.tsx` | Central toast notifications (`toast.success/error/warning/info`) |
| `src/components/routes/ProtectedRoute.tsx` | Authenticated + optional role gates |
| `src/components/routes/GuestRoute.tsx` | Redirects logged-in users away from login/register |
| `src/pages/AuthPage.tsx` | Login (phone/email switcher), register, OTP, phone-only forgot/reset + toasts |

**Boot flow:** `AuthProvider` calls `GET /api/v1/auth/me` on load. Session survives refresh via HttpOnly cookie — no localStorage/sessionStorage tokens.

**Registration:** register → OTP screen → verify-otp (session established) → redirect by role.

**Forgot password:** phone OTP only (`forgot-password` → OTP → `reset-password`). Email recovery is **not** implemented — UI states this explicitly.

**Route protection:** `/profile/*`, `/checkout`, `/orders`, `/dashboard/*` require authentication. Dashboard sub-routes enforce role (`vendor`, `provider`, `marketer`, `admin`).

No frontend token store.

---

## Postman

See [POSTMAN.md](./POSTMAN.md) for full setup.

`conception/API/postman/DIYAR-API-v1.postman_collection.json`

The collection sends `Origin` / `Referer` from `frontend_origin` so Sanctum treats requests as stateful (same as the React SPA). Without those headers, login may succeed but `/auth/me` returns 401.

**Session flow:**

1. CSRF Cookie
2. Login (or Register → Verify OTP)
3. Me

Collection pre-request script attaches `X-XSRF-TOKEN` automatically on POST requests.

---

## Planned (Not V1)

- Email password reset link workflow
- Role approval / document verification workflows
- Social login
- MSEGAT provider-side OTP verification (`verifyOTPCode`) — DIYAR verifies via cache in V1
