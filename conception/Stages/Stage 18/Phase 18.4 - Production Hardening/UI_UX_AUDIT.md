# UI/UX Audit — Admin Panel

**Date:** 2026-08-22  
**Scope:** Filament `/admin` — login, dashboard, all resources

## Branding

| Area | Status | Notes |
|------|--------|-------|
| Primary `#947961` | ✅ | Filament color + theme CSS |
| Dark `#1f3d3a` | ✅ | Sidebar in theme |
| Surface `#f3ecdb` | ✅ | Main background |
| Logo | ✅ | `logo_diyar.svg` |
| Brand name | ✅ | `admin.panel.brand_name` localized |

## Screens (manual QA required)

| Screen | EN LTR | AR RTL | Notes |
|--------|--------|--------|-------|
| Login | ⬜ | ⬜ | Gradient + logo |
| Dashboard | ⬜ | ⬜ | 4 widget sections |
| Sidebar / nav | ⬜ | ⬜ | Groups, icons, collapse |
| Orders list/detail | ⬜ | ⬜ | Operational columns |
| Products list/detail | ✅ impl | ⬜ | Sections + relations |
| Returns list/detail | ✅ impl | ⬜ | State actions |
| Audit viewer | ✅ impl | ⬜ | Filters |
| Settings | ✅ impl | ⬜ | Grouped table |

## Marketplace regression

| Check | Status |
|-------|--------|
| Sidebar LTR opens left | ✅ (prior fix) |
| Sidebar RTL opens right | ✅ (prior fix) |

## Empty / loading / error states

- Filament defaults in use; custom empty messages pending per-resource review.
