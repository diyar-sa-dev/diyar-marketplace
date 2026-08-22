# Security Audit — Admin Panel

**Date:** 2026-08-22

## Authentication boundaries

| Test | Automated | Status |
|------|-----------|--------|
| Admin guard separate from web/Sanctum | `AdminIsolationTest` | ✅ |
| Web session cannot access `/admin` | `AdminSecurityHardeningTest` | ✅ |
| Admin-only blocked from marketplace API | `AdminIsolationTest` | ✅ |
| Marketplace roles blocked from admin API | `AdminIsolationTest` | ✅ |

## Authorization

| Test | Status |
|------|--------|
| Granular permission denial (settings, payouts) | `AdminSecurityHardeningTest` | ✅ |
| Filament resource permission gates | Tier 1–3 tests | ✅ |
| Admin ≠ marketplace role routing | `roles.ts` + API middleware | ✅ |

## Financial

| Invariant | Status |
|-----------|--------|
| Refund via `RefundProcessingService` only | ✅ domain |
| Return transitions via `ReturnStateService` | ✅ domain |
| Admin return actions wrap domain + audit | ✅ `AdminReturnService` |
| Payout via `PayoutService` / Filament actions | ✅ Tier 1 |
| Direct balance mutation forbidden | ⬜ grep audit recommended |

## Settings / theme

| Check | Status |
|-------|--------|
| Public theme endpoint DTO-only | ✅ `PlatformThemeController` |
| No secrets in public theme | ✅ test |
| Setting type validation | ✅ `SystemSettingService` |

## IDOR manual pass

- [ ] `/admin/orders/{uuid}` with wrong UUID
- [ ] `/admin/products/{uuid}` cross-tenant
- [ ] `/api/v1/admin/*` with Sanctum non-admin token

## Production credentials

- [ ] Ensure `AdminSeeder` dev password not used in production
- [ ] Force credential rotation on first deploy
