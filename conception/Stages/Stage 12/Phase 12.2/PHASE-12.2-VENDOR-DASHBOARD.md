# Phase 12.2 — Vendor Dashboard

> **Scope:** Overview metrics, store rating aggregate, sales chart, stock alerts, recent orders, top sellers.

---

## UI

**Route:** `/dashboard/vendor`  
**Page:** `frontend/src/pages/dashboard/VendorDashboard.tsx`  
**Hook:** `useVendorDashboardOverview()` in `hooks/vendor/useVendorFinance.ts` (overview shares finance API client)

---

## API

| Method | Endpoint | Response highlights |
|--------|----------|---------------------|
| GET | `/dashboard/vendor/overview` | Period sales, balances, orders counts, returns open, products active/low-stock, store review summary, sales chart, recent orders, low-stock list, top sellers |

**Controller:** `VendorDashboardController::overview`  
**Service:** `VendorDashboardOverviewService`

---

## Real backend data vs deferred

| Widget | Source | Notes |
|--------|--------|-------|
| Period sales (month) | `VendorFinanceReportingService::periodReport` | **Real** |
| Available balance / pending escrow | `VendorBalanceService::summary` | **Real** |
| Order counts (pending/completed/cancelled) | DB aggregates on `vendor_orders` | **Real** |
| Open returns count | `return_requests` scoped to vendor | **Real** |
| Active / low-stock product counts | `products` + `product_inventories` | **Real** — threshold from `diyar.vendor.low_stock_threshold` |
| Store rating summary | `StoreReviewService::ratingSummary` | **Real** — independent store review domain |
| Sales chart (7-day) | `VendorFinanceReportingService::analytics(Week)` | **Real** |
| Recent orders (5) | Latest vendor orders with first line item | **Real** |
| Low-stock products (5) | Inventory query ordered by quantity | **Real** |
| Top selling products | Aggregated from delivered order items | **Real** |
| Notifications bell / alerts feed | `pages/dashboard/Notifications.tsx` | **DEFERRED** — static mock list |

---

## Aggregations (backend)

`VendorDashboardOverviewService` composes:

1. Finance period report (month) + week analytics chart
2. Balance summary (available + escrow)
3. `StoreReviewService::ratingSummary` — average, count, star distribution
4. Order status counts via enum-filtered queries
5. `recentOrders()` — limit 5, eager-loads order + first item product
6. `lowStockProducts()` — limit 5 at/below threshold
7. `topSellingProducts()` — sold quantity from fulfilled line items

No N+1 in overview response: relationships loaded in batch queries.

---

## Performance considerations

- All list endpoints capped (5 items for dashboard widgets)
- Count queries use indexed foreign keys (`vendor_account_id`, `status`)
- Finance analytics reuse existing period resolver — no ad-hoc raw SQL in controller
- Frontend shows `PageLoadingOverlay` + `ErrorState` with retry

---

## Frontend components

- `VendorOrderStatusBadge` for recent order status chips
- `StarRating` for store review summary
- `ChartContainer` + Recharts line chart for sales trend

---

## Tests

`backend/tests/Feature/Api/V1/Dashboard/VendorDashboardOverviewTest.php`

- Overview structure and vendor scoping
- Store review summary included
- Low-stock and top-seller sections present when data exists
