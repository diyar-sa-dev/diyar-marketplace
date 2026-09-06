# API — Loyalty (26.3)

## Customer

### GET `/api/v1/loyalty`

Returns `loyalty` summary: balance, totals, enabled, `sar_per_point`, `points_per_unit`.

### GET `/api/v1/loyalty/transactions`

Query: `type` (`earn|redeem|adjust|reversal|all`), `page`, `per_page` (max 50).

### GET `/api/v1/loyalty/rewards`

Returns `{ items: [], available: false }`.

## Admin

### GET `/api/v1/admin/loyalty/customers/{userId}`

Requires `loyalty.view`. Returns customer, loyalty summary, recent transactions.

### POST `/api/v1/admin/loyalty/customers/{userId}/adjust`

Requires `loyalty.adjust`.

Body: `{ points, direction: credit|debit, reason }`

## Settings

Managed via existing admin settings:

- `commerce.loyalty_enabled`
- `commerce.loyalty_sar_per_point`
- `commerce.loyalty_points_per_unit`

Public read via `/api/v1/platform/commerce`.
