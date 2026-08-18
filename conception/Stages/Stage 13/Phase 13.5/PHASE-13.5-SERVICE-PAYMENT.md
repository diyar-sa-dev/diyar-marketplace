# Phase 13.5 — Service Payment

> **Status:** **COMPLETE (development gateway)** · Production MyFatoorah — **DEFERRED**  
> **Scope:** Service booking payment record, simulate paid/failed, booking confirmation.

---

## Objective

Collect payment for accepted service bookings using the same gateway abstraction pattern as commerce, with local simulation for development/CI.

---

## Domain model

| Entity | Table |
|--------|-------|
| `ServiceBookingPayment` | `service_booking_payments` |

**Enum:** `ServiceBookingPaymentStatus`

**Strategy enum:** `ServicePaymentStrategy` — full / deposit / escrow (configurable domain; MVP uses full)

---

## Payment flow

```text
Offer accepted → booking (pending_payment)
        ↓
GET /service-bookings/{id}/payment
        ↓
POST /service-bookings/{id}/payment/simulate { outcome: paid|failed }
        ↓ (paid)
booking → confirmed, payment_status → paid
service_request → in_progress
```

---

## API (customer, auth)

| Method | Route |
|--------|-------|
| GET | `/api/v1/service-bookings/{id}/payment` |
| POST | `/api/v1/service-bookings/{id}/payment/simulate` |

---

## Backend service

`ServiceBookingPaymentService` — reuses payment finalization patterns from commerce where applicable.

**Controller:** `ServiceBookingPaymentController`

---

## Frontend

- `ServiceRequestsPage` — **إتمام الدفع** when booking is `pending_payment`
- Uses existing payment simulator route pattern (`LocalPaymentSimulatorPage` commerce parallel)

---

## Security

- Payment endpoints scoped to booking owner (customer)
- Provider cannot simulate customer payment
- Idempotent simulate handling where applicable

---

## Tests

`ServiceRfqWorkflowTest`:

- `customer_can_simulate_booking_payment`
- `provider_can_complete_booking_after_payment`

---

## Acceptance criteria

- [x] Payment record created with booking
- [x] Simulate paid transitions booking to confirmed
- [x] Simulate failed leaves booking pending payment
- [x] Customer UI payment CTA wired

---

## Deferred / limitations

| Item | Notes |
|------|-------|
| Production MyFatoorah for services | Same credential dependency as commerce production gateway |
| Deposit / escrow strategies | Domain enums present; full UI not required for MVP |
| Webhook path for service payments | Reuse Stage 8 pattern when production gateway enabled |

**Do not mark production payment as complete** while only local simulate is available.
