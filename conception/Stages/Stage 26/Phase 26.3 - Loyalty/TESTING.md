# Testing — Loyalty (26.3)

## Backend

`tests/Feature/Loyalty/LoyaltyCommerceTest.php`

- Rule calculation and config changes
- Accrual idempotency
- Disabled program
- Customer API
- Admin adjust + negative balance guard
- Reversal proportion helper
- Empty rewards endpoint

## Frontend

`src/pages/LoyaltyPage.test.tsx` — balance and history rendering

## E2E

`frontend/e2e/loyalty.spec.ts` — customer loyalty page journey (when env available)
