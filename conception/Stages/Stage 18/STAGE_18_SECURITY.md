# Stage 18 — Security Requirements

**Date:** 2026-08-22  
**Scope:** Filament admin panel, settings system, audit logging  
**Status:** Phase 18.4 in progress — automated regression green; manual QA required before **COMPLETE / VERIFIED**

---

## 1. Threat Model Summary

| Asset | Threat | Control |
|-------|--------|---------|
| User PII | Unauthorized access | Policies + admin role gate |
| Financial state | Direct mutation / replay | Domain services + transactions |
| Secrets | Exposure via settings UI | Env-only; `is_sensitive` mask |
| Admin actions | Repudiation | Append-only audit log |
| Panel access | Privilege escalation | `canAccessPanel` + per-resource policies |
| Settings | XSS / injection | Typed values + allowlists |
| Sessions | Hijacking / fixation | Laravel session config + HTTPS |

---

## 2. Authentication

| Requirement | Implementation |
|-------------|----------------|
| Admin panel requires login | Filament `->login()` on `/admin` |
| Separate from SPA token optional | `web` guard session |
| Login throttling | Reuse `config('diyar.auth')` in login controller or Filament customization |
| Session expiration | Laravel `SESSION_LIFETIME` |
| CSRF | Filament/Laravel default on all POST |
| Logout | Filament user menu |

**Tests:**

- Unauthenticated → redirect `/admin/login`
- Invalid credentials → generic error (no user enumeration if existing auth follows this)

---

## 3. Authorization

### 3.1 Panel level

```php
->authGuard('admin')
->canAccessPanel(fn (User $user) => $user->canAccessAdminPanel())
```

Granular permissions via `AdminPermission` enum + `AuthorizesAdminResource` trait (not role-only).

### 3.2 Resource level

Every Filament Resource implements policy methods:

- `viewAny`, `view`, `create`, `update`, `delete`
- Custom: `approve`, `suspend`, `cancel`, etc.

### 3.3 IDOR test matrix

| Actor | Admin order view | Admin user edit | Admin payout approve |
|-------|------------------|-----------------|----------------------|
| Admin | ✅ own policy | ✅ | ✅ |
| Vendor | ❌ 403 | ❌ | ❌ |
| Provider | ❌ | ❌ | ❌ |
| Customer | ❌ | ❌ | ❌ |
| Unauthenticated | ❌ | ❌ | ❌ |

Also test: relationship URLs, export endpoints, bulk actions, search filters leaking cross-tenant data.

### 3.4 Role assignment

- Admin cannot assign `admin` role to self without audit (if supported)
- `RoleName::Admin` not registrable via public registration ✅ existing
- Role changes logged in audit

---

## 4. Sensitive Data Handling

### 4.1 Must NEVER display or log

- Passwords (hashed or plain)
- OTP codes / secrets
- API tokens / Sanctum tokens
- Payment card numbers, CVV
- Gateway private keys
- Raw webhook payloads with credentials

### 4.2 Payment admin view

Safe: gateway transaction id, status, amount, currency, timestamps  
Unsafe: full provider response if contains PAN/token

### 4.3 Audit redaction

`AdminAuditService` strips keys matching:

```text
password, token, otp, secret, card, cvv, api_key, authorization
```

---

## 5. Input Validation

| Surface | Rule |
|---------|------|
| Filament forms | Explicit fields; no `$request->all()` mass assign |
| Settings | `validation_rules` column + type casting |
| Enum settings | Allowlist only |
| Color settings | Hex regex |
| JSON settings | Schema validation per key |
| Rich text (if any) | HTML purifier / allowlist tags |
| File uploads | MIME + size; existing media policies |

**Prohibited setting types:** `php`, `executable`, raw `css`, raw `javascript`.

---

## 6. Output Safety

- Filament escapes text by default
- User-generated content in admin tables: `->html()` only with sanitization
- Export CSV: escape formula injection (`=`, `+`, `-`, `@` prefix)

---

## 7. Financial Security

| Rule | Enforcement |
|------|-------------|
| No direct balance edit | No Filament edit form on balance fields |
| Payout approve idempotent | `PayoutService` existing behavior + tests |
| Refund ≤ refundable | `RefundCalculationService` |
| Order state machine | `OrderStateService` only |
| Duplicate mark-paid | Existing Stage 9.5 tests must pass |
| Reason required | Form required on approve/reject/adjust |

---

## 8. Configuration Security

| Rule | Detail |
|------|--------|
| No `.env` write | Zero code paths to `file_put_contents('.env')` |
| Secrets env-only | Payment, mail, APP_KEY |
| Sensitive settings | Display `********`; audit shows `[REDACTED]` |
| Public settings | Only `is_public = true`; no internal keys |
| Feature flags | Boolean only in V1 |

---

## 9. Bulk Actions

- Disabled by default for financial resources
- When enabled: per-record authorize + transactional batch + failure report
- Audit each successful mutation (or single bulk audit with ids list)

---

## 10. Exports

- Permission: `*.export` or policy `export`
- Streamed response; chunk queries
- Exclude sensitive columns
- Audit: actor, resource type, filter snapshot, row count

---

## 11. Impersonation

**Not in V1.** If added later:

- Explicit button + confirmation
- Banner visible to admin
- Audit start/end
- Time-bound session
- Never show credentials

---

## 12. Security Test Checklist (Phase completion)

```text
[ ] FilamentAccessTest — all roles
[ ] FilamentAuthorizationTest — IDOR samples per Tier 1 resource
[ ] SettingsSensitiveTest — masked values
[ ] SettingsInjectionTest — XSS payload rejected
[ ] AuditRedactionTest — secrets not in JSON
[ ] PayoutIdempotencyTest — Filament action path
[ ] BulkActionUnauthorizedTest
[ ] CSRF token missing → 419
```

---

## 13. Critical Blockers

Stage 18 cannot ship if any of these fail:

1. Non-admin access to `/admin` resources
2. Direct financial field mutation bypassing services
3. Secret exposure in settings or audit
4. `.env` mutation from web UI
5. Missing audit on payout approve/reject/mark-paid
6. XSS in stored settings rendered unsafely

---

*Cross-reference: [STAGE_18_ARCHITECTURE.md](./STAGE_18_ARCHITECTURE.md) · [STAGE_18_PLAN.md](./STAGE_18_PLAN.md)*
