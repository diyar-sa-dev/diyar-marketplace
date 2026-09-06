# Phase 26.10 — Payment Infrastructure Audit

**Date:** 2026-08-26  
**Scope:** Enterprise payment methods & checkout orchestration (increment 1)

## Executive summary

DIYAR already has a **production-oriented payment foundation** (MyFatoorah gateway, payment attempts, idempotency, webhooks, vendor allocations). Phase 26.10 increment 1 removes the duplicate checkout payment selector, introduces **canonical payment method IDs**, and adds orchestration/reconciliation scaffolding without breaking the existing MyFatoorah flow.

## Backend — existing assets

| Area | Status | Notes |
|------|--------|-------|
| `PaymentGatewayInterface` | ✅ Strong | Contract for session, create, details, refund |
| `MyFatoorahGateway` | ✅ Production | Session + payment creation + webhook verification |
| `PaymentApplicationService` | ✅ Strong | Initiate/submit with idempotency on attempts |
| `PaymentAttempt` model | ✅ Strong | `idempotency_key`, gateway refs, metadata |
| `PaymentWebhookProcessor` | ⚠️ Partial | Signature verify + idempotent persist; **sync processing** |
| `PaymentFinalizationService` | ✅ Strong | Atomic paid/failed transitions, inventory, finance |
| `PaymentStatus` enum | ⚠️ Partial | Missing `processing`, `requires_action`, `unknown` |
| Refunds | ⚠️ Gap | MyFatoorah refund path **not fully implemented** |
| Reconciliation | 🆕 Added | `payments:reconcile` command (increment 1 skeleton) |
| Circuit breaker | ❌ Missing | Not provider-scoped for payments |
| Async webhook queue | ❌ Missing | Heavy logic still in HTTP request |

## Backend — gaps (remaining work)

1. **Payment state machine** — extend beyond pending/paid/failed for `unknown` / `requires_action`
2. **Webhook queue** — return 2xx quickly, process via job + outbox
3. **MyFatoorah refunds** — implement + idempotent refund attempts
4. **Tabby production** — `TABBY` mapper added; **merchant activation NOT VERIFIED**
5. **Apple Pay** — depends on `MYFATOORAH_REGISTER_APPLE_PAY` + domain verification
6. **Concurrency tests** — 10 simultaneous submits / 20 duplicate webhooks
7. **k6 / Playwright E2E** — not yet run for Phase 26.10
8. **Mail delivery audit** — payment notification SMTP path not re-verified in this increment

## Frontend — before / after

| Before | After (increment 1) |
|--------|---------------------|
| Payment selector on `/checkout` **and** `/checkout/payment/:id` | Selector **only** after «تأكيد الطلب» |
| Internal IDs: `visa`, `apple` | Canonical: `card`, `apple_pay` |
| Apple Pay shown on all devices | Hidden when `ApplePaySession` unavailable |
| Frontend sent gateway codes to submit | Frontend sends **canonical** method; server maps to gateway |

## Security observations

- ✅ Order ownership enforced on initiate/submit (`pay` policy)
- ✅ Amount/currency verified server-side in finalization/webhooks
- ✅ Browser callback explicitly **non-authoritative**
- ✅ Submit validates payment method against enum allowlist
- ⚠️ Webhook replay protected by payload hash, not provider event ID alone
- ❌ Payment circuit breaker not implemented

## PCI

- ✅ No card PAN/CVV storage in codebase
- ✅ Provider-hosted MyFatoorah embedded flow
- ✅ No payment credentials in frontend bundle beyond session IDs

## MyFatoorah regression risk

**Low for increment 1** — gateway adapter unchanged except Tabby mapper entry and canonical method resolution layer.

## Mail (from spec §36)

Not re-audited in increment 1. Prior sessions noted `mail:test` may succeed at Laravel layer without SMTP delivery. **NOT VERIFIED** for payment notification emails.
