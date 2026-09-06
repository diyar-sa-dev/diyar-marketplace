# Phase 26.10 — Payment Architecture

## Target flow

```
Checkout (/checkout)
  → review address, shipping, coupons
  → «تأكيد الطلب» (POST /orders)
  → Payment page (/checkout/payment/:orderId)
  → «طريقة الدفع» (exactly 4 canonical methods)
  → POST /orders/:id/payment (initiate session)
  → POST /orders/:id/payment/submit (canonical method)
  → Provider redirect
  → Webhook (authoritative) + optional browser callback (informational)
  → Order confirmed when paid
```

## Canonical payment methods

| UI (AR) | Internal ID | MyFatoorah v3 (when mapped) |
|---------|-------------|-------------------------------|
| مدى | `mada` | `CARD` (embedded) |
| البطاقة الائتمانية | `card` | `CARD` |
| Apple Pay | `apple_pay` | `APPLE_PAY` |
| تابي | `tabby` | `TABBY` (requires merchant config) |

## Layering (increment 1)

```
PaymentController
    └── PaymentOrchestrator          ← provider-agnostic entry
            └── PaymentApplicationService
                    ├── PaymentGatewayManager → MyFatoorahGateway | LocalPaymentGateway
                    ├── PaymentMethodResolver   ← canonical ↔ gateway codes
                    └── PaymentFinalizationService (webhooks / reconcile)
```

## Idempotency

| Layer | Key |
|-------|-----|
| Order creation | `Idempotency-Key` header |
| Payment initiate | `idempotency_key` → unique on `payment_attempts` |
| Payment submit | Same attempt row; replay returns stored `gateway_payment_url` |
| Webhooks | `payload_hash` unique on `payment_webhook_events` |

## Reconciliation

`php artisan payments:reconcile --minutes=30 --batch=100`

- Finds pending/authorized payments with **submitted** attempts older than threshold
- Calls provider `getPaymentDetails`
- Finalizes paid or terminal failure via `PaymentFinalizationService`
- Scheduled every 15 minutes (increment 1)

## Files added/changed (increment 1)

### Backend
- `app/Enums/PaymentMethod.php`
- `app/Services/Payments/PaymentMethodResolver.php`
- `app/Services/Payments/PaymentOrchestrator.php`
- `app/Services/Payments/PaymentReconciliationService.php`
- `app/Console/Commands/ReconcilePaymentsCommand.php`
- `app/Services/Payments/PaymentApplicationService.php` (method validation)
- `app/Http/Requests/Payment/SubmitPaymentRequest.php` (enum validation)
- `app/Http/Controllers/Api/V1/Payment/PaymentController.php` (orchestrator)

### Frontend
- `frontend/src/pages/CheckoutPage.tsx` (removed duplicate selector)
- `frontend/src/pages/OrderPaymentPage.tsx` (canonical submit + Apple Pay detection)
- `frontend/src/lib/paymentMethods.ts` (canonical IDs)
- `frontend/src/components/checkout/CheckoutPaymentMethods.tsx`

## Next increments

1. Async webhook processing + outbox integration
2. Extended payment state machine (`unknown`, `requires_action`)
3. Refund parity + admin reconciliation UI
4. Concurrency + E2E + k6 + mail diagnostic
