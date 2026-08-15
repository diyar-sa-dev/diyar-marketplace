# Return Rules

> **Status:** Baseline — Stage 0

## Policy Hierarchy

Platform default → Vendor override → Product override (most specific wins)

## Customer Flow

1. Customer submits return request with reason + optional evidence
2. Admin/vendor review
3. If approved: customer ships item back
4. On received: refund processed

## Status Flow

`requested` → `under_review` → `approved`|`rejected` → `received` → `refunded` → `closed`

## Financial Impact

On refund approval:
- Create ledger `refund` entry
- Update payment status (partial or full)
- Reverse commission proportionally
- Restore inventory if applicable

## Eligibility

- Within return window (configurable per policy)
- Order item must be delivered
- Product not excluded from returns
