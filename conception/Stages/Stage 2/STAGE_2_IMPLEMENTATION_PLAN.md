# Stage 2 — Identity & Access Implementation Plan

> **Status:** COMPLETE / FINALIZED (audited 2026-08-16)  
> **Constraint:** UUID primary keys; OTP in cache (no DB table)  
> **Index:** [README.md](./README.md)

---

## Phase Map — Completion

| Phase | Doc | Status |
|-------|-----|--------|
| 2.1 UUID users, roles, user_roles | [Phase 2.1](./Phase%202.1%20—%20Identity%20Model/README.md) | ✅ |
| 2.2 OTP cache service, SmsProvider, registration | [Phase 2.2](./Phase%202.2%20—%20Registration%20&%20OTP/README.md) | ✅ |
| 2.3 Login, logout, `/me`, Sanctum sessions | [Phase 2.3](./Phase%202.3%20—%20Authentication%20&%20Sessions/README.md) | ✅ |
| 2.4 Forgot/verify/reset password via OTP cache | [Phase 2.4](./Phase%202.4%20—%20Password%20Recovery/README.md) | ✅ |
| 2.5 Role middleware, policies, ownership, dashboard RBAC | [Phase 2.5](./Phase%202.5%20—%20Roles%20&%20Authorization/README.md) | ✅ |
| 2.6 Frontend AuthContext, CSRF, protected routes | [Phase 2.6](./Phase%202.6%20—%20Frontend%20Authentication/README.md) | ✅ |
| 2.7 Localization, rate limits, status pages, UX | [Phase 2.7](./Phase%202.7%20—%20Security%20&%20UX%20Hardening/README.md) | ✅ |
| 2.8 Tests, docs, Postman, audit | [Phase 2.8](./Phase%202.8%20—%20Testing,%20Documentation%20&%20Finalization/README.md) | ✅ |

---

## Schema (UUID)

### `users`, `roles`, `user_roles`, `vendor_accounts`, `provider_accounts`

All use UUID primary keys. See migrations in `backend/database/migrations/`.

### OTP

**Not in database.** Stored in Laravel Cache via `OtpCacheStore`:

- Key: `diyar:otp:{purpose}:{phone}`
- Hashed code, attempts, resend_count, cooldown, metadata (role_keys)

---

## Registration Transaction Design

1. **Register:** TX creates pending user only → OTP issued to cache → SMS sent
2. **Verify:** OTP verified from cache → TX activates user, assigns roles, creates account stubs → session established

Roles and vendor/provider accounts are **not** created before OTP verification.

---

## Auth Strategy

**Browser SPA:** Sanctum stateful session (HttpOnly cookies). No tokens in localStorage.

**SMS:** `SmsProvider` → `LogSmsProvider` (dev) / `MsegatSmsProvider` (prod JSON delivery)

---

## Out of Scope

Products, catalog, cart, checkout, orders, payments, ledger, AI, media.
