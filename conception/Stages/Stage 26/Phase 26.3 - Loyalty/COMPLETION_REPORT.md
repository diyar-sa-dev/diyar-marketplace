# Completion Report — Stage 26.3 Loyalty (Final Enterprise Hardening)

**Date:** 2026-08-25  
**Base commit:** `c8bd8fa`  
**Follow-up commit:** `feat(stage-26.3): final enterprise loyalty hardening`

## Verdict

**COMPLETE WITH DEFERRED INFRASTRUCTURE**

Stage 26.3 is production-ready for earn, balance, reversal, admin adjust, and customer/admin UX within approved scope. Playwright E2E and staging p95/p99 remain infrastructure-dependent.

## Audit findings (independent re-audit)

| Area | Finding | Action |
|------|---------|--------|
| Debit adjust TOCTOU | Pre-check outside transaction; `max(0,…)` could desync ledger | **Fixed** — solvency inside `postMutation()` |
| Multi-return reversal | Could exceed earned points per order | **Fixed** — cap at remaining reversible |
| Eligible amount | Float cast on `grand_total` | **Fixed** — BCMath string normalization |
| Decimal boundaries | Partial coverage | **Fixed** — explicit 49.99–500 tests |
| Admin view permission | Untested | **Fixed** — 403 test added |
| Guest API access | Untested | **Fixed** — 401 tests added |
| Notifications | Out of scope | **Documented** — no expansion |
| True parallel concurrency | Not provable on SQLite CI | **Deferred** — sequential debit guard tested |
| Rewards catalog | Intentionally empty | **Unchanged** |

## Changes made

### Backend
- `LoyaltyLedgerService`: in-transaction debit guard; reversal cap; removed silent balance clamp
- `LoyaltyEligibleAmountService`: decimal-safe `bcadd`
- 5 new tests (31 total loyalty tests)

### Frontend
- Loyalty page: rewards error/retry; filter tab a11y; future-ready rewards list branch
- Home `LoyaltyPromo`: loading state for authenticated users

### Documentation
- Updated SECURITY, TESTING, COMPLETION_REPORT, ARCHITECTURE notes

## Test results

| Gate | Result |
|------|--------|
| Loyalty backend (31) | PASS |
| Return/refund regression (subset) | PASS |
| Pint | PASS |
| Frontend unit (5) | PASS |
| Typecheck / lint / build | PASS |
| Playwright E2E | DEFERRED |
| Full backend regression | PARTIAL |

## Deferred

- Playwright loyalty spec execution
- Staging/production p95 latency
- True multi-process concurrency proof (MySQL/PostgreSQL row locks in CI)
- Loyalty push/in-app notifications
- Reward catalog / redemption (future phase)

## Stage 26.4

**NOT STARTED.**
