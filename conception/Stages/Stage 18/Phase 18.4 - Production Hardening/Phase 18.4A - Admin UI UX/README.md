# Phase 18.4A — Admin UI/UX Design & Implementation

**Status:** In progress  
**Blocks:** Manual QA (Phase 18.4 manual pass), production verification, Stage 18 **COMPLETE / VERIFIED**

## Purpose

Make `/admin` feel like a real DIYAR operations platform — not default Filament — while keeping all domain logic and authorization unchanged.

## Scope

### Global admin shell

- DIYAR sidebar, logo, collapsible desktop sidebar, responsive mobile behavior
- Top navigation, breadcrumbs, user menu, locale switcher (EN/AR)
- RTL/LTR direction hook (built during this phase, verified in 18.4C)
- Notification UI, search, spacing, typography, icons, hover/focus/active states
- Consistent cards, buttons, badges, dropdowns, modals, confirmations

### Dashboard

Real-data widgets only:

- KPI cards (NeedsAttention, BusinessOverview)
- Operational alerts, revenue/commerce overview
- Order / payout / affiliate overview
- Recent activity (audit + orders)
- Quick actions (future pass if needed)

### Resource UI

Every Tier 1–3 resource gets operational list/view/form polish — not bare table + default CRUD.

### Detail-page UX (starts here, completed in 18.4B)

- Vendor / Provider / User view pages: operational subheading + relation-manager tab strip
- `PresentsOperationalEntity` trait on `ViewVendorAccount`, `ViewProviderAccount`, `ViewUser`

## Key files

| Area | Path |
|------|------|
| Panel provider | `backend/app/Providers/Filament/AdminPanelProvider.php` |
| Theme | `backend/resources/css/filament/admin/theme.css` |
| Locale hook | `backend/resources/views/filament/admin/hooks/topbar-locale.blade.php` |
| Direction hook | `backend/resources/views/filament/admin/locale-direction.blade.php` |
| Dashboard | `backend/app/Filament/Admin/Pages/Dashboard.php` |
| Widgets | `backend/app/Filament/Admin/Widgets/*` |
| Operational entity trait | `backend/app/Filament/Admin/Concerns/PresentsOperationalEntity.php` |

## Build

```bash
cd backend
npm install
npm run build
```

Without `public/build/manifest.json`, the panel uses the fallback theme hook for dev/tests.

## Acceptance (18.4A)

- [x] DIYAR theme applied when Vite manifest present
- [x] Custom admin login page (`Pages/Auth/Login`) with branding panel + locale switcher
- [x] Sidebar, topbar, breadcrumbs, user menu visually on-brand (theme.css)
- [x] Dashboard: welcome widget, needs attention, business overview, recent activity, quick actions
- [x] Locale switcher visible (user menu + topbar pill + login)
- [x] Vendor / Provider / User view pages: operational profile header + subheading
- [x] Finance tab: summary cards via `VendorBalanceService`
- [x] Shared table defaults (`AdminTableDefaults`) on all 30 resource tables
- [x] Shared formatters (`AdminUi`) for currency
- [ ] Login page visual QA in browser
- [ ] Every resource form/detail manual polish pass (ongoing)

## Next phases

| Phase | Focus |
|-------|--------|
| [18.4B](../Phase%2018.4B%20-%20Detail%20Page%20UX/README.md) | Full tabbed operational detail pages |
| [18.4C](../Phase%2018.4C%20-%20RTL%20LTR/README.md) | Arabic RTL + English LTR verification |
| [18.4D](../Phase%2018.4D%20-%20Responsive/README.md) | Breakpoint pass (1920 → 390) |
| [18.4E](../Phase%2018.4E%20-%20Performance%20Security/README.md) | N+1, caching, IDOR, sensitive fields |
| Manual QA | `MANUAL_QA_FINDINGS.md` — **only after 18.4A–E** |
