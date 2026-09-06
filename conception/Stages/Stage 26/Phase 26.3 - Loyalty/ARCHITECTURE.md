# Stage 26.3 — Loyalty Architecture

## Overview

Loyalty is implemented as an immutable ledger with a maintained account read model. All point mutations flow through `LoyaltyLedgerService`; controllers and listeners remain thin.

## Layers

```
PaymentSucceeded / ReturnUpdated (Refunded)
        │
        ▼
   Event listeners (sync)
        │
        ▼
 LoyaltyLedgerService ──► LoyaltyRuleService (config + BCMath)
        │                  LoyaltyEligibleAmountService (order totals)
        ▼
 loyalty_accounts + loyalty_transactions (DB transaction + row lock)
        │
        ▼
 LoyaltyQueryService ──► Customer / Admin APIs
```

## Services

| Service | Responsibility |
|---------|----------------|
| `LoyaltyRuleService` | Enabled flag, SAR/point config, BCMath point calculation and proportional reversal math |
| `LoyaltyEligibleAmountService` | Resolves eligible order amount (`grand_total`) for accrual/reversal |
| `LoyaltyLedgerService` | Atomic mutations, idempotency via unique `reference`, row-level account locking |
| `LoyaltyQueryService` | Summary + paginated transaction reads |

## Idempotency references

| Operation | Reference |
|-----------|-----------|
| Earn | `earn:order:{orderId}` |
| Reversal | `reversal:return:{returnRequestId}` |
| Adjust | `adjust:{timestamp}:{userId}:{random}` |

Duplicate references are caught at the database layer (MySQL `1062`, PostgreSQL `23505`, SQLite `19` / SQLSTATE `23000`) and resolved by returning the existing transaction.

Debit solvency is validated **inside** the transaction after `lockForUpdate()`. Reversals are capped at `earn.points − sum(prior reversals for order)`.

## Concurrency

- `loyalty_accounts` row is locked with `lockForUpdate()` before balance mutation.
- Ledger insert + balance update occur in a single DB transaction.
- Idempotency does not rely on pre-check queries alone.

## Events

Listeners are registered synchronously in `LoyaltyServiceProvider`:

- `PaymentSucceeded` → `AccrueLoyaltyOnPaymentSucceeded`
- `ReturnUpdated` (status `Refunded`) → `ReverseLoyaltyOnRefund`

Correctness does not depend on a queue worker.

## Configuration

Runtime settings (admin-configurable):

- `commerce.loyalty_enabled`
- `commerce.loyalty_sar_per_point`
- `commerce.loyalty_points_per_unit`

Operational cap:

- `diyar.loyalty.max_adjustment_points` (default 100,000)

## Deferred by design

- Reward catalog / redemption checkout (empty customer rewards state only)
- Stage 26.4+ domains
