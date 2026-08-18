# Stage 13 — Test Results

> **Verified:** 2026-08-18 (progress snapshot — not final sign-off)

---

## Summary

| Suite | Command | Result |
|-------|---------|--------|
| Backend PHPUnit | `php artisan test` | **321 / 324 PASS** (1507 assertions) — 3 failures in `EmailVerificationTest` when mail enabled |
| Frontend Typecheck | `npm run typecheck` | **PASS** |
| Vendor team | `php artisan test --filter=VendorTeamTest` | **12 / 12 PASS** |

---

## New / extended backend test groups (Stage 13)

| Test file | Protects |
|-----------|----------|
| `EmailVerificationTest` | Email login OTP gate, profile verify, welcome on login, welcome skipped when email notifications off |
| `VendorTeamTest` | Invite, accept/reject, RBAC, role downgrade, **team removal revokes vendor role**, multi-store membership, intrinsic role preserved |
| `ProductPreorderTest` | Customer preorder submit, vendor list |
| `VendorFollowTest` | Follow/unfollow (Stage 12+, extended in storefront) |
| `SelfPurchaseTest` | Own-product purchase blocked |
| `CustomerReviewHistoryTest` | Unified review history |
| `ProductReviewIntegrityTest` | Verified purchase + vendor self-review |

---

## Known failures

```
EmailVerificationTest::email_login_requires_otp_when_email_is_unverified
EmailVerificationTest::user_can_verify_email_from_profile
EmailVerificationTest::email_login_otp_establishes_session_and_marks_email_verified
```

**Cause:** `LogEmailOtpProvider::shouldExposePlainOtp()` returns false when `diyar.mail.enabled=true`, so tests cannot read OTP from dev log.

**Fix options:** Force mail disabled in `phpunit.xml` / `.env.testing`, or expose OTP in `testing` environment regardless of mail.enabled.

---

## Regression baseline vs Stage 12

| Metric | Stage 12 close | Stage 13 snapshot |
|--------|----------------|-------------------|
| Backend tests | 303 | 324 (+21) |
| Assertions | 1405 | 1507 |
| Frontend vitest | 81 | TBD (re-run before sign-off) |

---

*Update this document when Stage 13 is signed off.*
