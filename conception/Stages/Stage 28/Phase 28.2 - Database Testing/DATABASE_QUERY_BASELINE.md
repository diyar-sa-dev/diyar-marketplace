# Phase 28.2 — Query Performance Baseline

**Date:** 2026-08-27  
**Rule:** Measurement only — **no optimization performed**

---

## Methodology

| Method | Scope |
|--------|-------|
| Existing PHPUnit query-count tests | Catalog list, checkout preview |
| Laravel query log | Enabled during test execution |
| `EXPLAIN` / `EXPLAIN ANALYZE` | **NOT RUN** in Phase 28.2 |
| Production traffic profiling | **NOT AVAILABLE** |

All measurements below use **SQLite `:memory:`** (PHPUnit default) unless noted.

---

## Catalog — product list

**Test:** `CatalogQueryPerformanceTest::test_product_list_avoids_per_card_review_fallback_queries`  
**Endpoint:** `GET /api/v1/products?per_page=8`  
**Fixture:** 8 products

| Metric | Value |
|--------|-------|
| Per-card review N+1 queries | **0** |
| Assertion | PASS |
| Total query count | NOT RECORDED separately |

**Finding:** Product cards do **not** trigger per-card `COUNT(*)` / `AVG(rating)` fallback queries — N+1 mitigated for review aggregates on list view.

---

## Checkout — shipping preview

**Test:** `CheckoutShippingQueryCountTest::test_checkout_preview_query_count_does_not_scale_linearly_with_cart_items`  
**Endpoint:** `POST /api/v1/checkout/preview`  
**Fixture:** 1 product, advanced shipping rules, Riyadh address

| Cart qty | Query count behavior |
|----------|---------------------|
| 1 item | Baseline count (not logged numerically in output) |
| 10 items | ≤ baseline + 5 queries |
| Assertion | **PASS** — sub-linear scaling |

**Finding:** Checkout preview shipping resolution is **bounded** — not O(n) per cart line for DB queries.

---

## Analytics services (static review)

High `selectRaw` density — **optimization candidates only**:

| Service | Raw aggregate patterns |
|---------|------------------------|
| `AdminAnalyticsService` | Cohort, daily revenue — `DATE_FORMAT`, `TIMESTAMPDIFF` |
| `VendorAnalyticsService` | Product sales, coupon stats, payment counts |
| `ProviderAnalyticsService` | Booking status breakdowns, service metrics |
| `AffiliateDashboardService` | Traffic source, earnings by period |

**Query count at runtime:** **NOT MEASURED** in Phase 28.2 — requires seeded MySQL data + HTTP profiling in Phase 28.7.

---

## N+1 assessment summary

| Workflow | N+1 present? | Severity | Evidence |
|----------|--------------|----------|----------|
| Product list (8 items) | **NO** | — | CatalogQueryPerformanceTest PASS |
| Checkout preview (1→10 qty) | **NO** (bounded) | — | CheckoutShippingQueryCountTest PASS |
| Vendor analytics dashboard | **NOT VERIFIED** | P3 suspect | Many joins/raw aggregates — needs profiling |
| Admin analytics cohort | **NOT VERIFIED** | P3 suspect | Complex subqueries |
| Chat message lists | **NOT VERIFIED** | P3 | Not profiled |
| Order detail with items | **NOT VERIFIED** | P3 | Covered by feature tests, not query counts |

---

## Optimization backlog (NOT implemented)

| ID | Candidate | Type |
|----|-----------|------|
| OPT-DB-001 | Profile vendor/provider analytics endpoints under seed load | Query count |
| OPT-DB-002 | EXPLAIN analytics cohort query on MySQL 8 | Index review |
| OPT-DB-003 | Profile admin order list pagination at scale | Unbounded result check |

---

## Query baseline gate

```text
CAPTURED (partial)
```

Catalog and checkout paths have **explicit query-count regression tests**. Broader API surface **NOT profiled** in this phase.
