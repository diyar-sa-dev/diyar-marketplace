# Stage 13 — Business Rules

> Server-side services are authoritative. Frontend guards are UX-only.

---

## Provider ownership

| Rule | Implementation |
|------|----------------|
| Provider manages only own services | `ServiceProviderController` resolves `user->providerAccount` |
| Provider sees only own bookings | `ServiceBookingController::providerIndex` scoped by `provider_account_id` |
| Provider inbox only matching categories | `ServiceOfferService::listForProvider` category filter |
| Cross-provider booking action → 403 | Ownership check in `ServiceBookingService` |

---

## RFQ lifecycle (13.2)

| Rule | Implementation |
|------|----------------|
| Customer owns request | `user_id` match on show/cancel/accept |
| Cancel only while open | `ServiceRequestStatus` guard |
| Attachments scoped to request owner | Controller authorization |
| Reference auto-generated | On create |

---

## Offer lifecycle (13.3)

| Rule | Implementation |
|------|----------------|
| One offer per provider per request | DB unique + 422 on duplicate |
| Provider cannot offer on own request | 403 |
| Category must match provider services | Category membership check |
| Closed request → no new offers | 422 `request_closed` |
| Accept rejects sibling pending offers | Transaction in `ServiceOfferService::accept` |

---

## Booking lifecycle (13.4 + 13.8)

| Rule | Implementation |
|------|----------------|
| Booking created on offer accept | Transactional inside accept |
| Direct booking requires fixed-price service | `DirectServiceBookingService` |
| Cannot book own service | `cannot_book_own_service` |
| Duplicate active direct booking blocked | 409 |
| Start requires paid payment | 422 `invalid_transition` if unpaid |
| Complete from confirmed or in_progress | State machine in `ServiceBookingService` |
| Provider confirm for direct bookings | `confirm` endpoint (13.8 workflow) |
| Schedule propose requires future date | `ProposeServiceBookingScheduleRequest` |
| Customer accept/decline schedule | Dedicated endpoints |

---

## Payment (13.5)

| Rule | Implementation |
|------|----------------|
| Payment record per booking | `ServiceBookingPayment` |
| Dev simulate only in local/testing | Fake gateway config |
| Customer owns payment action | `user_id` on booking |
| Idempotent payment attempts | Hardened migration + service |

---

## Reviews (13.9 — domain in 14.x)

| Rule | Implementation |
|------|----------------|
| Review only completed + paid booking | `ProviderReviewEligibility` |
| One review per booking | Unique constraint + 409 |
| Provider cannot self-review | `assertNotSelfReview` → 403 |
| Provider can respond once | `already_responded` conflict |
| New reviews default to Published | No moderation workflow in V1 |

---

## Finance (13.7)

| Rule | Implementation |
|------|----------------|
| Provider sees own transactions only | Scoped queries in `ProviderFinanceService` |
| Payout minimum enforced | Config `diyar.finance.payout_minimum` |
| Bank account required for payout | Validation in payout request |

---

## Settings & work policy (13.10)

| Rule | Implementation |
|------|----------------|
| Provider updates own profile only | Settings controller ownership |
| Work policy exposed on public profile | `work_policy_summary` on provider show |
| Avatar upload MIME/size limits | `MediaUploadService` |
| Password change requires current password | Request validation |

---

## Wishlist

| Rule | Implementation |
|------|----------------|
| Authenticated customer only | Middleware |
| Toggle idempotent | Unique `(user_id, service_id)` |
| Cannot wishlist inactive services | Validation in `ServiceEngagementService` |

---

## HTTP semantics

| Situation | Code |
|-----------|------|
| Business rule denial | 403 |
| Duplicate offer/review | 409 |
| Validation / bad transition | 422 |
| Not found / wrong owner | 404 |

---

## Tests referencing these rules

| Suite | Focus |
|-------|-------|
| `ServiceRfqWorkflowTest` | RFQ → offer → accept → pay → complete |
| `ProviderReviewAndDirectBookingTest` | Direct booking, reviews, schedule, self-review |
| `ProviderDashboardExtrasTest` | Settings, services CRUD, finance, work policy |
| `ServiceCatalogTest` | Catalog, follow |
| `ServiceWishlistTest` | Wishlist toggle |

See [TEST-RESULTS.md](./TEST-RESULTS.md).
