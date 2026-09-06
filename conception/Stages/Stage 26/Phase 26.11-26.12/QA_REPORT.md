# QA Report — Phase 26.11 / 26.12

## Backend (PHPUnit)

```bash
php artisan test --filter=Analytics
```

| Result | Count |
|--------|-------|
| **PASS** | **15 / 15** |

### Test files

| File | Coverage |
|------|----------|
| `ProductViewAnalyticsTest` | View recording, dedupe, prefetch skip |
| `AnalyticsCacheInvalidationTest` | Version bump, post-payment KPI refresh |
| `VendorAnalyticsTest` | Tenant isolation, query budget, cache keys |
| `AdminAnalyticsTest` | Funnel unavailable stages, search analytics |
| `SearchAnalyticsTest` | Search write path |
| `CsvExportHelperTest` | Formula injection neutralization |

## Frontend

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ PASS |
| `npm run build` | ✅ PASS |

## Playwright

| Spec | Status |
|------|--------|
| `frontend/e2e/analytics.spec.ts` | **NOT VERIFIED** — added, not executed |

Covers: vendor analytics load, period selector, admin search analytics.

## Full regression suite

**NOT RUN** — Full `php artisan test` not executed in this session due to suite size. Analytics subset green.

## Manual verification recommended

1. Open product → confirm funnel product_views increment (after dedupe window)
2. Checkout preview → checkout_started event
3. Complete order + payment → funnel payment_completed
4. Vendor analytics page — all KPI cards, chart error retry
5. Admin search analytics — KPI cards
