# Stage 17.6 — Affiliate Dashboard Finalization Report

**Date:** 2026-08-20  
**Status:** Commerce + dashboard production-ready; admin payout UI deferred to future Admin stage.

## QA Certification Alignment

| Area | QA verdict | Current status |
|------|------------|----------------|
| Affiliate Dashboard | READY | Real KPIs, chart, top links, current-month default |
| Affiliate attribution | READY | Click → cache/DB → checkout snapshot |
| Vendor product affiliate config | READY | PATCH settings preserved |
| Checkout/order integration | READY | Multi-vendor per-line attribution verified |
| Basic commission lifecycle | READY | Pending → available → reversed |
| Financial accounting | NEEDS LEDGER → **DONE** | `financial_transactions` posts pending / release / reversal / payout debit |
| Payout processing | NEEDS ADMIN LIFECYCLE → **BACKEND DONE** | Admin API hooks; UI deferred |
| Abuse protection | NEEDS DEDUPE/RATE LIMIT → **DONE** | Cache + DB dedupe; named rate limiters |
| High-scale certification | NOT YET | Load/soak testing deferred |

## Hardening Pass (2026-08-20)

### Financial ledger
- `BalanceBucket::AffiliatePayable`, `AffiliateAvailable`
- `FinancialPostingService`: pending credit, release debit/credit, reversal debit, payout debit
- Wired into `AffiliateCommissionService` lifecycle (idempotent)

### Abuse protection
- Click dedupe: Redis/file cache key `diyar:affiliate:click-dedupe:{ref}:{fingerprint}` + DB window check
- Named limiters: `affiliate-click`, `affiliate-resolve`, `affiliate-link` (config-driven at request time)
- Config: `DIYAR_AFFILIATE_CLICK_DEDUPE_MINUTES`, `DIYAR_AFFILIATE_RESOLVE_RATE_LIMIT`

### Admin payout lifecycle (backend only — no Admin UI)
Routes under `/api/v1/admin/affiliate/payouts`:

| Method | Path | Transition |
|--------|------|------------|
| GET | `/` | List payouts |
| POST | `/{payout}/approve` | pending → approved |
| POST | `/{payout}/processing` | approved → processing |
| POST | `/{payout}/reject` | → rejected (releases reserved commissions) |
| POST | `/{payout}/mark-paid` | → paid + ledger debit + commissions → paid |

Fields: `processed_by`, `processed_at`, `rejection_reason`, `payment_reference`

### Analytics integrity
- Removed link `conversion_count` / `total_earnings` decrement on reversal
- Link API now exposes `gross_*` / `reversed_*` / `net_*` computed from `affiliate_commissions`
- Legacy `conversion_count` / `total_earnings` aliases map to net values for frontend compat

### Attribution lifecycle
- Disabled product affiliate program blocks **new** clicks (`product_not_enabled`)
- Existing session attributions remain valid for checkout

## Tests

```bash
cd backend && php artisan test --filter=Affiliate
```

Result: **12 passed** (AffiliateCommerceTest)

Coverage includes: dedupe, resolve throttle, ledger posting, admin payout lifecycle, disabled affiliate guard, multi-vendor order commission per line.

## Remaining Work (Future Scope)

| Item | Notes |
|------|-------|
| Admin affiliate payout UI | Backend hooks ready; wire in future Admin/Management stage |
| Expanded affiliate notifications | Reversed, payout approved/rejected/paid, profile suspended |
| `unique_visitors` metric | Removed fake metric; do not re-add without tracking model |
| High-scale / load certification | Deferred |
| Checkout explicit resolve on cart page | Session header works; optional enhancement |

## Acceptance Checklist

- [x] Dashboard KPIs from real aggregation (current month default)
- [x] Chart from backend monthly series (5 months)
- [x] Top links from backend sorted aggregation
- [x] Products with real images, commission, search, pagination
- [x] Links table paginated with real metrics (gross/net)
- [x] Reports with summary + period filters
- [x] Payouts with balance, minimum, pagination, server validation
- [x] Settings wired to backend
- [x] Vendor product affiliate settings preserved
- [x] Commission snapshots immutable at order time
- [x] Financial ledger posts affiliate commission pending / release / reversal / payout
- [x] Click dedupe enforced (cache + DB)
- [x] Resolve endpoint rate limited
- [x] Multi-vendor order commission per eligible line
- [x] Disabled affiliate program blocks new attribution only
- [x] Admin payout backend lifecycle (approve / reject / mark-paid)
- [x] Existing design preserved
- [ ] Admin payout UI (deferred to Admin stage)
