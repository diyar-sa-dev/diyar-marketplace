# Concurrency Operation Matrix — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Legend:** VERIFIED = tested and passing · PARTIALLY VERIFIED = code guard exists, Octane/load not proven · NOT VERIFIED = no evidence · BLOCKED = cannot proceed without dependency

---

## Financial & Order Operations

| Operation | Mechanism | Test coverage | Octane/load | Status |
|-----------|-----------|---------------|-------------|--------|
| Payment initiate (idempotency key) | DB unique + service logic | `PaymentConcurrencyTest` (10× same key → 1 attempt) | Not under Swoole | **PARTIALLY VERIFIED** |
| Payment submit replay | Idempotency on attempt | `PaymentConcurrencyTest` | Not under Swoole | **PARTIALLY VERIFIED** |
| Payment finalization | `PaymentFinalizationService` → `lockForUpdate` on Payment + Order | Indirect via payment tests | Not load-tested | **PARTIALLY VERIFIED** |
| Payment webhook processing | `PaymentWebhookProcessor` → `lockForUpdate` | `PaymentWebhookSecurityTest` | Stash had `PaymentWebhookEventProcessor` diff | **PARTIALLY VERIFIED** |
| Refund idempotency | DB/service guards | `RefundIdempotencyTest` (prior phases) | Not under Swoole | **PARTIALLY VERIFIED** |
| Order number generation | Unique constraint + generator | `OrderNumberConcurrencyTest` | Not under Swoole | **PARTIALLY VERIFIED** |
| Order cancellation | `OrderCancellationService` | No dedicated concurrency test | Stash diff unreviewed | **NOT VERIFIED** |
| Coupon redemption | Atomic recording | `CouponConcurrencyTest` | Not under Swoole | **PARTIALLY VERIFIED** |
| Inventory decrement | Transaction/audit tests | `InventoryTransactionAuditTest` (28.2) | Not load-tested | **PARTIALLY VERIFIED** |
| Service booking payment | `ServiceBookingPaymentService` → `lockForUpdate` | No dedicated concurrency test | — | **NOT VERIFIED** |

---

## Auth & Session (Octane-specific)

| Operation | Mechanism | Test coverage | Status |
|-----------|-----------|---------------|--------|
| Marketplace login session | Redis session + guard | `AuthenticationTest` (non-Octane) | **PARTIALLY VERIFIED** |
| Admin/marketplace isolation | Separate guards | `AdminIsolationTest`, E2E | **VERIFIED** (non-Octane) |
| Octane worker auth bleed prevention | Planned listeners | None | **NOT VERIFIED** |
| OTP static store reset | `FlushOctaneDevState` | `SmsProviderTest` (dev) | **PARTIALLY VERIFIED** (dev only) |

---

## Platform & Infrastructure

| Operation | Mechanism | Evidence | Status |
|-----------|-----------|----------|--------|
| Rate limiting | Laravel throttle | `RateLimitingTest` | **VERIFIED** |
| Queue job dispatch | Redis queue | Integration tests (28.16) | **PARTIALLY VERIFIED** |
| Broadcast channel auth | HTTP auth endpoint | No live Reverb in loadtest | **NOT VERIFIED** (live WS) |
| Health/readiness under load | Cached probe | k6 + Docker healthcheck fix | **VERIFIED** |
| Fake gateway reset (loadtest) | `FlushOctaneDevState` | Loadtest env | **VERIFIED** (dev) |

---

## Load & Capacity (inherited measurements)

| Scenario | Target | Measured (2026-08-29, dev Docker) | Status |
|----------|--------|-----------------------------------|--------|
| Mixed workload @25 RPS | p95 <300 ms | p95 ~118 ms | **VERIFIED** |
| Mixed workload @50 RPS | Stable | ~50 RPS plateau, p95 ~825 ms | **VERIFIED** |
| 278 RPS / 1M req·hour | Platform claim | Not reproduced | **NOT VERIFIED** |
| 15-min soak | No degradation | Started, incomplete | **NOT VERIFIED** |
| Payment path under concurrent k6 | No double-charge | Not run | **NOT VERIFIED** |

---

## Priority Hardening Queue

| P | Operation | Action |
|---|-----------|--------|
| P0 | Octane auth isolation | Implement listeners + `AuthSessionIsolationTest` |
| P1 | Payment finalization under load | k6 checkout + webhook replay on Octane stack |
| P1 | Webhook event processor | Merge stash diff or re-implement; add concurrency test |
| P2 | Service booking payment locks | Add concurrency test mirroring payment suite |
| P2 | Order cancellation races | Audit + test |

---

## Summary Counts

| Status | Count (matrix rows) |
|--------|---------------------|
| VERIFIED | 6 |
| PARTIALLY VERIFIED | 14 |
| NOT VERIFIED | 9 |
| BLOCKED | 0 (see STASH_AUDIT for blocked stash apply) |

**Production Ready:** No — majority of money-path concurrency is PHPUnit-only, not Octane/load proven.
