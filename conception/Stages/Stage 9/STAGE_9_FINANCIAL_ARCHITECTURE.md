# Stage 9 — Financial Architecture

**Status:** IMPLEMENTED, HARDENED & TESTED (Stage 9.5 — 2026-08-17)

---

## Source of Truth

The **append-only `financial_transactions` ledger** is the authoritative source for vendor balances, escrow, commissions, and payouts.

Stage 8 immutable inputs:

- `payments`
- `payment_vendor_allocations`

Stage 9 never recalculates historical obligations from mutable catalog, vendor settings, or current commission configuration.

---

## Architecture Flow

```text
Customer → MyFatoorah → DIYAR Platform (Stage 8 payment)
         → payment_vendor_allocations (immutable snapshot)
         → FinancialPostingService (Stage 9)
         → financial_transactions (ledger)
         → VendorBalanceService (derived projections)
         → EscrowReleaseService (on vendor order delivered)
         → PayoutService (vendor request → admin manual payout)
```

No MyFatoorah supplier/split payments. No mutable vendor wallet column.

---

## Ledger Design

**Model:** Append-only single-sided transactions with explicit `balance_bucket` and `direction`.

| Bucket | Purpose |
|--------|---------|
| `platform_cash` | Platform sale inflow record |
| `platform_commission` | Platform commission earned |
| `vendor_escrow` | Vendor pending/escrow balance |
| `vendor_available` | Vendor withdrawable balance |

### Transaction types

`sale`, `platform_commission`, `affiliate_commission` (reserved), `refund` (reserved), `payout`, `escrow`, `escrow_release`, `adjustment`

### Idempotency

Database unique constraint:

```text
(source_type, source_id, transaction_type, balance_bucket, direction)
```

Payment posting source: `payment_vendor_allocation`  
Escrow release source: `payment_vendor_allocation_release`  
Payout source: `vendor_payout`

---

## Stage 8 Integration

Hook: `PaymentFinalizationService::finalizePaid()` → `FinancialPostingService::postPaidPayment()`

Per allocation on paid payment:

1. **escrow** credit → `vendor_escrow` (vendor_payable_amount)
2. **platform_commission** credit → `platform_commission`
3. **sale** credit → `platform_cash` (vendor_gross_total)

Commission is snapshotted in `payment_vendor_allocations.platform_commission_amount` at **payment initiate only**.

**Stage 9.5 hardening:** `PaymentAllocationSnapshotService::snapshotForPayment()` skips existing allocations (create-only). Finalization calls `ensureSnapshotForPayment()` which never overwrites frozen snapshots. `FinancialTransaction` model rejects updates/deletes at boot.

---

## Commission

**Service:** `CommissionResolver`  
**Base:** line item subtotals (`vendor_subtotal` components)  
**Precedence per line:** Product → Category → Vendor → Global  
**V1 seeded rule:** Global 10%

Historical commission is frozen in allocation snapshot + ledger metadata.

---

## Escrow Release

**Trigger (configurable):** `DIYAR_ESCROW_RELEASE_TRIGGER=vendor_order_delivered`  
**Hook:** `VendorOrderStateService::markDelivered()` → `EscrowReleaseService`

Moves funds:

- debit `vendor_escrow`
- credit `vendor_available`

---

## Vendor Balance (Derived)

| Metric | Calculation |
|--------|-------------|
| Total revenue | Sum escrow credits |
| Pending / escrow | escrow credits − escrow debits |
| Available | available credits − available debits |
| Paid out | Sum payout debits |

**Service:** `VendorBalanceService`

---

## Payouts (V1 Manual)

```text
Vendor request → pending
Admin approve → approved
Admin mark paid → paid + ledger payout debit
```

**Minimum:** `DIYAR_PAYOUT_MINIMUM` (default 100 SAR)  
**Safety:** row locks, available balance check, one active pending payout per vendor

---

## API Endpoints

### Vendor (`/api/v1/dashboard/vendor/finance/`)

| Method | Route |
|--------|-------|
| GET | `/summary` |
| GET | `/transactions` |
| GET | `/payouts` |
| POST | `/payouts` |
| POST | `/payouts/{payout}/cancel` |

### Admin (`/api/v1/admin/`)

| Method | Route |
|--------|-------|
| GET | `/payouts` |
| POST | `/payouts/{payout}/approve` |
| POST | `/payouts/{payout}/reject` |
| POST | `/payouts/{payout}/mark-paid` |

---

## Deferred

| Item | Status |
|------|--------|
| Automated bank/payout provider | DEFERRED |
| Refund execution | DEFERRED (ledger type reserved) |
| Affiliate commission | DEFERRED |
| Admin finance dashboard UI | DEFERRED (API only) |
| Revenue chart (frontend) | DEFERRED (placeholder shown) |
| Period analytics / export (frontend) | DEFERRED |
| Vendor transactions table UI | **IMPLEMENTED** (live API) |
| Campaign commission scope | DEFERRED |

---

## Stage 10 Handoff

Stage 10 receives immutable:

- `financial_transactions`
- `vendor_payouts`
- `commission_rules` (for future rules only — not historical recalc)
- Derived balance summaries via `VendorBalanceService`
