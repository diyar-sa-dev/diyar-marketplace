# Affiliate Dashboard — Data Wiring

## Overview endpoint

`GET /api/v1/dashboard/affiliate`

Defaults to **current calendar month** when `from`/`to` are omitted.

Returns:

| Field | Source |
|-------|--------|
| `balance.*` | `AffiliateBalanceService` (pending / available / paid_out / payout_minimum) |
| `clicks`, `conversions`, `earnings` | Aggregated SQL for selected period |
| `conversion_rate` | Server-calculated `conversions / clicks * 100` |
| `chart[]` | Last 5 months via `monthlySeries()` |
| `top_links[]` | Top 3 links by earnings in period (subquery aggregation) |

Dashboard cache: 120s TTL with version bust on commission/payout/link mutations.

## Products

`GET /api/v1/dashboard/affiliate/products`

- Server pagination + `search` on product name / vendor name
- `ProductAffiliateSettingResource` includes `image_url`, `expected_commission`

## Links

`GET /api/v1/dashboard/affiliate/links` — paginated, real counters + `public_url`

## Reports

`GET /api/v1/dashboard/affiliate/reports?period=month|week|day|3m|6m|12m|year`

Returns `summary`, `by_link` (sorted, aggregated), `daily` series.

## Payouts

`GET /api/v1/dashboard/affiliate/payouts` — balance + paginated history

`POST /api/v1/dashboard/affiliate/payouts` — server validates amount ≤ available, minimum threshold, IBAN required, idempotency header supported.

## Frontend pages

All `/dashboard/affiliate/*` pages use React Query hooks in `hooks/affiliate/useAffiliate.ts` — no mock business data.
