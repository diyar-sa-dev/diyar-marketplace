# ADR-005 — Financial Ledger

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-08-15 |

## Problem

Vendor balances, commissions, escrow, payouts, and refunds must be auditable and tamper-evident.

## Options

1. Mutable `balance` column on vendor_profiles
2. Append-only `financial_transactions` ledger
3. External accounting system only

## Decision

**Append-only ledger (`financial_transactions`) with derived balances**

## Reason

- Product owner requires ledger-oriented design
- Refunds, escrow release, and commission adjustments need history
- Supports admin audit and dispute resolution

## Consequences

- Every financial event creates ledger row(s)
- `available_balance` and `escrow_balance` may be cached/denormalized but reconcilable from ledger
- Commission rates via `commission_rules` table — not hard-coded 10%

## Transaction Types

sale, platform_commission, refund, payout, escrow, escrow_release, adjustment

## Escrow Flow

Payment confirmed → escrow credit → release rules → available balance → payout request → payout debit

## Open Decision

Escrow release trigger rules (OD-03 in REQUIREMENTS_BASELINE.md)
