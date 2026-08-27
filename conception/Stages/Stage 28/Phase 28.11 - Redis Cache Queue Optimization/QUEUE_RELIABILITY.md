# Queue Reliability

---

## Financial / commerce safety

### Payment webhooks (`ProcessPaymentWebhookJob`)

- **Idempotency:** `PaymentWebhookEventProcessor` returns early if `processing_status === Processed` or payment already `Paid`.
- **28.11:** Added `ShouldBeUnique` on `webhookEventId` to prevent concurrent duplicate workers.
- **Retries:** 5 attempts, backoff 10→300s.
- **Risk:** LOW — retries cannot double-charge due to status gates + finalization service.

### Notifications (`DeliverNotificationChannelJob`)

- **Unique:** Per `deliveryId`.
- **Circuit breaker:** Opens on provider failures.
- **State machine:** Delivery status transitions prevent double-send on success path.

### Loyalty / affiliate / commissions

- Processed synchronously in order/payment services with DB transactions (not queue-hot).
- Queue retries do not apply to commission calculation paths.

---

## Failure handling

| Mechanism | Status |
|-----------|--------|
| `failed_jobs` table | Laravel default |
| Dead letter / outbox replay | `DomainOutboxProcessor`, `ReplayDomainOutboxDeadLetterCommand` |
| Notification recovery | `NotificationDeliveryRecoveryService::redispatch` |
| Payment reconcile | `ReconcilePaymentsCommand` |

---

## Concurrency tests

| Test | Result |
|------|--------|
| `CacheOptimizationTest` (stampede + version) | 3/3 PASS |
| Payment webhook duplicate (existing processor tests) | Inherited from payment suite |
| Notification unique job | Covered by `ShouldBeUnique` contract |

**Live 50–100 concurrent queue dispatch:** NOT VERIFIED on this host (Redis unavailable).

---

## Recommendations (deferred)

1. Staging benchmark: notification drain rate under checkout burst (OPT-QUEUE-001).
2. Alert on `failed_jobs` growth rate.
3. Document Supervisor worker count for Hostinger (1 worker minimum per queue class).
