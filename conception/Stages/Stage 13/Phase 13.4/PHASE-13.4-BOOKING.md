# Phase 13.4 — Booking

> **Status:** **COMPLETE**  
> **Scope:** Booking creation on offer accept, status lifecycle, provider start/complete, **provider bookings UI**.

---

## Objective

When a customer accepts an offer, create a `ServiceBooking` linking request, offer, provider, and customer. Provider advances booking through execution after payment.

---

## Domain model

| Entity | Table |
|--------|-------|
| `ServiceBooking` | `service_bookings` |

**Enums:** `ServiceBookingStatus`, `ServicePaymentStrategy`

**Statuses:** `pending_payment`, `confirmed`, `in_progress`, `completed`, `cancelled`

---

## State transitions (booking)

```text
(pending_payment) — created on offer accept
        ↓ payment success
confirmed
        ↓ provider start (optional)
in_progress
        ↓ provider complete
completed
```

Provider may complete directly from `confirmed` (service allows both).

---

## API

| Method | Route | Role |
|--------|-------|------|
| GET | `/api/v1/service-bookings` | customer (own) |
| GET | `/api/v1/service-bookings/{id}` | customer / provider |
| GET | `/api/v1/dashboard/provider/bookings` | provider |
| POST | `/api/v1/dashboard/provider/bookings/{id}/start` | provider |
| POST | `/api/v1/dashboard/provider/bookings/{id}/complete` | provider |

---

## Backend service

`ServiceBookingService`:

- `createFromAcceptedOffer()` — called inside offer accept transaction
- `markInProgress()` — requires `confirmed` + provider ownership
- `markCompleted()` — requires `confirmed` or `in_progress`
- Start before payment → **422** `invalid_transition`
- Another provider's booking → **403**

On complete: request status → `completed`.

---

## Frontend

| Area | Status |
|------|--------|
| Customer sees booking on request detail after accept | ✅ |
| `ServiceBookings` provider page | ✅ Wired — tabs, actions, schedule timeline, WhatsApp |

**UI mapping (implemented):**

| API status | Dashboard tab |
|------------|---------------|
| `pending_provider_confirmation` | pending confirmation |
| `pending_payment` | awaiting payment |
| `confirmed` / `in_progress` | upcoming |
| `completed` | completed |
| `cancelled` | cancelled |

---

## Security tests

- Provider cannot start before payment (422)
- Provider cannot complete another provider's booking (403)

---

## Acceptance criteria

- [x] Booking created transactionally on offer accept
- [x] Provider start/complete with ownership checks
- [x] Request status sync on lifecycle events
- [x] Provider bookings UI wired to API

---

## Deferred

- Provider notes field persistence from dashboard textarea
- Scheduled date/time capture on accept (optional payload on accept)
