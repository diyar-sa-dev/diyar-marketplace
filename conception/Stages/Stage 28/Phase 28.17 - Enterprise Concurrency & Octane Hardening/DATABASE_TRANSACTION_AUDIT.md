# Database Transaction Audit — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Scope:** `lockForUpdate` usage on money-path and inventory operations

---

## Inventory & Checkout

| Service / method | Table(s) locked | Wrapped in transaction | Test | Status |
|------------------|-----------------|------------------------|------|--------|
| `InventoryService::lockInventory()` | `product_inventories` | Yes (callers) | Reservation tests | **VERIFIED** |
| `InventoryService::reserve()` | via `lockInventory()` | `DB::transaction` | `InventoryReservationTest` | **VERIFIED** |
| `InventoryService::finalize()` | reservation, product, inventory | Yes | Audit tests | **VERIFIED** |
| `InventoryService::release()` | Same | Yes | Reservation tests | **VERIFIED** |
| `OrderCreationService` | order number sequence | Yes | `OrderNumberConcurrencyTest` | **PARTIALLY VERIFIED** |

---

## Payments

| Service / method | Table(s) locked | Test | Status |
|------------------|-----------------|------|--------|
| `PaymentFinalizationService::finalizePaid()` | `payments`, `orders` | Indirect payment tests | **VERIFIED** |
| `PaymentFinalizationService::markFailed()` | payment row | Payment flow tests | **VERIFIED** |
| `PaymentWebhookEventProcessor::acquireProcessingLease()` | `payment_webhook_events` (optimistic lease) | `PaymentWebhookProcessingLeaseTest` | **VERIFIED** |

---

## Payouts

| Service / method | Table(s) locked | Test | Status |
|------------------|-----------------|------|--------|
| `PayoutService` (vendor) | `vendor_accounts`, `vendor_payouts` | Admin/finance tests (prior) | **PARTIALLY VERIFIED** |
| `ProviderPayoutService` | `provider_accounts` | Provider finance tests | **PARTIALLY VERIFIED** |
| `AffiliatePayoutService` / balance | affiliate ledger rows | Affiliate commerce tests | **PARTIALLY VERIFIED** |

---

## Coupons

| Service / method | Table(s) locked | Test | Status |
|------------------|-----------------|------|--------|
| `VendorCouponValidationService` | coupon usage count via `lockForUpdate` | `CouponConcurrencyTest` | **VERIFIED** (PHPUnit loop) |

---

## Other Notable Locks (non-checkout)

| Service | Purpose | Octane-tested | Status |
|---------|---------|---------------|--------|
| `OrderNumberService` | Unique order numbers | PHPUnit | **PARTIALLY VERIFIED** |
| `LoyaltyLedgerService` | Points ledger | Prior tests | **PARTIALLY VERIFIED** |
| `MessageService` | Chat message ordering | Chat tests | **PARTIALLY VERIFIED** |
| `ServiceEngagementService` | RFQ engagement | RFQ workflow | **PARTIALLY VERIFIED** |

---

## Patterns Observed

1. Money paths consistently use `DB::transaction` + `lockForUpdate` on authoritative rows.
2. Webhook lease uses conditional `UPDATE` (not `SELECT FOR UPDATE`) — acceptable for lease semantics.
3. No project-wide audit confirms **every** write path uses transactions — spot-check only.

---

## Gaps

1. Deadlock ordering documentation across multi-table locks — **NOT VERIFIED**
2. Parallel HTTP stress on inventory + payment in same checkout — **NOT VERIFIED**
3. Service booking payment locks — code exists, no concurrency test — **NOT VERIFIED**
4. Order cancellation refund path — stash diff unreviewed — **NOT VERIFIED**

---

## Verdict

| Area | Status |
|------|--------|
| Core money-path locks present | **VERIFIED** (code review) |
| PHPUnit coverage on key paths | **PARTIALLY VERIFIED** |
| Full transaction audit + live concurrency | **NOT VERIFIED** |

**Production Ready:** No.
