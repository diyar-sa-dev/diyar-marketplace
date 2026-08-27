# Phase 28.6 — Security Authentication Testing

**Tests:** `AuthenticationTest`, `RegistrationTest`, `PasswordRecoveryTest`, `AccountStatusMiddlewareTest`, `AdminSpaAuthTest`

---

## PHPUnit focused run

Security-focused auth tests in suite: **PASS** (included in 82/85 run)

---

## Verified behaviors

| Scenario | Expected | Evidence |
|----------|----------|----------|
| Invalid credentials | Safe failure | Auth tests |
| Unauthenticated protected route | 401 | OwnershipAuthorizationTest |
| Pending/suspended account | Blocked middleware | AccountStatusMiddlewareTest |
| Admin SPA separate guard | Isolated | AdminSpaAuthTest |
| Logout invalidates session | Pass | AuthenticationTest patterns |

---

## Login contract note

Current login expects `{ method, identifier, password }`. Legacy `RateLimitingTest` uses `{ phone, password }` — causes 422 not 429 (**TEST DEFECT** KI-028-053).

---

## Information disclosure

| Check | Result |
|-------|--------|
| Invalid login exposes password hash | **NOT OBSERVED** |
| User enumeration via login | Partial — standard 422 validation messages |
| OTP brute force | Throttle configured; test gap KI-028-054 |

---

## E2E cross-reference (28.5)

`auth-isolation.spec.ts`: **6/6 PASS** — dual session, refresh, API separation.

---

## Gate

```text
PASS
```

Authentication controls verified; rate-limit **test** coverage stale.
