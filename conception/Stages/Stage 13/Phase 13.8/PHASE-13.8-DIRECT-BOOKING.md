# Phase 13.8 — Direct Booking & Schedule Negotiation

> **Status:** **COMPLETE**  
> **Scope:** Fixed-price direct booking, provider confirmation, schedule propose/accept, negotiation timeline.

---

## Problem solved

Customers can book fixed-price services without an RFQ. Providers confirm bookings and negotiate schedules when the initial slot is not suitable.

---

## Direct booking

| Item | Detail |
|------|--------|
| Controller | `DirectServiceBookingController` |
| Service | `DirectServiceBookingService` |
| Source flag | `booking_source = direct` |
| Preview | `POST /services/{id}/booking-preview` |
| Create | `POST /services/{id}/direct-booking` |
| Idempotency | `idempotency_key` header/body |

### Rules

- Service must support direct booking (`supports_direct_booking`)
- Customer cannot book own service
- Duplicate active booking per customer+service → 409
- Creates booking in `pending_provider_confirmation` until provider confirms

---

## Schedule negotiation

Migration: `2026_08_19_260000_add_booking_schedule_history.php`

| Column | Purpose |
|--------|---------|
| `requested_scheduled_date/time` | Original customer request snapshot |
| `last_proposed_scheduled_date/time` | Latest provider counter-proposal |
| `proposed_scheduled_date/time` | Active proposal awaiting customer |

### API

| Method | Route | Actor |
|--------|-------|-------|
| POST | `/dashboard/provider/bookings/{id}/propose-schedule` | Provider |
| POST | `/service-bookings/{id}/accept-schedule` | Customer |
| POST | `/service-bookings/{id}/decline-schedule` | Customer |
| POST | `/dashboard/provider/bookings/{id}/confirm` | Provider |

Validation: `ProposeServiceBookingScheduleRequest` — proposed date must not be in the past (localized AR/EN).

---

## Frontend

| Component | Purpose |
|-----------|---------|
| `DirectBookingModal.tsx` | Customer booking form |
| `ScheduleNegotiationTimeline.tsx` | Visual negotiation steps |
| `lib/scheduleNegotiation.ts` | Timeline step derivation |
| `ServiceBookings.tsx` | Provider propose-schedule UI |

---

## Backend services

- `ServiceBookingService::proposeSchedule`, `acceptSchedule`, `declineSchedule`, `confirm`
- Status transitions include `pending_customer_acceptance` for schedule changes

---

## Tests

`ProviderReviewAndDirectBookingTest`:

- Direct booking creation
- Idempotency (note: one edge case under investigation)
- Duplicate booking block
- Propose schedule with Arabic past-date validation
- Negotiation fields in API response

---

## Outside this phase

- Automated cron for expired schedule proposals
- Calendar integration / availability slots

---

## Deferred

- Provider notes persistence from dashboard textarea on complete
