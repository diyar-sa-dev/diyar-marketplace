# Phase 18.4C — RTL / LTR

**Status:** Pending (integrated during 18.4A/B, verified here)  
**Do not defer** until after UI implementation.

## Locales

| Locale | Direction |
|--------|-----------|
| `en` | LTR |
| `ar` | RTL |

## Must work in both directions

- Sidebar (marketplace: LTR left, RTL right — regression required)
- Tables, filters, forms, modals, pagination
- Charts, tabs, dropdowns, notifications
- Icons, arrows, spacing, directional animations

## Mechanisms

- `SetAdminLocale` middleware
- `filament.admin.locale-direction` BODY_START hook
- Alexandria (LTR) / Tajawal (RTL) in `theme.css`
- User menu + topbar locale switcher

## Acceptance

- [ ] Full Arabic panel walkthrough (see `UI_UX_AUDIT.md`)
- [ ] Full English panel walkthrough
- [ ] Marketplace SPA sidebar position unchanged (LTR left / RTL right)
