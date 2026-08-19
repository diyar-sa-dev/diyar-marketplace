# Phase 13.7 — Provider Finance & Dashboard

> **Status:** **COMPLETE**  
> **Scope:** Provider finance summary, analytics, transactions, payouts, dashboard overview.

---

## Problem solved

Providers need visibility into service earnings, transaction history, and withdrawal requests — mirroring vendor finance patterns but scoped to the service marketplace domain.

---

## Backend

| Component | Path |
|-----------|------|
| Controller | `ProviderFinanceController` |
| Services | `ProviderFinanceService`, `ProviderPayoutService`, `ProviderFinanceTransactionService` |
| Models | `ProviderPayout`, `ProviderBankAccount` |
| Migration | `2026_08_19_080000_create_provider_finance_extensions.php` |

### API (`/dashboard/provider/finance/*`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/finance/summary` | Available balance, earnings aggregates |
| GET | `/finance/analytics` | Chart series by period |
| GET | `/finance/transactions` | Paginated ledger |
| GET | `/finance/export` | CSV/report export |
| POST | `/finance/payouts` | Request withdrawal |

---

## Frontend

| Route | Page |
|-------|------|
| `/dashboard/service` | `ServiceDashboard.tsx` — overview widgets |
| `/dashboard/service/finance` | `ServiceFinance.tsx` — full finance UI |

**Hooks:** `useProviderFinance*` in `hooks/provider/useProviderDashboard.ts`  
**API:** `providerDashboard.ts` finance endpoints

---

## Business rules

- All queries scoped to authenticated provider's `provider_account_id`
- Payout requires configured bank account
- Minimum payout from `config('diyar.finance.payout_minimum')`
- Admin payout approval uses existing `AdminPayoutController` (vendor); provider payout admin flow shares pattern

---

## Authorization

- Middleware: `role:provider,admin`
- No cross-provider transaction visibility

---

## Tests

`ProviderDashboardExtrasTest::provider_can_manage_settings_services_and_finance` — finance summary + payout request flow.

---

## Outside this phase

- Production payment gateway reconciliation (13.5)
- Admin global finance dashboard (Future Admin)
- Provider team role splits for finance view

---

## Deferred

- Real-time balance notifications
- Multi-currency support beyond configured currency
