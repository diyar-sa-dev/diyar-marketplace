# Payment Idempotency Audit — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Scope:** Payment initiate/submit idempotency, finalization locks, webhook replay

---

## Initiate & Submit Idempotency

| Mechanism | Location | Status |
|-----------|----------|--------|
| Idempotency key on `PaymentAttempt` | DB unique + service logic | **VERIFIED** |
| 10× concurrent initiate (same key) → 1 attempt | `PaymentConcurrencyTest` | **VERIFIED** (PHPUnit sequential loop) |
| 10× concurrent submit replay → 1 submitted attempt | `PaymentConcurrencyTest` | **VERIFIED** (PHPUnit) |

Tests use sequential `$this->postJson` loops in one PHPUnit process — not true parallel HTTP.

---

## Payment Finalization

| Mechanism | Location | Status |
|-----------|----------|--------|
| Row lock on Payment + Order | `PaymentFinalizationService::finalizePaid()` — `lockForUpdate()` | **VERIFIED** |
| Double finalization guard | Status check inside transaction | **VERIFIED** (code) |
| Inventory finalize on paid | Delegates to `InventoryService::finalize()` | **VERIFIED** (code) |
| Concurrent finalization under load | No k6/Octane test | **NOT VERIFIED** |

---

## Webhook Processing

| Mechanism | Location | Status |
|-----------|----------|--------|
| `PaymentWebhookEvent` model | Persists inbound events | **VERIFIED** |
| Processing lease | `PaymentWebhookEventProcessor::acquireProcessingLease()` — `processing_leased_until` + attempt counter | **VERIFIED** |
| Lease config | `diyar.payments.webhook_processing_lease_seconds` (default 120) | **VERIFIED** |
| Duplicate lease rejection | `PaymentWebhookProcessingLeaseTest` (2 tests) | **VERIFIED** |
| Webhook security (signature, dedup) | `PaymentWebhookSecurityTest` | **VERIFIED** (prior) |
| Concurrent webhook delivery on Octane | Not load-tested | **NOT VERIFIED** |

Lease acquisition (atomic update):

```php
PaymentWebhookEvent::query()
    ->whereKey($eventId)
    ->where(fn ($q) => $q->whereNull('processing_leased_until')
        ->orWhere('processing_leased_until', '<', now()))
    ->update(['processing_leased_until' => now()->addSeconds($leaseSeconds), ...]);
```

---

## Stash vs Working Tree

| Item | Stash | HEAD (2026-09-03) | Status |
|------|-------|-------------------|--------|
| `PaymentFinalizationService` lockForUpdate | Yes | Yes | **VERIFIED** |
| `PaymentWebhookEventProcessor` lease | Partial in stash | Implemented + tested | **VERIFIED** |
| `PaymentApplicationService` initiate guards | Stash diff | Compare manually | **PARTIALLY VERIFIED** |

---

## PHPUnit Evidence

```
PaymentConcurrencyTest — pass (initiate + submit idempotency)
PaymentWebhookProcessingLeaseTest — 2/2 pass
Included in 10/10 concurrency filter — _raw/concurrency-tests-2026-09-03.txt
```

---

## Gaps

1. True parallel HTTP payment initiate/submit (not sequential loop) — **NOT VERIFIED**
2. k6 payment path on Octane stack — **NOT VERIFIED**
3. Service booking payment locks — no dedicated concurrency test — **NOT VERIFIED**
4. Refund idempotency under concurrent requests on Octane — **PARTIALLY VERIFIED** (prior phases, non-Octane)

---

## Verdict

| Area | Status |
|------|--------|
| Code guards (locks, lease, idempotency keys) | **VERIFIED** |
| PHPUnit regression suite | **VERIFIED** |
| Octane / parallel HTTP money-path proof | **NOT VERIFIED** |

**Production Ready:** No.
