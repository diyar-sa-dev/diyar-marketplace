# Stage 3 Implementation Plan

> **Status:** COMPLETE / FINALIZED  
> **Audit:** [STAGE_3_AUDIT_REPORT.md](./STAGE_3_AUDIT_REPORT.md)

---

## Workstream checklist

| # | Workstream | Status | Notes |
|---|------------|--------|-------|
| 1 | **Stage 3 Planning** — Create the Stage 3 conception structure and divide Profile, Addresses, and Media into clear phases | ✅ Done | `conception/Stages/Stage 3/` + Phase 3.1–3.3 READMEs |
| 2 | **Profile Implementation** — Connect existing account/profile pages to the real authenticated user and allow secure profile updates | ✅ Done | `ProfileService`, `/profile`, `/profile/personal-info`, auth `refreshUser` / `updateUser` |
| 3 | **Avatar System** — Secure JPG/JPEG/PNG/WEBP uploads, replacement, deletion, and automatic initials fallback | ✅ Done | `UserAvatar`, upload/delete API, `storage:link` + Vite `/storage` proxy, `sm`/`onDark` variants |
| 4 | **Media Architecture** — Reusable Laravel filesystem media layer (local now, VPS/S3-ready) | ✅ Done | `MediaUploadService`, `diyar_media` config, `media` disk |
| 5 | **Personal Information** — `/profile/personal-info` with name, phone, email, validation, save states, localized errors | ✅ Done | Phone change via OTP only; read-only phone display; AR/EN |
| 6 | **Address Management** — Real shipping-address CRUD, structured fields, ownership protection | ✅ Done | Full UI + API; localized; duplicate empty-state CTA removed |
| 7 | **Default Address** — Secure single-default handling | ✅ Done | `POST …/addresses/{id}/default` + service logic |
| 8 | **Frontend Integration** — Axios + TanStack Query, loading/error/toast handling | ✅ Done | `useProfile` hooks, toast context, profile query invalidation |
| 9 | **Security & Quality** — Upload validation, IDOR, authorization, tests, responsive, AR/EN RTL | ✅ Mostly done | Backend 67 tests; frontend 45 tests; responsive profile/addresses; masked phone on security flows |
| 10 | **Stage 3 Finalization** — Verify tests, update docs, mark finalized | ✅ **FINALIZED** |

---

## Additional increments (post-plan)

| Item | Status |
|------|--------|
| Secure phone change (OTP) | ✅ `PhoneChangeService` + modal on personal info |
| Authenticated password reset route | ✅ `/profile/security/reset-password` |
| Profile / security / addresses i18n | ✅ AR/EN keys + RTL/LTR |
| Masked phone display (+966 5\*\*\*\*\*\*4) | ✅ Security + password-reset pages |
| Dashboard topbar avatar + language switcher | ✅ `UserAvatar` + `LanguageSwitcher` on `/dashboard` |
| Saudi phone prefix UX (+966 left, LTR) | ✅ `SaudiPhoneInput`, `ReadOnlySaudiPhoneDisplay`, profile header |

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

## Validation (post-audit 2026-08-16)

| Check | Result |
|-------|--------|
| `php artisan test` | **75 / 75** |
| `npm test` | **45 / 45** |
| `npx tsc --noEmit` | Pass |

---

## Local setup

```bash
php artisan migrate
php artisan storage:link   # required for avatar URLs
```

Restart Vite after clone so `/storage` proxy is active in dev.
