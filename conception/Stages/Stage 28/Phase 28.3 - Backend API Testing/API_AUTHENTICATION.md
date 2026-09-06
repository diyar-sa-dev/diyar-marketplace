# Phase 28.3 — API Authentication

**Date:** 2026-08-27  
**Primary tests:** `AuthenticationTest`, `RegistrationTest`, `PasswordRecoveryTest`, `EmailVerificationTest`, `AccountStatusMiddlewareTest`, `AdminSpaAuthTest`, `AdminIsolationTest`

---

## Auth surfaces

| Surface | Base path | Mechanism |
|---------|-----------|-----------|
| Marketplace | `/api/v1/auth/*` | Sanctum stateful (SPA cookie session) |
| Admin | `/api/v1/admin/auth/*` | Separate admin session |
| Webhooks | `/api/v1/webhooks/*` | Provider signature (not user auth) |

---

## Marketplace flows tested

| Flow | Test file | Result (SQLite) |
|------|-----------|-----------------|
| Phone login + `/auth/me` | `AuthenticationTest` | PASS |
| Email login | `AuthenticationTest` | PASS |
| Invalid password → 422 + `credentials` error | `AuthenticationTest` | PASS |
| Pending user → phone verification required | `AuthenticationTest` | PASS |
| Logout clears session | `AuthenticationTest` | PASS |
| Registration + OTP | `RegistrationTest` | PASS |
| Email verification OTP | `EmailVerificationTest` | PASS |
| Forgot / reset password | `PasswordRecoveryTest` | PASS |
| Suspended account blocked | `AccountStatusMiddlewareTest` | PASS |

---

## Admin auth isolation

| Scenario | Expected | Result |
|----------|----------|--------|
| Admin-only user login via marketplace `/auth/login` | Reject (422 credentials) | PASS — `AdminIsolationTest` |
| Admin token on `/auth/me` | 403 | PASS |
| Admin on vendor dashboard API | 403 | PASS |
| Marketplace user on admin auth | Reject | PASS — `AdminSpaAuthTest` |

---

## Invalid / missing credentials

| Case | Status | Evidence |
|------|--------|----------|
| Wrong password | 422 | `AuthenticationTest` |
| Unauthenticated protected route | 401 | `OwnershipAuthorizationTest` |
| Missing token on `/auth/me` | 401 | Implicit in auth tests |

---

## Rate limiting (auth-related)

| Endpoint | Limit (config default) | Test |
|----------|------------------------|------|
| `/auth/login` | 20/min (`auth_per_minute`) | `RateLimitingTest` → 429 after 3 (test override) |
| OTP / forgot-password | 10/min (`otp_per_minute`) | `RateLimitingTest` → 429 |
| Registration OTP | `throttle:otp` middleware | Route inventory |

---

## Sensitive data handling

Tests assert response shapes without logging raw tokens. Login returns user envelope — passwords never echoed in JSON responses (verified by test assertions on `data.user` fields only).

---

## MySQL 8 verification

**Filter includes `AuthenticationTest` + `HealthEndpointTest`**

| Environment | Tests | Result |
|-------------|-------|--------|
| MySQL 8.0.46 | Included in 41-test subset | **PASS** |

---

## Authentication gate

```text
PASS
```

Marketplace and admin auth separation verified. OTP/rate-limit behavior tested.

---

## NOT VERIFIED

| Item | Reason |
|------|--------|
| Token refresh (if applicable) | Sanctum session model — no separate refresh token flow found |
| Expired session replay on MySQL 8 full suite | Subset only |
