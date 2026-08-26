# Phase 26.10 — Enterprise Payment Methods

## Status: Increment 2 complete (~8.2/10)

See [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) for evidence-based scoring.

### Done
- [x] Canonical methods: `mada`, `card`, `apple_pay`, `tabby`
- [x] Payment selection only after «تأكيد الطلب»
- [x] `PaymentOrchestrator` + `PaymentMethodResolver`
- [x] Authoritative `PaymentStateService` + audit trail
- [x] `FakePaymentGateway` with scenarios (dev/test only)
- [x] Production fail-fast if fake gateway enabled
- [x] Async webhook processing (`ProcessPaymentWebhookJob`)
- [x] Fake webhook endpoint for dev
- [x] `payments:reconcile` + expanded status coverage
- [x] Payment health in `/api/v1/health/ready`
- [x] Payment outbox events (`payment.paid`, `payment.failed`)
- [x] **55/55** payment PHPUnit tests

### Not done / NOT VERIFIED
- [ ] MyFatoorah refund API implementation
- [ ] Playwright E2E (all 4 methods)
- [ ] k6 performance baseline
- [ ] Full backend regression suite
- [ ] Mail SMTP verification for payment emails
- [ ] Admin reconcile/retry UI

## Quick verification

```bash
cd backend
php artisan migrate
php artisan test --filter=Payment
php artisan payments:reconcile
curl http://localhost:8000/api/v1/health/ready
```

## Environment (local dev)

```env
DIYAR_PAYMENT_USE_FAKE_GATEWAY=true
DIYAR_FAKE_PAYMENT_SCENARIO=success
```

**Production:** `DIYAR_PAYMENT_USE_FAKE_GATEWAY=false` — app fails fast if true.

See [AUDIT.md](./AUDIT.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [COMPLETION_REPORT.md](./COMPLETION_REPORT.md).
