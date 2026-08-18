# Stage 12.5 — Progress Report

> **Date:** 2026-08-18  
> **Verdict:** **COMPLETE** (committed `6a2ceba`)

---

## Executive summary

Stage 12.5 extends **Stage 12 (vendor portal)** with **email identity**, **transactional mail**, **vendor team RBAC**, **product preorders**, and **marketplace engagement** polish.

---

## Completed work (by phase)

### Phase 12.5.1 — Email verification & transactional mail

- Email OTP for unverified login and profile verification
- `EmailOtpService` + cache store; dev OTP via `LogEmailOtpProvider` when mail disabled
- Arabic RTL mail templates (`DiyarMailTemplate`, `DiyarMailContent`) — OTP, welcome, team invite
- Welcome email on first session (verified email) gated by notification preference
- `welcome_email_sent_at` on users

### Phase 12.5.2 — Vendor team & role lifecycle

- Team invite by email, accept/reject via `/team-invite?token=`
- Roles: **owner** (store account holder), **manager**, **customer_service**
- Permission matrix (`VendorTeamPermissions`) enforced on dashboard routes
- **`VendorTeamRoleSync`**: on removal — DB transaction, revoke team-granted `vendor` role when no other active membership and no own store; preserve intrinsic vendor role
- `vendor_role_granted` flag on `vendor_team_members`
- 12 feature tests in `VendorTeamTest`

### Phase 12.5.3 — Product preorders

- `product_preorder_requests` table + API
- Customer: submit preorder from PDP (no cart quantity flow)
- Vendor: list/cancel preorders at `/dashboard/vendor/preorders`
- Dashboard stat card for pending preorders

### Phase 12.5.4 — Store engagement & UX

- Store follow/unfollow + `followers_count` on storefront stats
- Product share sheet on store banner (same component as PDP)
- Working hours: Arabic weekdays RTL, times LTR with AM/PM
- Vendor review inbox; replies show **store business name** not personal name
- Customer unified review history (`/profile/reviews`)
- Self-purchase guard through cart validation → checkout
- Dashboard cards: 2 rows × 4 columns; label `التقييم` (short)

### Phase 12.5.5 — Notification preferences

- Shape: `user.preferences.notifications.{email,push,sms,orders,promotions,system}`
- Backend: `UserNotificationPreferences::emailEnabled()`, `mailLocale()`
- Frontend: `NotificationSettingsPage` + vendor settings notifications tab persist via `PATCH /profile`
- Welcome email skipped when `email: false`

### Phase 12.5.6 — Portal access guard (rev 2)

- `VendorPortalGuard` uses **`window.location.replace('/profile')`** — fixes stuck redirect
- Strips stale vendor role client-side after `/auth/me`
- Backend: always revokes vendor role when no store + no active team

---

## Verification snapshot (2026-08-18)

```text
php artisan test     → 345 / 345 pass (with DIYAR_MAIL_ENABLED=false in phpunit.xml)
npm run typecheck    → PASS
VendorTeamTest       → 12 / 12 pass
```

---

## Migrations added (Stage 12.5)

| Migration | Purpose |
|-----------|---------|
| `2026_08_18_120000_create_store_reviews_table.php` | Store reviews |
| `2026_08_18_150000_create_vendor_settings_extensions.php` | Legal, bank, working hours |
| `2026_08_18_160000_add_website_url_to_vendor_accounts.php` | Store website |
| `2026_08_18_170000_create_vendor_team_members_table.php` | Vendor team |
| `2026_08_18_180000_add_vendor_replies_to_reviews.php` | Vendor reply on reviews |
| `2026_08_18_190000_add_welcome_email_sent_at_to_users.php` | Welcome email once |
| `2026_08_18_200000_create_product_preorder_requests_table.php` | Preorders |
| `2026_08_18_210000_add_vendor_role_granted_to_vendor_team_members.php` | Role lifecycle tracking |

---

## Deferred (out of Stage 12.5 scope)

| Item | Target |
|------|--------|
| Push/SMS notification delivery | Stage 16 |
| Team notification toggles (orders/stock/reports) | Decorative UI — future |
| **Service marketplace (provider)** | **Stage 13** |

---

*Next: [Stage 13 — Service Marketplace](../Stage%2013/README.md)*
