# Business Rules — Loyalty (26.3)

## Eligible amount

**Source:** `order.grand_total` (same amount verified at payment finalization).

Used consistently for earn, reversal, and reporting via `LoyaltyEligibleAmountService`.

## Earning

- **When:** `PaymentSucceeded` event after successful payment finalization
- **Formula:** `floor(eligible_amount / sar_per_point) * points_per_unit`
- **Default:** 50 SAR → 1 point
- **Rounding:** floor (49 SAR → 0 points, 50 SAR → 1 point)
- **Disabled program:** no new accruals; balances and history preserved

## Idempotency

Unique ledger reference per accrual: `earn:order:{order_id}` (DB unique constraint).

Duplicate payment-success events produce zero additional points.

## Reversal

- Triggered on `ReturnUpdated` when status is `refunded`
- Creates `reversal` transaction (never deletes earn row)
- **Full refund:** reverse all earned points for the order
- **Partial refund:** `floor(earned * (refund_amount / original_eligible))`
- Balance clamped to ≥ 0

## Admin adjustment

- Requires `loyalty.adjust` permission
- Creates `adjust` ledger row with reason and admin `created_by`
- Negative adjustments blocked if balance would go below zero

## Redemption

`REDEEM` type supported in schema; no public redeem flow or fake rewards in 26.3.
