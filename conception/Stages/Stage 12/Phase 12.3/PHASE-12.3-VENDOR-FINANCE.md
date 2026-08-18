# Phase 12.3 — Vendor Finance

> **Scope:** Balance, period reports, daily/weekly/monthly analytics, transactions, payout requests, bank-account requirement.

---

## UI

**Route:** `/dashboard/vendor/finance`  
**Page:** `frontend/src/pages/dashboard/VendorFinance.tsx`  
**API client:** `frontend/src/api/vendorFinance.ts`  
**Hooks:** `useVendorFinanceSummary`, `useVendorFinanceAnalytics`, `useVendorPayouts`, `useRequestPayout`, etc. in `hooks/vendor/useVendorFinance.ts`

---

## API endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard/vendor/finance/summary?period=` | Period report + balance snapshot |
| GET | `/dashboard/vendor/finance/analytics?period=` | Chart points (day/week/month) |
| GET | `/dashboard/vendor/finance/report?period=` | Export-oriented report payload |
| GET | `/dashboard/vendor/finance/transactions` | Paginated ledger movements |
| GET | `/dashboard/vendor/finance/payouts` | Vendor payout history |
| POST | `/dashboard/vendor/finance/payouts` | Request withdrawal |
| POST | `/dashboard/vendor/finance/payouts/{payout}/cancel` | Cancel pending payout |

**Controller:** `VendorFinanceController`  
**Services:** `VendorBalanceService`, `VendorFinanceReportingService`, `VendorFinancePeriodResolver`, `PayoutService`, `FinancialPostingService`

---

## Balance model

| Bucket | Meaning |
|--------|---------|
| Available | Withdrawable after escrow release rules |
| Pending escrow | Held until delivery/settlement rules satisfied |
| Gross sales (period) | Vendor-attributed sales in selected finance period |

Currency defaults to `config('diyar.finance.currency')` (SAR).

---

## Finance periods

`FinancePeriod` enum: **Day**, **Week**, **Month**

`VendorFinancePeriodResolver` maps period to date boundaries for reporting and dashboard chart labels.

---

## Withdrawal / payout flow

`PayoutService::request()` enforces:

1. Amount ≥ `config('diyar.finance.payout_minimum')` (default 100 SAR)
2. Active bank account must exist on vendor (`VendorBankAccount` where `is_active = true`)
3. Available balance sufficient (BCMath comparison)
4. No other payout in `pending|approved|processing` state
5. Row lock on `vendor_accounts` inside DB transaction

**Bank account display:** IBAN masked in API resources; full IBAN only editable in settings.

**Payout schedule:** Exposed on settings resource as informational `payout_schedule` (platform policy).

---

## Single-account operational model

- Settings PUT `/bank-account` upserts the **active** account
- Historical bank rows can exist in schema; UI and payout flow operate on one active account
- Architecture supports multiple accounts later without API breaking changes

---

## Security / authorization

- All finance routes behind `role:vendor,admin`
- Reports scoped to authenticated user's `vendorAccount`
- `VendorFinanceApiTest` verifies vendor A cannot see vendor B balances
- Payout creation uses transactional locking to prevent double-withdrawal races

---

## Admin payout processing

Admin routes (Stage 9 finance):

- `POST /admin/payouts/{payout}/approve|reject|mark-paid`

Vendor portal displays status progression; vendor can cancel while pending.

---

## Tests

| Test file | Protects |
|-----------|----------|
| `VendorFinanceApiTest.php` | Summary scoping, period filters, payout request rules |
| `FinancialLedgerTest.php` | Ledger posting integrity |
| `FinancialStage95AuditTest.php` | End-to-end finance stage audit |

---

## Deferred

- Multiple simultaneous payout destinations in UI
- Live bank verification / IBAN name matching API
- Automated scheduled payout runs (manual admin mark-paid today)
