# Completion Report — Stage 26.3 Loyalty (Hardening)

**Date:** 2026-08-25  
**Commit target:** `feat(stage-26.3): harden loyalty rewards and points`

## Summary

Hardening pass on the loyalty ledger introduced in `def5c74`. Focus: money precision, idempotency under SQLite, expanded tests, admin UX confirmation, API validation, and documentation.

## Bugs found & fixed

| Issue | Fix |
|-------|-----|
| `LoyaltyRuleService` used float math | BCMath on normalized decimal strings |
| SQLite unique violations not treated as idempotent | Extended `isUniqueReferenceViolation()` for SQLite (`19`, SQLSTATE `23000`) |
| Admin adjust had no max cap | `diyar.loyalty.max_adjustment_points` + validation in controller/ledger |
| Customer API accepted arbitrary `type` filter | Validated against enum + `all` |
| Admin adjust had no confirmation | SweetAlert confirm dialog with debit balance preview |

## Acceptance matrix

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Configurable 50 SAR → 1 point | VERIFIED | `LoyaltyCommerceTest` + `LoyaltyHardeningTest` |
| Accrual only after successful payment | VERIFIED | Unpaid + failed payment tests |
| Accrual idempotent | VERIFIED | Duplicate `PaymentSucceeded` test |
| Refund reversal proportional | VERIFIED | Rule helper + return integration tests |
| Reversal idempotent | VERIFIED | Duplicate reversal + listener tests |
| Immutable ledger | VERIFIED | Earn row preserved after reversal |
| Balance consistent with ledger | VERIFIED | Sum(points) == balance test |
| Admin adjust secure | VERIFIED | Permission + max cap + reason required |
| Customer cannot manipulate loyalty | VERIFIED | Admin route unauthorized for customer |
| Enable/disable behavior | VERIFIED | Disabled accrual + re-enable tests |
| Customer UI production-ready | VERIFIED | Unit tests + existing page polish |
| Admin loyalty UI | VERIFIED | Confirm dialog + existing panel |
| Pagination / filtering | VERIFIED | Backend + frontend hooks |
| DB indexes | VERIFIED | Migration unchanged, documented in PERFORMANCE.md |
| Backend tests | VERIFIED | 26 passing |
| Frontend tests | VERIFIED | 5 passing |
| Lint / typecheck / build / Pint | VERIFIED | Local run |
| Playwright E2E | DEFERRED | Env-dependent |
| Staging p95/p99 | DEFERRED | Not measured |
| Rewards catalog | DEFERRED | Intentionally empty |
| Stage 26.4 not started | VERIFIED | No 26.4 code touched |

## Known limitations

- Reward redemption products remain deferred (empty state only).
- Playwright loyalty spec not executed locally.
- Full platform regression suite not re-run (loyalty scope verified).
- Staging latency benchmarks not collected.

## Stage 26.3 status

**COMPLETE** for defined scope, with E2E/staging performance marked DEFERRED/INFRASTRUCTURE-DEPENDENT.

## Next phase (not started)

26.4 — Advanced Shipping (per PLAN.md)
