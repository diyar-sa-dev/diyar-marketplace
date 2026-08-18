# Phase 13.4 — Store Engagement & Storefront UX

> **Status:** Implemented

## Features

- **Follow store** — `VendorStoreFollowService`, follower count in store stats sidebar
- **Share** — store banner uses `ProductShareSheet`
- **Working hours** — RTL weekday labels, LTR time display
- **Review inbox** — vendor replies under store business name
- **Customer review history** — `/profile/reviews` unified product + store
- **Self-purchase guard** — blocks own products in cart/checkout
- **Dashboard nav** — hide لوحة التحكم for customer-only accounts (`shouldShowStorefrontDashboardLink`)
- **Dashboard layout** — 8 stat cards in 2×4 grid; short label `التقييم`

## Key services

- `VendorReviewInboxService`, `CustomerReviewHistoryService`, `SelfPurchaseGuard`
- `VendorStoreFollowService`, `VendorStorefrontPresenter`
