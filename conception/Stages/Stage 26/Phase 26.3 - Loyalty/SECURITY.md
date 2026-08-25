# Security — Loyalty (26.3)

## Authorization

| Actor | Customer API | Admin view | Admin adjust |
|-------|--------------|------------|--------------|
| Guest | 401 | 401 | 401 |
| Customer | Own account only | 403 | 403 |
| Vendor / Provider | Own account only (if customer role) | 403 | 403 |
| Admin without permission | N/A | 403 (`loyalty.view`) | 403 (`loyalty.adjust`) |
| Admin with permission | N/A | Allowed | Allowed |

Customer endpoints never accept a user/account ID in the URL — scoped to `$request->user()` only.

## Input validation

- Transaction `type` filter: enum + `all` only
- `page` ≥ 1, `per_page` 1–50
- Admin adjust: positive integer points, direction `credit|debit`, reason 3–500 chars, max points cap

## IDOR

No cross-customer loyalty reads or writes. Tested in `LoyaltyCommerceTest` and `LoyaltyHardeningTest`.

## Integrity controls

- Points calculated server-side only
- Ledger `reference` unique constraint (MySQL / PostgreSQL / SQLite)
- `lockForUpdate()` + DB transaction on every mutation
- Debit solvency checked **inside** the transaction (prevents TOCTOU on concurrent debits)
- Cumulative reversal capped at remaining earned points per order
- No silent `max(0, balance)` clamp on debits — insufficient balance throws

## Audit trail

Each adjustment records:

- Immutable ledger row (`type=adjust`)
- `created_by` (admin user ID)
- `reason` (required)
- `balance_after`
- Unique reference per adjustment (intentionally non-idempotent for double-submit detection)

## Notifications

Loyalty events do **not** emit customer notifications in Stage 26.3 scope. Documented deferral — avoids synchronous latency and scope creep.

## Logging

Listeners log accrual/reversal failures at error level with order/return IDs. No PII beyond operational identifiers.

## Stage 26.4

**NOT STARTED.**
