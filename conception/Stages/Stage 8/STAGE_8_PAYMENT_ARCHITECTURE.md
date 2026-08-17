# Stage 8 — Payment Architecture

**Status:** IMPLEMENTED & TESTED (2026-08-17 final audit)

---

## Business Model

DIYAR is a **platform-centered marketplace**:

```text
Customer → ONE MyFatoorah Payment → DIYAR Platform Merchant Account
         → payment_vendor_allocations (immutable internal obligations)
         → Stage 9 Ledger → Vendor Balance → Future Settlement
```

MyFatoorah **does not** split funds to vendors in Stage 8. Gateway requests use `suppliers: []`.

---

## Request Flow

```text
React (CheckoutPage → OrderPaymentPage)
  ↓
PaymentController
  ↓
PaymentApplicationService
  ↓
PaymentGatewayManager
  ↓
PaymentGatewayInterface
  ↓
MyFatoorahGateway
  ↓
myfatoorah/library (V3 + selective V2)
  ↓
MyFatoorah API
```

### Authoritative finalization

```text
MyFatoorah webhook
  ↓
PaymentWebhookProcessor (signature + dedup + DB lock)
  ↓
getPaymentDetails() — V3 server verification
  ↓
Amount / currency / reference verification (MyFatoorahPaymentResponseMapper)
  ↓
PaymentFinalizationService
  ↓  assertPaymentIntegrity (amount + allocation sum)
  ↓  PaymentStateService → paid
  ↓  OrderStateService → confirmed
  ↓  InventoryService → finalize reservations
```

Browser callback (`GET .../payment/callback`) returns `authoritative: false`.

---

## API Endpoints

| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| GET | `/api/v1/orders/{order}/payment` | Customer owner | Show payment |
| POST | `/api/v1/orders/{order}/payment` | Customer owner | Initiate + snapshot allocations |
| POST | `/api/v1/orders/{order}/payment/submit` | Customer owner | Create gateway payment |
| GET | `/api/v1/orders/{order}/payment/callback` | Customer owner | Informational only |
| POST | `/api/v1/webhooks/payments/myfatoorah` | Webhook secret | No session auth |

Client may only send: `idempotency_key`, `session_id`. Never amount/currency/allocation.

---

## Payment State Machine

Managed by `PaymentStateService`:

| State | Transitions to |
|-------|----------------|
| pending | authorized, paid, failed, cancelled, expired |
| authorized | paid, failed, cancelled, expired |
| paid | partially_refunded, refunded |
| failed, cancelled, expired | terminal |

Order cancellation → pending payment marked `cancelled`.

---

## Multi-Vendor Allocations

Table: `payment_vendor_allocations`

Created at payment **initiate** (immutable snapshot via `updateOrCreate` per vendor_order). Refreshed and **verified** at finalization:

- Sum of `vendor_gross_total` must equal `payments.amount`
- `platform_commission_amount` defaults to `0.00` (Stage 9 commission rules)

---

## Idempotency & Concurrency

| Layer | Mechanism |
|-------|-----------|
| Initiation | `UNIQUE (payment_id, idempotency_key)` on `payment_attempts` |
| Submit replay | Returns stored `gateway_payment_url` |
| Webhook | `UNIQUE payload_hash` + `lockForUpdate` |
| Finalization | Early return if already `paid`; inventory finalize once |

---

## Frontend Flow

1. `CheckoutPage` → create order → redirect `/checkout/payment/:orderId`
2. `OrderPaymentPage` → initiate → select DIYAR payment method → submit → redirect to MyFatoorah
3. Return URL: `/orders?highlight={id}&payment=callback`
4. `OrdersPage` polls authoritative payment status (3s interval until terminal)
5. Pending orders show "Complete payment" link

No MyFatoorah secrets in frontend bundle.

---

## Package Isolation

- MyFatoorah code: `app/Services/Payments/Gateways/MyFatoorah/*`
- `composer.json`: `"dont-discover": ["myfatoorah/laravel-package"]`
- No `/myfatoorah/*` demo routes registered
- `MyFatoorahSupplierMapper` exists but is **unused** (future/deferred)

---

## Stage 9 Boundary

**Stage 8 owns:** payments, attempts, webhooks, allocation snapshots  
**Stage 9 owns:** ledger, vendor balance, settlement, withdrawals, commission engine, refund accounting

**DEFERRED:** save-card, Apple Pay (disabled), refund execution, supplier split

---

## Sandbox Verification

Live sandbox E2E: **BLOCKED** — requires `MYFATOORAH_API_KEY` in `backend/.env`.  
Diagnostic: `php tests/Scripts/myfatoorah_sandbox_probe.php`
