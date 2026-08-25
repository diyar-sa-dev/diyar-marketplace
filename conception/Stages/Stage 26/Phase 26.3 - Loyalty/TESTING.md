# Testing — Loyalty (26.3)

## Backend

### `tests/Feature/Loyalty/LoyaltyCommerceTest.php` (10 tests)

- Rule calculation and configurable thresholds
- Accrual idempotency on duplicate `PaymentSucceeded`
- Disabled program skips accrual
- Customer summary + filtered transactions
- Customer isolation (no cross-user data)
- Admin credit/debit adjustments
- Negative balance guard
- Reversal proportion helper
- Empty rewards endpoint

### `tests/Feature/Loyalty/LoyaltyHardeningTest.php` (16 tests)

- BCMath string money (`50.00` ≡ `50`)
- 150 SAR → 3 points
- Re-enable accrual after disable
- Unpaid / failed payment → no earn
- Reversal idempotency (SQLite + MySQL/PostgreSQL codes)
- Full return reversal proportional to refund amount
- `ReturnUpdated` listener idempotency
- Immutable earn rows after reversal
- Ledger sum matches account balance
- Unauthorized admin adjust (403)
- Customer cannot hit admin adjust route
- Invalid transaction type filter (422)
- Pagination + type filtering
- Max adjustment cap validation
- Invalid zero config clamped to safe minimums

**Total backend loyalty tests: 26**

Run:

```bash
cd backend && php artisan test tests/Feature/Loyalty
```

## Frontend

`src/pages/__tests__/LoyaltyPage.test.tsx` (5 tests)

- Balance + history + rewards empty state
- Guest sign-in prompt (no API calls when unauthenticated)
- Loading skeleton
- Error + retry
- Disabled program notice

Run:

```bash
cd frontend && npm run test -- src/pages/__tests__/LoyaltyPage.test.tsx
```

## E2E

`frontend/e2e/loyalty.spec.ts` — customer/admin loyalty journeys.

**Status:** INFRASTRUCTURE-DEPENDENT (requires running stack + seeded credentials). Not executed in local hardening session.

## Integration journey

Order → payment → earn → return/refund → reversal is covered by backend feature tests using checkout/return helpers (`deliverSingleItemOrder`, `advanceReturnToRefunded`, `ReturnUpdated` listener).

## Gates (hardening session)

| Gate | Result |
|------|--------|
| Backend loyalty tests (26) | VERIFIED PASS |
| Pint | VERIFIED PASS |
| Frontend unit tests (5) | VERIFIED PASS |
| Typecheck | VERIFIED PASS |
| ESLint | VERIFIED PASS |
| Build | VERIFIED PASS |
| Playwright E2E | DEFERRED |
| Full backend regression | PARTIAL (loyalty scope only) |
| Staging p95/p99 | DEFERRED |
