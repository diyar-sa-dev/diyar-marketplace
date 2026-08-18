# Phase 13.1 — Email Verification & Transactional Mail

> **Status:** Implemented

## Backend

- `EmailOtpService` — issue/verify/resend email OTP (mirrors phone OTP pattern)
- `EmailVerificationService` — profile verify + login verify flows
- `WelcomeEmailService` — send once when eligible; respects notification prefs
- `DiyarPhpMailer` + `DiyarMailTemplate` + `DiyarMailContent` — HTML mail, Arabic RTL, embedded logo
- `LogEmailOtpProvider` — dev/test OTP capture when mail disabled
- Routes: `POST /auth/verify-email-otp`, `POST /auth/resend-email-otp`, `POST /profile/email/*`

## Frontend

- Email login blocked until verified → OTP step in `AuthPage`
- Profile email verify modal in `PersonalInfoPage`
- `maskEmailForDisplay()` — e.g. `y****@gmail.com` on OTP screens

## Config

- `diyar.mail.*` in `.env.example` (enabled, SMTP, from address)
- `diyar.frontend_url` for CTA links

## Tests

- `EmailVerificationTest` (3 cases need mail.disabled in test env)
