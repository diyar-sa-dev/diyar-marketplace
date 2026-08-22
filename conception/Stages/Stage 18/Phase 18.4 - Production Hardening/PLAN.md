# Phase 18.4 — Plan

## Workflow

```text
18.4A  UI implementation      ← in progress
18.4B  Detail-page UX
18.4C  RTL/LTR verification
18.4D  Responsive
18.4E  Performance + security
       ↓
MANUAL QA (MANUAL_QA_FINDINGS.md)
       ↓
Production verification
       ↓
STAGE 18 COMPLETE / VERIFIED
```

## 1. Resource gaps ✅ (functional foundation)

- [x] Products Filament resource + `AdminProductService`
- [x] ReturnRequests Filament resource + `AdminReturnService`
- [x] Vendor operational relation managers
- [x] Provider operational relation managers
- [x] User operational relation managers
- [ ] Detail-page UX polish (18.4B)

## 2. Phase 18.4A — Admin UI / DIYAR branding

- [x] Custom theme CSS (`resources/css/filament/admin/theme.css`)
- [x] Fallback theme when Vite manifest absent (dev/tests)
- [x] Localized brand name + locale switcher (user menu + topbar pill)
- [x] Dashboard: NeedsAttention, BusinessOverview, RecentActivity widgets
- [x] `PresentsOperationalEntity` on Vendor / Provider / User view pages
- [x] Recent activity widget DIYAR styling
- [ ] Login page visual pass
- [ ] Every resource table/form/detail consistency pass

## 3. Phase 18.4B — Detail-page UX

- [ ] Vendor profile header + operational tab workspace
- [ ] Provider profile header + operational tab workspace
- [ ] User profile header + operational tab workspace
- [ ] Finance tab summary blocks (not description-only)

## 4. Phase 18.4C — RTL/LTR

- [x] `SetAdminLocale` + locale-direction hook
- [ ] Full Arabic panel checklist (see UI_UX_AUDIT.md)
- [ ] Marketplace sidebar regression (LTR left, RTL right)

## 5. Phase 18.4D — Responsive

- [ ] Breakpoint pass: 1920, 1440, 1280, 1024, 768, 430, 390

## 6. Localization

- [x] Extended `lang/en/admin.php` + `lang/ar/admin.php`
- [ ] Scan for remaining hardcoded strings

## 7. Phase 18.4E — Performance

- [x] Dashboard SQL aggregates (not `Model::all()`)
- [x] Order list eager-loads `user`
- [x] Product/Return resources eager-load relations
- [x] Existing domain migrations already define operational indexes
- [ ] Query log spot-check on heaviest pages / detail tabs

## 8. Phase 18.4E — Security

- [x] Dedicated `admin` guard
- [x] `EnsureMarketplaceAccess` / `EnsureAdminSessionAccess`
- [x] `AdminIsolationTest`
- [x] `AdminSecurityHardeningTest`
- [ ] IDOR manual pass on all `/admin/*` view routes
- [ ] Financial invariant tests (refund idempotency, payout balance)

## 9. Settings / theme endpoint

- [x] `EffectiveConfigService::publicThemeTokens()` DTO
- [x] Theme endpoint returns `theme` key only
- [ ] Allowlist validation audit on all setting types

## 10. Manual QA (after 18.4A–E)

- [ ] Follow order in `MANUAL_QA_FINDINGS.md`
- [ ] Record findings in same doc

## 11. Regression (before manual QA + before VERIFIED)

```bash
cd backend
php artisan migrate
php artisan db:seed --class=AdminPermissionSeeder
php artisan db:seed --class=SystemSettingSeeder
php artisan test          # 497 | 492 passed | 5 skipped | 0 failed
php artisan test --filter=Admin

cd backend && npm run build
cd ../frontend && npm run typecheck && npm run build
```

## 12. Production

- [ ] `ext-intl` enabled
- [ ] `APP_DEBUG=false`
- [ ] Remove/default rotate `AdminSeeder` dev credentials
- [ ] `npm run build` in backend for Filament theme

## Acceptance

Stage 18 → **COMPLETE / VERIFIED** only when 18.4A–E, manual QA, production checklist, and full regression pass.

