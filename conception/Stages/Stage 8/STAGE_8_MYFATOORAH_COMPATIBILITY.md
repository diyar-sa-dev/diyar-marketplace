# Stage 8 — MyFatoorah Compatibility Audit

**Final audit:** 2026-08-17

---

## Installed Versions (composer.lock verified)

| Component | Version |
|-----------|---------|
| Laravel | v13.25.0 |
| PHP | 8.3+ |
| myfatoorah/laravel-package | **2.2.4** |
| myfatoorah/library | **2.2.10** |

Package auto-discovery **disabled** for `myfatoorah/laravel-package`. No `/myfatoorah/*` demo routes.

---

## API Version Usage

| Operation | API | Class | Status |
|-----------|-----|-------|--------|
| Sessions | V3 | `MyFatoorahSessions::createSession()` | IMPLEMENTED |
| Payment creation | V3 | `MyFatoorahPayments::createPayment()` | IMPLEMENTED |
| Payment details | V3 | `MyFatoorahPayments::getPaymentDetails()` | IMPLEMENTED |
| Method discovery | V2 | `MyFatoorahPaymentEmbedded::getCheckoutGateways()` | REQUIRED — no V3 equivalent in library 2.2.10 |
| Webhook verify | V1/V2 | `MyFatoorahWebhookVerifier` | IMPLEMENTED |

V2 method discovery maps to DIYAR `PaymentMethodCapability` before API exposure. Raw SDK structures are not sent to React.

---

## Platform-Centered Model (Critical)

```text
Customer → MyFatoorah (single charge) → DIYAR Platform
         → payment_vendor_allocations
         → Stage 9 settlement
```

**MyFatoorah supplier/split payments: NOT USED**

- `PaymentRequestBuilder` → `suppliers: []`
- `MyFatoorahPaymentMapper` only adds `Suppliers` key when array non-empty
- `MyFatoorahSupplierMapper` unused in payment flow

---

## Configuration

```env
DIYAR_PAYMENT_GATEWAY=myfatoorah
DIYAR_PAYMENT_CURRENCY=SAR
MYFATOORAH_API_KEY=           # required for sandbox E2E
MYFATOORAH_TEST_MODE=true
MYFATOORAH_COUNTRY_ISO=SAU
MYFATOORAH_WEBHOOK_SECRET_KEY=  # required for live webhooks
MYFATOORAH_SAVE_CARD=false
MYFATOORAH_REGISTER_APPLE_PAY=false
```

Secrets must never appear in code, logs, API responses, or documentation.

---

## Capability Matrix

| Capability | Status |
|------------|--------|
| V3 sessions/payments/details | TESTED (automated + code audit) |
| Webhook signature v1/v2 | TESTED |
| Webhook deduplication | TESTED |
| Platform-centered (no split) | TESTED |
| Multi-vendor allocation snapshot | TESTED |
| Amount/currency verification | TESTED |
| Sandbox live E2E | **BLOCKED** — API key empty in local `.env` |
| Supplier split | **DEFERRED** — not required for platform model |
| Save card | **DEFERRED** — disabled |
| Apple Pay | **DEFERRED** — disabled |
| Financial ledger | **DEFERRED** — Stage 9 |

---

## Production Checklist

1. Set sandbox then production API keys and webhook secret
2. Register webhook: `{APP_URL}/api/v1/webhooks/payments/myfatoorah`
3. Set `MYFATOORAH_TEST_MODE=false` for production
4. Complete one sandbox E2E with server-side verification before go-live
5. Do not enable save-card or Apple Pay without merchant/compliance readiness

---

## Sandbox Probe

```bash
cd backend && php tests/Scripts/myfatoorah_sandbox_probe.php
```

Current local result: **BLOCKED — MYFATOORAH_API_KEY is not configured**
