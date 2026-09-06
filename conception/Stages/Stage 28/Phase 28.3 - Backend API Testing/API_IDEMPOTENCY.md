# Phase 28.3 — API Idempotency

**Date:** 2026-08-27

---

## Endpoints with idempotency requirements

| Workflow | Mechanism | Test file | Result |
|----------|-----------|-----------|--------|
| Order creation | `Idempotency-Key` header | `OrderAuthorizationTest`, `OrderCreationTest` | PASS |
| Payment initiate | `idempotency_key` body + DB unique | `PaymentConcurrencyTest` | PASS |
| Payment submit | Same key replay | `PaymentConcurrencyTest` | PASS |
| Refund | Idempotent refund requests | `RefundIdempotencyTest` | PASS |
| Coupon redemption | Concurrent redemption | `CouponConcurrencyTest` | PASS |
| Order numbers | Unique under concurrency | `OrderNumberConcurrencyTest` | PASS |

---

## Payment concurrency detail

**Test:** `PaymentConcurrencyTest`

| Scenario | Requests | Expected DB state | Result |
|----------|----------|-------------------|--------|
| 10× concurrent initiate, same key | 10 | 1 `PaymentAttempt` | PASS |
| 10× concurrent submit, same key | 10 | 1 submitted attempt | PASS |

---

## Order creation

Uses `Idempotency-Key` HTTP header on `POST /api/v1/orders` (verified in authorization tests during checkout flow).

---

## Refunds

`RefundIdempotencyTest` — duplicate refund operations do not double-credit.

---

## Loyalty / affiliate

| Domain | Idempotency tests |
|--------|-------------------|
| Loyalty | `LoyaltyHardeningTest` — earn/redeem hardening |
| Affiliate | `AffiliateCommerceTest` — commission attribution |

---

## Chat / notifications

Message send idempotency: **NOT VERIFIED** with explicit idempotency keys in Phase 28.3.

---

## MySQL 8

`PaymentConcurrencyTest`, `RefundIdempotencyTest` included in 41-test MySQL 8 subset — **PASS**.

---

## Idempotency gate

```text
PASS
```

Critical financial flows (orders, payments, refunds, coupons) have automated idempotency/concurrency tests.

---

## Gaps

| Gap | ID |
|-----|-----|
| Booking double-submit idempotency | KI-028-035 — NOT VERIFIED |
| Chat message duplicate send | KI-028-036 — NOT VERIFIED |
