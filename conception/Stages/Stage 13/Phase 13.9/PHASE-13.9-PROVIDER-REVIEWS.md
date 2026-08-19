# Phase 13.9 — Provider Reviews Inbox

> **Status:** **COMPLETE**  
> **Scope:** Customer reviews of completed service bookings; provider inbox and public responses.

---

## Problem solved

After a completed paid service, customers can review the provider. Providers need an inbox to view reviews and publish one public response per review.

---

## Domain

| Entity | Table |
|--------|-------|
| `ProviderReview` | `provider_reviews` |

**Enum:** `ProviderReviewStatus` — `pending`, `published`, `hidden`, `rejected`

**Migration:** `2026_08_19_160000_create_provider_reviews_and_direct_booking.php`

---

## Backend

| Component | Path |
|-----------|------|
| Controller | `ProviderReviewController` |
| Services | `ProviderReviewService`, `ProviderReviewEligibility` |
| Resource | `ProviderReviewResource`, `ProviderReviewSummaryResource` |

### Customer APIs

| Method | Route |
|--------|-------|
| POST | `/service-bookings/{id}/review` |
| PATCH/DELETE | `/provider-reviews/{id}` |
| GET | `/providers/{slug}/reviews` (public list) |

### Provider APIs

| Method | Route |
|--------|-------|
| GET | `/dashboard/provider/reviews` (inbox) |
| POST | `/provider-reviews/{id}/response` |

---

## Eligibility rules

- Booking `status = completed`
- Booking `payment_status = paid`
- Booking owned by reviewing customer
- No existing review for booking
- Provider cannot review own account (`cannot_review_own_provider`)

---

## Aggregates

On review create/update/delete, `ProviderReviewService::syncAggregates` updates:

- `provider_accounts.rating_average`, `reviews_count`
- `services.rating_average`, `reviews_count` (when service-linked)

Only `Published` reviews included in public aggregates.

---

## Frontend

| Route | Page |
|-------|------|
| `/dashboard/service/reviews` | `ServiceReviewsInbox.tsx` |

Features: pagination, star display, reply modal, success/error toasts.

Customer review UI: booking detail + profile review history (Stage 14 integration).

---

## Moderation

**Not implemented in Stage 13.**

- New reviews created as `Published` immediately
- `hidden`/`rejected` states exist for future Admin moderation
- No admin moderation API or UI

See [FUTURE_ADMIN_MANAGEMENT.md](../FUTURE_ADMIN_MANAGEMENT.md).

---

## Tests

`ProviderReviewAndDirectBookingTest`:

- Customer can review completed paid booking
- Duplicate review → 409
- Provider can respond
- Provider cannot self-review → 403

---

## Outside this phase

- Admin hide/restore workflow (Future Admin / Stage 14)
- Service-specific review targeting beyond booking linkage
