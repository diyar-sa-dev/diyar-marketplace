# Architecture — Analytics

## Event pipeline

```
Product detail GET ──► ProductViewAnalyticsService ──► analytics_events
Cart add           ──► AnalyticsEventRecorder       ──► analytics_events
Checkout preview   ──► AnalyticsEventRecorder       ──► analytics_events (checkout_started)
Order create       ──► AnalyticsEventRecorder       ──► analytics_events (checkout_completed)
Payment submit     ──► AnalyticsEventRecorder       ──► analytics_events (payment_started)
Payment finalize   ──► AnalyticsEventRecorder       ──► analytics_events (payment_completed)
Catalog search     ──► SearchAnalyticsRecorder      ──► search_query_events (separate table)
```

### Deduplication

| Event | Window | Key |
|-------|--------|-----|
| `product_viewed` | 1800s (config) | product + user/session hash |
| `checkout_started` | 3600s | per user |

Skips: prefetch headers, known crawlers.

## Funnel stages (admin)

| Stage | Source | Notes |
|-------|--------|-------|
| Product views | `analytics_events` | `available: false` when zero |
| Add to cart | events + cart_items fallback | max(events, cart rows) |
| Checkout started | `analytics_events` | Real events; unavailable until data exists |
| Order created | `orders.created_at` | Authoritative order count |
| Payment initiated | `payments.created_at` | Payment record creation |
| Payment completed | `payments.paid_at` + status=paid | **Paid only** — not order-created proxy |

## Financial KPI definitions

### Admin

| KPI | Definition |
|-----|------------|
| Gross sales | `SUM(orders.grand_total)` in period |
| Payment volume | `SUM(payments.amount)` where `paid_at` set |
| Refunds | `SUM(refunds.total_amount)` in period |
| AOV | `AVG(orders.grand_total)` |
| Payment success rate | paid payments / all payments created in period |

**Note:** Payment volume may differ from order gross (retries, partial flows).

### Vendor

| KPI | Definition |
|-----|------------|
| Gross sales | `SUM(payment_vendor_allocations.vendor_gross_total)` for paid payments |
| Net sales | `SUM(vendor_payable_amount) - refunds` (financial_transactions debits) |
| Orders | Delivered vendor orders in period |
| AOV | `SUM(vendor_total) / orders` on delivered vendor orders |

Net sales ≠ finance ledger net earnings (commissions/escrow excluded by design).

## Cache

```
analytics:version:{scope}:{scopeId}  → bump on invalidation
analytics:{scope}:{scopeId}:{metric}:{from}:{to}:{hash}  → cached payload
analytics:lock:{md5(key)}            → stampede lock (30s, 5s block)
```

### Invalidation triggers

- `PaymentSucceeded`, `PaymentFailed` → platform + affected vendors
- `OrderCreated` → platform + vendors
- `BookingCreated`, `BookingCompleted` → platform + provider

## Permissions

| Permission | Endpoints |
|------------|-----------|
| `analytics.view` | Admin overview, sales, funnel, cohorts |
| `analytics.view_financial` | Financial KPI fields in overview |
| `analytics.export` | Admin CSV export |
| `search.analytics.view` | Search analytics |
| Vendor `dashboard` | Vendor analytics reads |
| Vendor `finance` | Vendor analytics export |
