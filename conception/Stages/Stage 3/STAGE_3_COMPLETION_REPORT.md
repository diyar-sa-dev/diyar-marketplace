# Stage 3 Completion Report

> **Status:** COMPLETE / FINALIZED  
> **Date:** 2026-08-16  
> **Audit:** [STAGE_3_AUDIT_REPORT.md](./STAGE_3_AUDIT_REPORT.md)

---

## Delivered

- Profile fields on `users` (`bio`, `avatar_path`, `preferences`)
- `addresses` table + CRUD + default address logic + IDOR protection
- `MediaUploadService` (filesystem abstraction, MIME validation)
- Profile & address API controllers under `/api/v1/profile`
- Phone change via OTP (`PhoneChangeService`)
- Frontend: personal info, avatar, addresses, security, password reset
- Localization AR/EN + RTL/LTR on profile flows
- Dashboard topbar: user avatar + language switcher

---

## Validation (post-audit)

| Check | Result |
|-------|--------|
| `php artisan test` | **75 / 75** |
| `npm test` | **45 / 45** |
| `npx tsc --noEmit` | Pass |

---

## Deferred to a later increment

| Item | Notes |
|------|-------|
| Bio/preferences UI | API-only |
| In-session password change UI | API exists (`PATCH /profile/password`) |
| Dedicated frontend profile/address tests | Vitest coverage for hooks/pages |
| Dashboard sidebar localization | Sidebar nav still Arabic-only strings |
| 2FA / connected devices | Placeholder UI |
| Postman profile endpoints | API docs update |

---

## Sign-off

Stage 3 marked **FINALIZED** on 2026-08-16.

Do not authorize Stage 4+ without explicit PO approval.
