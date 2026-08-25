# Security — Loyalty (26.3)

- Customer endpoints scoped to authenticated user only (no cross-account IDOR)
- Admin endpoints require `loyalty.view` / `loyalty.adjust`
- Points calculated server-side; client never sends balance or earned amounts
- Ledger references enforce idempotency at DB level
- Balance mutations use row locks + DB transactions
- Negative balance prevented on adjustments (reversals clamp to zero)
