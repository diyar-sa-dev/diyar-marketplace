# Phase 2.2 — Registration & OTP

> **Status:** COMPLETE / FINALIZED

## Objective

Phone-based registration with cache-backed OTP, SMS delivery abstraction, and corrected transaction boundaries.

## Implemented Functionality

- `POST /api/v1/auth/register` — creates **pending user only** inside DB transaction
- OTP generated after transaction commits
- OTP stored as **bcrypt hash** in Laravel Cache via `OtpCacheStore`
- Purpose-separated keys: registration, password reset
- Attempt limits, resend cooldown, hourly resend cap
- `SmsProvider` contract → `LogSmsProvider` (dev) / `MsegatSmsProvider` (prod adapter)
- `POST /api/v1/auth/verify-otp` — validates cache OTP, activates user, assigns roles, creates account stubs, establishes session
- `POST /api/v1/auth/resend-otp`
- Duplicate phone/email rejection with localized field messages (`phone_taken`, `email_taken`)

## Architecture

```text
POST /auth/register
  → Validate request
  → DB transaction → create pending user only
  → Commit
  → Generate OTP → hash → Cache
  → SmsProvider → LogSmsProvider / MsegatSmsProvider

POST /auth/verify-otp
  → Validate OTP from Cache
  → DB transaction → activate user, roles, vendor/provider stubs
  → Commit
  → Establish Sanctum session
```

**There is no `otp_verifications` database table.**

## Important Decisions

- DIYAR verifies OTP internally; MSEGAT is **SMS delivery only** (not OTP verification API)
- Registration metadata (`role_keys`) stored in cache until verification
- Plaintext OTP never returned in API responses; dev logging only via `LogSmsProvider` in local/testing

## API / Frontend Impact

- Frontend register → OTP screen → verify establishes session
- Saudi phone input validation on client; server normalizes to `9665XXXXXXXX`

## Security Considerations

- Hashed OTP in cache only
- Rate limits on register/resend/verify routes
- Generic responses where enumeration is a risk; specific messages for duplicate phone/email on register

## Tests

- `RegistrationTest.php` (11 tests)
- `SmsProviderTest.php`
- Asserts no OTP DB table exists

## Current Limitations

- MSEGAT production credentials are **not** committed; local dev uses log provider
- Customer role is UI-default at registration but not auto-injected server-side if omitted

## Completion Status

**FINALIZED**
