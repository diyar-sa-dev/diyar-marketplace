# Stage 26.3 — Loyalty

Database-backed loyalty accounts, automatic accrual on successful payments, reversals on refunds/returns, admin adjustments, and customer history UI.

## Scope (V1.1)

- Customer balance and transaction history
- Automatic earn on paid orders
- Reversal on refunds/returns (proportional partial refunds)
- Configurable earning rule (default 50 SAR = 1 point, floor rounding)
- Admin visibility and manual adjustments
- Redemption infrastructure only (empty rewards catalog)

## Documentation

| File | Purpose |
|------|---------|
| [BUSINESS_RULES.md](./BUSINESS_RULES.md) | Earning, reversal, rounding, eligible amount |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Architecture and integration points |
| [API.md](./API.md) | HTTP endpoints |
| [SECURITY.md](./SECURITY.md) | Authorization and idempotency |
| [TESTING.md](./TESTING.md) | Test coverage |
| [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) | Acceptance checklist |

## Default rule

`floor(grand_total / sar_per_point) * points_per_unit`

Configuration keys (admin settings):

- `commerce.loyalty_enabled`
- `commerce.loyalty_sar_per_point`
- `commerce.loyalty_points_per_unit`

Changes apply to future accruals only.
