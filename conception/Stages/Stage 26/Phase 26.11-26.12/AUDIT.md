# Audit — Phase 26.11 / 26.12

**Date:** 2026-08-26  
**Method:** Full codebase inspection (backend + frontend + tests)

## Before (claimed 8.3/10)

| Area | Claim | Verified |
|------|-------|----------|
| Analytics services | Implemented | ✅ Confirmed |
| `product_viewed` | Missing | ✅ Confirmed missing |
| Cache invalidation | Missing | ✅ Confirmed |
| Stampede protection | Missing | ✅ Confirmed |
| Funnel duplicate stages | Issue | ✅ Confirmed |
| Admin/provider analytics UI | Partial | ✅ ~30% API surface had UI |
| Playwright analytics | Missing | ✅ Confirmed |
| k6 profiles | Missing | ✅ k6 not installed locally |

## Gaps fixed in this pass

1. **`product_viewed`** — Server-side on `GET /api/v1/products/{id}` with 30-minute dedupe, bot/prefetch skip
2. **Checkout / payment events** — `checkout_started`, `checkout_completed`, `payment_started`, `payment_completed`
3. **Funnel integrity** — Distinct `checkout_started` from events vs `order_created` from orders
4. **Cache invalidation** — Version-based scope invalidation on payment/order/booking domain events
5. **Stampede protection** — Distributed lock on cache miss in `AnalyticsCache`
6. **DB indexes** — orders, payments, vendor_orders, allocations, cart_items, analytics_events
7. **CSV export** — Formula injection neutralization; renamed misleading `net` → `payment_amount`
8. **Export rate limiting** — `throttle:analytics-export` (10/min)
9. **Vendor analytics UI** — All 9 KPIs, section-level error/retry states
10. **Tests** — +5 analytics tests (15 total passing)
11. **Playwright spec** — `frontend/e2e/analytics.spec.ts` added (NOT EXECUTED this session)
12. **Typecheck/build** — PASS

## Remaining gaps (honest)

| Gap | Severity | Status |
|-----|----------|--------|
| Admin funnel/cohort/overview UI pages | Medium | NOT IMPLEMENTED |
| Provider dedicated analytics page | Medium | NOT IMPLEMENTED |
| Vendor sales series N+1 on cache miss | Low | Mitigated by TTL cache |
| Async export for >10k rows | Low | NOT IMPLEMENTED |
| Full platform UX sweep (checkout/chat/etc.) | Medium | Partial — analytics-focused only |
| WCAG 2.2 AA full audit | Medium | Partial improvements only |
| k6 load tests | Medium | **NOT VERIFIED** — k6 unavailable |
| Playwright execution | Medium | **NOT VERIFIED** — spec added, not run |
| Legacy `/admin/reports/summary` permission alignment | Low | NOT CHANGED |
| `service_viewed` event | Low | NOT WIRED |

## TODO/FIXME scan (analytics paths)

No production `TODO`/`FIXME` in `app/Services/Analytics/`. Deferred comments removed via implementation.
