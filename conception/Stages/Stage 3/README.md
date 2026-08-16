# Stage 3 — User Profile & Media

> **Status:** IMPLEMENTED / VERIFIED — WAITING FOR PO REVIEW  
> **Scope:** Profile CRUD, avatar media, shipping addresses, security UX  
> **Audit:** [STAGE_3_AUDIT_REPORT.md](./STAGE_3_AUDIT_REPORT.md)

---

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 3.1 | Profile | **IMPLEMENTED / VERIFIED — WAITING FOR PO REVIEW** |
| 3.2 | Addresses | **IMPLEMENTED / VERIFIED — WAITING FOR PO REVIEW** |
| 3.3 | Media | **IMPLEMENTED / VERIFIED — WAITING FOR PO REVIEW** |

---

## API (v1)

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/v1/profile` | Sanctum |
| PATCH | `/api/v1/profile` | Sanctum (phone prohibited — use OTP endpoints) |
| PATCH | `/api/v1/profile/password` | Sanctum |
| POST | `/api/v1/profile/avatar` | Sanctum |
| DELETE | `/api/v1/profile/avatar` | Sanctum |
| POST | `/api/v1/profile/phone/request-change` | Sanctum + throttle:otp |
| POST | `/api/v1/profile/phone/resend-change` | Sanctum + throttle:otp |
| POST | `/api/v1/profile/phone/verify-change` | Sanctum + throttle:otp |
| GET/POST | `/api/v1/profile/addresses` | Sanctum |
| GET/PATCH/DELETE | `/api/v1/profile/addresses/{id}` | Sanctum |
| POST | `/api/v1/profile/addresses/{id}/default` | Sanctum |

---

## Frontend routes

| Route | Purpose |
|-------|---------|
| `/profile` | Account hub + avatar upload |
| `/profile/personal-info` | Name, email, phone change (OTP) |
| `/profile/addresses` | Shipping addresses CRUD |
| `/profile/security` | Security overview + masked phone |
| `/profile/security/reset-password` | Authenticated OTP password reset |
| `/profile/language` | Language settings |
| `/dashboard` | Topbar avatar + AR/EN switcher |

---

## Docs

- [Audit report](./STAGE_3_AUDIT_REPORT.md)
- [Implementation plan](./STAGE_3_IMPLEMENTATION_PLAN.md)
- [Completion report](./STAGE_3_COMPLETION_REPORT.md)
- [Phase 3.1 — Profile](./Phase%203.1%20—%20Profile/README.md)
- [Phase 3.2 — Addresses](./Phase%203.2%20—%20Addresses/README.md)
- [Phase 3.3 — Media](./Phase%203.3%20—%20Media/README.md)

---

## Local setup

```bash
php artisan migrate
php artisan storage:link   # required for avatar URLs
```

Restart Vite dev server so `/storage` proxy is active.

---

## Next step

**PO review** → explicit authorization required before status becomes **FINALIZED**.

Stage 4+ (Catalog / business domains) remains **NOT AUTHORIZED**.
