# Race Condition Audit — Phase 28.17

**Date:** 2026-09-03  
**Scope:** Critical write paths — commerce, payments, services, financial  
**Method:** Code review of `lockForUpdate`, transactions, unique constraints, tests

---

## Locking Strategy Summary

| Tool | When used | Authority |
|------|-----------|-----------|
| `DB::transaction()` | Atomic multi-step mutations | Database |
| `lockForUpdate()` | Competing rows (inventory, balances, payments) | Database |
| Unique constraints | Order numbers, idempotency keys, webhook hashes | Database |
| Redis `Cache::lock()` | Expensive cache rebuild (catalog) | Coordination only |
| Redis distributed lock | Not used on money paths | — |
| Processing lease (conditional UPDATE) | Webhook event serialization | Database |

**Rule:** Database is the final authority for financial and inventory correctness.

---

## Commerce

### Inventory & checkout

| Path | Pattern | Test | Status |
|------|---------|------|--------|
| `InventoryService::reserve()` | `DB::transaction` + `ProductInventory::lockForUpdate()` | Reservation tests | **VERIFIED** |
| `InventoryService::finalize()` | Multi-row locks | Audit tests | **VERIFIED** |
| `InventoryService::release()` | Multi-row locks | Reservation tests | **VERIFIED** |
| Parallel last-unit reserve | 6 PHP worker processes | `CheckoutInventoryConcurrencyTest` | **VERIFIED** (DB-level parallel) |
| Parallel HTTP checkout (Octane) | Same lock path via API | — | **NOT VERIFIED** |
| Expired reservation vs new reserve | Scheduled release command | — | **NOT VERIFIED** |

### Cart

| Path | Pattern | Status |
|------|---------|--------|
| `CartService` mutations | `lockForUpdate` on cart rows | **VERIFIED** (code) |
| Guest/user cart merge | Transaction + locks | **PARTIALLY VERIFIED** |

### Coupons

| Path | Pattern | Test | Status |
|------|---------|------|--------|
| `VendorCouponValidationService` | `lockForUpdate` on coupon | `CouponConcurrencyTest` | **VERIFIED** |

### Order numbers

| Path | Pattern | Test | Status |
|------|---------|------|--------|
| `OrderNumberService` | Sequence row `lockForUpdate` + unique constraint | `OrderNumberConcurrencyTest` | **VERIFIED** |

---

## Payments

| Path | Pattern | Test | Status |
|------|---------|------|--------|
| `PaymentApplicationService::submit()` | Row locks + idempotency key | `PaymentConcurrencyTest` | **VERIFIED** |
| `PaymentFinalizationService::finalizePaid()` | `payments` + `orders` locks | `PaymentFinalizationRaceTest` | **VERIFIED** |
| `PaymentFinalizationService::markFailed()` | Transaction + `lockForUpdate` | `PaymentFinalizationRaceTest` | **VERIFIED** |
| Webhook ingest | Unique `payload_hash` | Webhook tests | **VERIFIED** |
| Webhook processing | Lease + job uniqueness | Lease + job tests | **VERIFIED** |

### Payment lifecycle (correct regardless of order)

```text
Create → Redirect → Callback → Webhook → Retry → Duplicate webhook
                              ↓
                    DB status machine + locks = single terminal state
```

---

## Services (RFQ / bookings)

| Path | Pattern | Test | Status |
|------|---------|------|--------|
| `ServiceEngagementService` | Row locks | RFQ workflow tests | **PARTIALLY VERIFIED** |
| `ServiceBookingPaymentService` | Payment row locks | — | **NOT VERIFIED** (concurrency) |
| Offer accept / booking complete | Status transitions in services | RFQ tests | **PARTIALLY VERIFIED** |

---

## Financial

| Path | Pattern | Test | Status |
|------|---------|------|--------|
| `PayoutService` (vendor) | Account + payout locks | Admin finance tests | **PARTIALLY VERIFIED** |
| `ProviderPayoutService` | Provider account lock | Provider finance | **PARTIALLY VERIFIED** |
| `AffiliatePayoutService` | Ledger locks | Affiliate commerce | **PARTIALLY VERIFIED** |
| `LoyaltyLedgerService` | Ledger lock | Prior tests | **PARTIALLY VERIFIED** |

---

## Returns & refunds

| Path | Pattern | Status |
|------|---------|--------|
| `ReturnReferenceService` | Reference generation locks | **PARTIALLY VERIFIED** |
| Order cancel + refund race | — | **NOT VERIFIED** |

---

## Anti-patterns searched

| Pattern | Found in money paths? |
|---------|----------------------|
| `if ($stock > 0) { update }` without lock | **No** on inventory reserve path |
| `DB::beginTransaction()` without try/catch rollback | **No** in `app/` |
| Redis lock as sole money guard | **No** |

---

## API Idempotency

| Endpoint area | Mechanism | Status |
|---------------|-----------|--------|
| Payment submit | Idempotency key header | **VERIFIED** |
| Checkout create order | Inventory lock (not full HTTP idempotency key) | **PARTIALLY VERIFIED** |
| Webhook ingest | Payload hash uniqueness | **VERIFIED** |
| Payout create | Status + locks | **PARTIALLY VERIFIED** |

---

## Residual Risks (P1/P2)

| ID | Risk | Severity |
|----|------|----------|
| RC-1 | Parallel HTTP checkout on Octane not runtime-proven | P1 |
| RC-2 | Service booking payment concurrent finalize | P1 |
| RC-3 | Order cancellation vs active payment | P1 |
| RC-4 | Expired inventory release racing checkout | P2 |
| RC-5 | Multi-node checkout without sticky sessions | P1 |

---

## Verdict

| Area | Status |
|------|--------|
| Core inventory + payment locks | **VERIFIED** (code + PHPUnit) |
| Parallel DB reserve (last unit) | **VERIFIED** |
| Parallel HTTP / multi-node | **NOT VERIFIED** |
| Full financial path concurrency | **PARTIALLY VERIFIED** |

See also: [CHECKOUT_RACE_CONDITION_AUDIT.md](./CHECKOUT_RACE_CONDITION_AUDIT.md), [DATABASE_TRANSACTION_AUDIT.md](./DATABASE_TRANSACTION_AUDIT.md), [PAYMENT_IDEMPOTENCY_AUDIT.md](./PAYMENT_IDEMPOTENCY_AUDIT.md).

**Production Ready:** No.
