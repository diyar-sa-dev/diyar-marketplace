# Performance — Phase 26.11–26.12

## Query budgets (verified)

| Endpoint | Budget | Test | Result |
|----------|--------|------|--------|
| Vendor overview | ≤12 queries | `VendorAnalyticsTest` | ✅ PASS |

Other endpoints rely on TTL cache; uncached vendor sales series may exceed budget on cache miss (known limitation).

## Cache

| Layer | TTL (default) | Stampede lock |
|-------|---------------|---------------|
| Vendor KPI | 60s | ✅ |
| Charts | 180s | ✅ |
| Funnel | 300s | ✅ |
| Cohorts | 900s | ✅ |

Invalidation: version bump (no full flush).

## Database indexes (migration 264100)

| Table | Index | Reason |
|-------|-------|--------|
| `orders` | `created_at` | Admin/vendor date filters |
| `payments` | `(status, paid_at)`, `created_at` | Funnel + KPI aggregates |
| `vendor_orders` | `(vendor_account_id, status, updated_at)` | Vendor KPI window |
| `payment_vendor_allocations` | `vendor_account_id` | Vendor gross/net |
| `cart_items` | `created_at` | Funnel fallback |
| `analytics_events` | `(provider_account_id, event_type, created_at)` | Provider events |

## k6 load testing

**Status: CI-automated (smoke + analytics profiles)**

Scripts:

| Script | Profile | CI workflow |
|--------|---------|-------------|
| `scripts/performance/smoke.js` | Catalog 10→100 VUs | `performance.yml` (weekly) |
| `scripts/performance/analytics.js` | Analytics 5→20 VUs, authenticated | `ci.yml` + `performance.yml` |

CI uploads `k6-analytics-summary.json` with measured p95/p99 per tagged endpoint:

- `admin-funnel` → `/admin/analytics/funnel`
- `vendor-overview` → `/dashboard/vendor/analytics/overview`
- `provider-overview` → `/dashboard/provider/analytics/overview`

### Design targets (not pass/fail unless thresholds regress)

| Profile | p95 target |
|---------|------------|
| Analytics cached overview | < 250ms |
| Analytics uncached | < 500ms |
| Normal API | < 300ms |

k6 analytics thresholds (enforced in CI): endpoint p95 < 800ms, error rate < 5%.

**25K VUs NOT VERIFIED** — workflows use smoke/analytics profiles only.

## Frontend

- Vendor + provider analytics routes lazy-loaded ✅
- Admin funnel + cohort pages ✅
- TanStack Query staleTime on analytics hooks ✅
- Playwright `frontend/e2e/analytics.spec.ts` covers vendor, provider, admin funnel/cohort/search ✅

## p95 measurements

Download the latest **`k6-analytics-summary`** artifact from the CI **k6 — analytics p95** job (or weekly `performance.yml` run).

Example shape:

```json
{
  "overall": { "p95_ms": 0, "p99_ms": 0, "rps": 0 },
  "endpoints": {
    "admin-funnel": { "p95_ms": 0, "p99_ms": 0, "avg_ms": 0 },
    "vendor-overview": { "p95_ms": 0, "p99_ms": 0, "avg_ms": 0 },
    "provider-overview": { "p95_ms": 0, "p99_ms": 0, "avg_ms": 0 }
  }
}
```

Replace zeros with artifact values after the next CI run — do not treat design targets as achieved without measured numbers.
