# Phase 28.12 — Frontend Component Audit

## 250-line rule — work completed

| File | Lines before | Action | Status |
|------|-------------:|--------|--------|
| `components/home/Sections.tsx` | 1,607 | Split into 20 section files + barrel | **FIXED** |
| `MarketplaceShell.tsx` | ~468 | Extracted `MobileBottomNav.tsx` (~80 lines) | **PARTIAL** (~390 lines remain) |

## Exempt (data, not UI components)

| File | Lines | Justification |
|------|------:|---------------|
| `lib/i18n/locales/en.ts` | 5,125 | Translation catalog — lazy-loaded, not a component |
| `lib/i18n/locales/ar.ts` | 5,046 | Translation catalog — lazy-loaded, not a component |

## Remaining >250 lines — classified DEFERRED (P2)

Priority order for Phase 28.13 / follow-up refactors:

| Lines | File | Recommended split |
|------:|------|-------------------|
| 1,169 | `components/layout/SidebarMenu.tsx` | Nav groups, projects modal, mobile drawer |
| 1,163 | `pages/dashboard/VendorSettings.tsx` | Settings tabs, forms, hooks |
| 1,012 | `components/dashboard/vendor/VendorProductFormModal.tsx` | Form sections, media, variants |
| 938 | `pages/CategoryPage.tsx` | Filters, product grid, hooks |
| 934 | `pages/ChatPage.tsx` | Conversation list, message pane, hooks |
| 890 | `pages/dashboard/ServiceBookings.tsx` | Table, filters, booking detail |
| 854 | `pages/ProductDetailsPage.tsx` | Gallery, info, reviews, related |
| 832 | `pages/dashboard/VendorFinance.tsx` | Summary, charts, payouts table |
| 828 | `pages/AuthPage.tsx` | Login/register/OTP forms |
| 725 | `pages/CheckoutPage.tsx` | Address, payment, summary steps |

*(23 additional files 580–725 lines — full list in `_raw/component-line-count.txt`)*

## Homepage architecture (after)

```
HomePage.tsx
├── Hero, CategoriesStrip, FeaturedDeals (eager)
├── FastOffersSlider, MostInteractiveProducts (eager, small)
└── homeLazySections.ts (17 lazy sections)
    └── sections/*.tsx (each <250 lines)
```

## Split quality criteria met

- Splits follow real responsibilities (product showcase, promo, content sections)
- No meaningless micro-components
- Barrel `Sections.tsx` re-exports for backward compatibility
