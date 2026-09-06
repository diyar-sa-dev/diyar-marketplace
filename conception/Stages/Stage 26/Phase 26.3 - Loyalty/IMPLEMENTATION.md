# Implementation — Loyalty (26.3)

## Database

- `loyalty_accounts` — one per customer (`user_id` unique), maintained balance + aggregates
- `loyalty_transactions` — immutable ledger with unique `reference`

## Services

| Service | Role |
|---------|------|
| `LoyaltyRuleService` | Config, point calculation, reversal proportion |
| `LoyaltyEligibleAmountService` | Authoritative eligible order amount |
| `LoyaltyLedgerService` | Atomic accrue / reverse / adjust |
| `LoyaltyQueryService` | Customer summary and paginated history |

## Events

- `PaymentSucceeded` → `AccrueLoyaltyOnPaymentSucceeded`
- `ReturnUpdated` (refunded) → `ReverseLoyaltyOnRefund`

## API

Customer (auth): `/api/v1/loyalty`, `/loyalty/transactions`, `/loyalty/rewards`

Admin: `/api/v1/admin/loyalty/customers/{user}`, `POST .../adjust`

## Frontend

- `LoyaltyPage` — real balance, filters, pagination, rewards empty state
- Home `LoyaltyPromo` — authenticated balance chip
- Admin user detail — loyalty tab with adjust form
