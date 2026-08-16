# Phase 2.7 — Security & UX Hardening

> **Status:** COMPLETE / FINALIZED

## Objective

Harden authentication security controls and polish auth UX, localization, and error handling.

## Implemented Functionality

### Backend
- Auth route rate limiting (`throttle:auth`, `throttle:otp`)
- `SetLocaleFromRequest` middleware — `Accept-Language` / `X-Locale`
- Arabic + English lang files (`diyar`, `auth`, `account`, `validation`)
- Specific duplicate registration messages (`phone_taken`, `email_taken`)
- Secure OTP generation (`SecureOtpCodeGenerator`)

### Frontend
- Locale provider + `ar`/`en` catalogs + `LanguagePage`
- RTL/LTR document direction
- Localized API error parsing (`collectDisplayErrors`, field error preference)
- Toast notification system
- Status pages: 401/403/404/500 via `RouteStatusPage` template
- `ErrorBoundary` + `AppErrorFallback` (uses `getStaticLocale()` — no provider crash)
- Auth required banner on `/auth` when redirected from protected routes
- Footer/header partner portal links respect RBAC

## Architecture

```text
API request → SetLocaleFromRequest → localized validation/errors
SPA → LocaleProvider + static locale fallback for error pages
```

## Important Decisions

- Error/status pages use `getStaticLocale()` so they work even if ErrorBoundary catches outside nested providers
- OTP plaintext never logged in production paths
- MSEGAT credentials remain in `.env` only — not documented as configured

## Security Considerations

- CSRF on all state-changing API calls
- Generic auth errors where enumeration is a concern
- Hashed OTP, cache TTL, attempt/resend limits

## Tests

- `LocaleMiddlewareTest.php`
- `errors.test.ts`, `translate.test.ts`

## Current Limitations

- ESLint reports 4 react-refresh warnings (non-blocking)
- Prettier drift on 9 frontend files (format not enforced in CI for all paths)
- Storefront/catalog not gated by `customer` role

## Completion Status

**FINALIZED**
