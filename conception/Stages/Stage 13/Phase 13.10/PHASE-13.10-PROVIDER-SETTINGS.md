# Phase 13.10 — Provider Settings & Work Policy

> **Status:** **COMPLETE**  
> **Scope:** Provider profile, account, bank, notifications, working hours, avatar, work policy.

---

## Problem solved

Providers configure their public identity, operational terms, payout destination, and notification preferences through a unified settings experience.

---

## Backend

| Component | Path |
|-----------|------|
| Controller | `ProviderSettingsController`, `ProviderWorkPolicyController` |
| Services | `ProviderSettingsService`, `ProviderWorkPolicyService` |
| Models | `ProviderAccount`, `ProviderBankAccount`, `ProviderWorkPolicy` |
| Resources | `ProviderSettingsResource`, `ProviderWorkPolicyResource` |

### API (`/dashboard/provider/settings/*`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/settings` | Full settings bundle |
| PATCH | `/settings/profile` | Specialty, bio, work areas, location |
| PUT | `/settings/working-hours` | Weekly schedule |
| PATCH | `/settings/account` | Contact/account fields |
| PATCH | `/settings/password` | Password change |
| PATCH | `/settings/notifications` | Email/push prefs |
| PATCH | `/settings/bank-account` | IBAN/bank details |
| POST/DELETE | `/settings/avatar` | Avatar media |
| GET/PUT | `/settings/work-policy` | Delivery/revision/cancellation terms |

Public exposure: `work_policy_summary` on `GET /providers/{slug}` via `ProviderProfileService`.

---

## Work policy fields

| Field | Purpose |
|-------|---------|
| `policy_enabled` | Toggle public display |
| `initial_delivery_days` | Default delivery timeline |
| `free_revisions_included` | Revision count |
| `timeline_by_project_scope` | Scope-based timeline flag |
| `cancellation_notice_hours` | Cancellation window |
| `custom_terms` | JSON array of custom bullet terms |

Migration: `2026_08_19_240000_create_provider_work_policies.php`

---

## Frontend

| Route | Page |
|-------|------|
| `/dashboard/service/settings` | `ServiceSettings.tsx` |

Sections: profile, working hours, bank account, notifications, password, work policy editor.

**Hooks:** `useProviderSettings`, `useUpdateProviderWorkPolicy`  
**Components:** `WorkingHoursEditor`, work policy form sections

---

## Validation

- Request classes in `Http/Requests/ServiceMarketplace/UpdateProvider*`
- IBAN validation via shared validators (if bank account present)
- Avatar MIME/size via `MediaUploadService`
- Password requires current password confirmation

---

## Authorization

- Provider can only read/update own `ProviderAccount`
- Admin role can access routes but operational UI is provider-facing

---

## Tests

`ProviderDashboardExtrasTest`:

- GET/PATCH settings profile
- PATCH notifications
- PUT work policy
- Public provider shows `work_policy_summary`

---

## Outside this phase

- Provider team members with granular settings permissions
- Admin override of provider settings (Future Admin)
- Legal document upload (vendor has legal profile; provider uses work policy terms)

---

## Deferred

- Email notification delivery backend (prefs stored; delivery Stage 17+)
- Multi-location branch management
