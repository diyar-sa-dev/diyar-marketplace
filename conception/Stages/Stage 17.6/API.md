# API — Stage 17.6 Affiliate

Base: `/api/v1`

## Public

| Method | Path | Description |
|--------|------|-------------|
| POST | `/affiliate/referrals/click` | Record click + attribution (throttled) |
| GET | `/affiliate/referrals/resolve` | Resolve referral code for product |

## Marketer (`role:marketer,admin`)

Prefix: `/dashboard/affiliate`

| Method | Path |
|--------|------|
| GET | `/` |
| GET | `/products` |
| GET/POST | `/links` |
| POST | `/links/{link}/deactivate` |
| GET | `/reports` |
| GET/POST | `/payouts` |
| GET/PATCH | `/settings` |

## Vendor (`role:vendor,admin`)

| Method | Path |
|--------|------|
| GET | `/dashboard/vendor/products/{product}/affiliate` |
| PATCH | `/dashboard/vendor/products/{product}/affiliate` |
