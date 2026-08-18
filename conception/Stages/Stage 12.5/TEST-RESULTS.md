# Stage 12.5 — Test Results

> **Verified:** 2026-08-18  
> **Commit:** `6a2ceba`

---

## Summary

| Suite | Command | Result |
|-------|---------|--------|
| Backend PHPUnit | `php artisan test` | **345 / 345 PASS** |
| Frontend Typecheck | `npm run typecheck` | **PASS** |
| Frontend Vitest | `npm test` | **82 / 82 PASS** |
| Vendor team | `php artisan test --filter=VendorTeamTest` | **12 / 12 PASS** |
| Email verification | `php artisan test --filter=EmailVerificationTest` | **PASS** (with `DIYAR_MAIL_ENABLED=false`) |

---

## New / extended backend test groups (Stage 12.5)

| Test file | Protects |
|-----------|----------|
| `EmailVerificationTest` | Email login OTP gate, profile verify, welcome on login, welcome skipped when email notifications off |
| `VendorTeamTest` | Invite, accept/reject, RBAC, role downgrade, team removal revokes vendor role, multi-store membership, intrinsic role preserved |
| `ProductPreorderTest` | Customer preorder submit, vendor list |
| `VendorFollowTest` | Follow/unfollow |
| `SelfPurchaseTest` | Own-product purchase blocked |
| `CustomerReviewHistoryTest` | Unified review history |
| `ProductReviewIntegrityTest` | Verified purchase + vendor self-review |

---

## CI fix (post Stage 12.5)

`backend/phpunit.xml` sets `DIYAR_MAIL_ENABLED=false` so `LogEmailOtpProvider` exposes OTP in tests regardless of local `.env` mail credentials.

---

## Regression baseline vs Stage 12

| Metric | Stage 12 close | Stage 12.5 |
|--------|----------------|------------|
| Backend tests | 303 | 345 |
| Frontend vitest | 81 | 82 |

---

*Service marketplace tests are tracked under [Stage 13 TEST-RESULTS.md](../Stage%2013/TEST-RESULTS.md).*
