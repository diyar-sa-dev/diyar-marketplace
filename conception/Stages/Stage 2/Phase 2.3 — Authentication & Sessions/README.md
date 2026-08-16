# Phase 2.3 — Authentication & Sessions

> **Status:** COMPLETE / FINALIZED

## Objective

Sanctum stateful session authentication for the React SPA with CSRF protection and `/me` session introspection.

## Implemented Functionality

- `POST /api/v1/auth/login` — phone or email + password
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- Sanctum `auth:sanctum` on protected routes
- HttpOnly session cookies — **no JWT for browser auth**
- CSRF bootstrap: `GET /sanctum/csrf-cookie` + `X-XSRF-TOKEN`
- `AuthService::establishSession()` on login and post-OTP verify
- Login throttle / rate limiting
- Account status checks (pending, suspended, etc.)

## Architecture

```text
React SPA
  → CSRF bootstrap (/sanctum/csrf-cookie)
  → Laravel Sanctum (stateful)
  → HttpOnly session cookie
  → authenticated API request (withCredentials + X-XSRF-TOKEN)
```

See ADR-007. Personal access tokens exist on the User model for **future** non-browser clients but are **not issued to the SPA**.

## Important Decisions

- No `localStorage` / `sessionStorage` authentication tokens in frontend
- Vite dev proxy forwards `/api` and `/sanctum` to Laravel for same-origin CSRF
- Session established immediately after successful OTP verification (registration)

## API / Frontend Impact

- `AuthContext` — `refreshUser()`, `login()`, `logout()`, `hasRole()`
- `frontend/src/api/client.ts` — `withCredentials: true`, CSRF header, `Accept-Language`
- `GuestRoute` / `ProtectedRoute`

## Security Considerations

- Brute-force throttling on login
- Generic invalid credential messages
- 401 handler clears client session state

## Tests

- `AuthenticationTest.php`
- `AuthContext.test.tsx`

## Current Limitations

- Remember-me is forwarded to backend; long-lived session tuning is environment-dependent
- Mobile/native clients need a separate token strategy (future)

## Completion Status

**FINALIZED**
