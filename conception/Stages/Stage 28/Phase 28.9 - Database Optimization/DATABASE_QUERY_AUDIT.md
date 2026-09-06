# Database Query Audit — Phase 28.9

**Date:** 2026-08-27  
**Method:** Static grep of `backend/app` + Phase 28.2/28.7 evidence

---

## Raw SQL density (approximate file hits)

| Pattern | ~Files | Hotspots |
|---------|--------|----------|
| `selectRaw` / `whereRaw` / `DB::raw` | 25+ | Analytics services, affiliate dashboard, finance reporting |
| `join` / `leftJoin` | Widespread | Catalog search, admin lists, analytics |
| `DATE_FORMAT` / `TIMESTAMPDIFF` | Analytics | `AdminAnalyticsService`, `VendorAnalyticsService`, `ProviderAnalyticsService` |

**Rule applied:** Did not rewrite MySQL-specific analytics SQL without slow-query evidence (OPT-DB-002 adequate at current scale).

---

## Pagination audit

**`paginate()` usage:** 60+ service/controller locations (catalog, admin, chat, finance, B2B).

| Pattern | Assessment |
|---------|------------|
| `paginate()` on list endpoints | Standard — acceptable with indexes |
| `simplePaginate()` | Rare — not required migration in 28.9 |
| `cursorPaginate()` | Not used — API contract preserves offset pagination |
| Deep OFFSET | **NOT VERIFIED** at 10k+ — OPT-DB-003 |

**Critical lists reviewed:**

| Endpoint / service | Filter + sort | Index support |
|--------------------|---------------|---------------|
| `GET /api/v1/products` | status + created_at | **OPT-DB-001 fixed** |
| Admin orders | status filters | Partial — needs scale test |
| Vendor orders | vendor_account_id + status | Existing composite |
| Notifications | user_id + read state | Existing indexes |

---

## Large / expensive queries

| Query | Priority | Finding | 28.9 action |
|-------|----------|---------|-------------|
| Products public list | P1 | Full scan | **Fixed** |
| Analytics 30d rollup | P3 | Index scan OK @ 5k | Deferred |
| Admin cohort/revenue | P3 | Complex subqueries + DATE_FORMAT | Document; 28.10 |
| Catalog search | P2 | `CatalogSearchService` joins | Not profiled — 28.10 |
| Checkout preview | P2 | Bounded query count (28.2 PASS) | No change |

---

## Unbounded query check

No production `->get()` without limits found on high-volume list controllers (admin/catalog use `paginate()`).

**Application-side filtering:** Product filters (price, category) applied in query builder — appropriate.

---

## Transactions / locking (preserved)

Audited patterns unchanged by 28.9:

- Order placement, payment capture, coupon redemption, inventory decrement — existing `DB::transaction()` + locks retained.
- Index addition on `products` does not alter transaction boundaries.

---

## Recommendations (future phases)

| ID | Query | Phase |
|----|-------|-------|
| OPT-API-002 | Admin funnel — wall time >> SQL | 28.10 |
| DB-QRY-001 | Catalog full-text/search joins | 28.10 |
| DB-QRY-002 | Analytics DATE_FORMAT index sargability | 28.10+ if slow |
