# Stage 2 — Auth UX & Arabic Localization Report

> **Date:** 2026-08-16  
> **Scope:** Targeted Stage 2 identity UX improvements (no auth rebuild)

---

## Backend — Arabic Messages

Centralized via Laravel translation files:

| File | Purpose |
|------|---------|
| `backend/lang/ar/diyar.php` | Auth success/error messages, OTP messages, registration errors |
| `backend/lang/en/diyar.php` | English fallback |
| `backend/lang/ar/auth.php` | Login failed / throttle |
| `backend/lang/ar/account.php` | Pending, not verified, suspended |
| `backend/lang/ar/validation.php` | Validation attribute labels + common rules |

Controllers and services use `__('diyar.*')`, `__('auth.*')`, `__('account.*')` — no hardcoded Arabic in controllers.

**OTP error differentiation:**
- Expired cache entry → `diyar.otp.expired`
- Wrong code → `diyar.otp.invalid`
- Cooldown / resend limits → `diyar.otp.cooldown`, `diyar.otp.too_many_resends`, `diyar.otp.too_many_attempts`

**Locale:** Production uses `APP_LOCALE=ar` (`.env`). PHPUnit sets `APP_LOCALE=en` for stable assertions.

---

## Frontend — Toast System

Enhanced existing `ToastProvider` / `useToast()`:

```typescript
const { toast } = useToast();
toast.success('تم تسجيل الدخول بنجاح.');
toast.error('بيانات الدخول غير صحيحة.');
toast.warning('يرجى الانتظار قبل المحاولة مرة أخرى.');
toast.info('تم إرسال رمز التحقق.');
```

Features: success/error/warning/info variants, Lucide icons, manual dismiss, auto-dismiss, RTL positioning (`start-4`), entrance/exit animation, `role="status"` + `aria-live="polite"`.

Auth flows consume API `message` from responses; inline form errors remain for field-level validation.

---

## Auth UX Changes

| Change | Status |
|--------|--------|
| Phone/email login switcher restored | ✅ |
| Confirm password removed (register + reset) | ✅ Backend `confirmed` rule removed |
| Central toast notifications for auth actions | ✅ |
| Responsive auth layout (`min-h-dvh`, `min-w-0`, max-width container) | ✅ |
| `cursor-pointer` on interactive auth controls | ✅ |
| Forgot password link + phone OTP flow | ✅ |
| Email password recovery | ❌ **Not implemented** (backend has phone OTP only) |

When user is on email login and clicks "نسيت كلمة المرور؟", a warning toast explains phone-only recovery; forgot screen remains phone-based.

---

## Password Recovery Limitation

**Implemented:** Phone → OTP → reset password (`POST /auth/forgot-password`, `POST /auth/reset-password`).

**Not implemented:** Email password recovery. Frontend does not fake success for email recovery.

---

## API Response Messages

Auth endpoints return localized `message` in the standard envelope. Frontend `api/auth.ts` returns `{ user?, message? }` for AuthContext consumers.

---

## Validation Commands

```bash
# Backend
cd backend && php artisan test

# Frontend
cd frontend && npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

---

## Files Touched

### Backend
- `lang/ar/*`, `lang/en/*` (diyar, auth, account, validation)
- `AuthController`, `AuthService`, `OtpService`, `RegistrationService`, `PasswordResetService`
- `RegisterRequest`, `ResetPasswordRequest`
- `bootstrap/app.php`
- `tests/Concerns/InteractsWithIdentity.php`, `PasswordRecoveryTest.php`
- `phpunit.xml` (`APP_LOCALE=en`)

### Frontend
- `components/common/ToastProvider.tsx`, `toast-context.ts`
- `hooks/useToast.ts`, `types/toast.ts`
- `api/auth.ts`, `context/AuthContext.tsx`, `types/auth.ts`
- `pages/AuthPage.tsx`, `ProfilePage.tsx`, `App.tsx`, `layouts/DashboardLayout.tsx`
