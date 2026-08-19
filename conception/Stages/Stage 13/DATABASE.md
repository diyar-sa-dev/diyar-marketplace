# Stage 13 — Database Reference

> Source: migrations under `backend/database/migrations/` and Eloquent models.

---

## Core entities

### `provider_accounts`

| Field group | Notes |
|-------------|-------|
| PK | UUID |
| Ownership | `user_id` → `users` (one provider account per provider user) |
| Identity | `business_name`, `slug`, `avatar_path`, `bio`, `specialty` |
| Location | `city`, `work_areas`, `supports_remote` |
| Aggregates | `rating_average`, `reviews_count` (cached from `ProviderReview`) |
| Status | `ProviderAccountStatus` enum |

**Relationships:** has many `Service`, `ServiceBooking`, `ServiceOffer`, `ProviderReview`, `ProviderFollow`, `ProviderPayout`, `ProviderBankAccount`, `ProviderWorkPolicy`

---

### `services`

| Field group | Notes |
|-------------|-------|
| PK | UUID |
| FK | `provider_account_id`, `service_category_id` |
| Pricing | `pricing_mode` (`fixed` / `starting_from`), `starting_price`, `price` |
| Display | `title`, `slug`, `description`, `cover_path`, `duration_label` |
| Aggregates | `rating_average`, `reviews_count` |
| Flags | `is_active`, `supports_direct_booking` |

**Unique:** `(provider_account_id, slug)` implied by slug generation

---

### `service_categories`

Seeded taxonomy. `slug`, bilingual names, `icon_key`, `sort_order`, `is_active`.

---

### `service_requests` (RFQ)

| Field group | Notes |
|-------------|-------|
| FK | `user_id` (customer), `service_category_id` |
| Content | `title`, `description`, `budget_min`, `budget_max`, `location`, `preferred_date` |
| Status | `ServiceRequestStatus` — open → closed/cancelled/completed |
| Reference | `reference` (human-readable) |

**Relationships:** has many `ServiceRequestAttachment`, `ServiceOffer`

---

### `service_offers`

| FK | `service_request_id`, `provider_account_id` |
| Status | `ServiceOfferStatus` |
| Content | `price`, `message`, `quotation_path`, schedule fields |
| **Unique constraint** | one offer per `(service_request_id, provider_account_id)` |

---

### `service_bookings`

| FK | `user_id`, `provider_account_id`, `service_id`, optional `service_request_id`, `service_offer_id` |
| Status | `ServiceBookingStatus`, `ServiceBookingPaymentStatus` |
| Schedule | `scheduled_date/time`, `requested_*`, `last_proposed_*`, `proposed_*` |
| Source | `booking_source` — `rfq` or `direct` |
| Payment | `price`, `currency`, `payment_strategy` |

**Unique:** one active direct booking per customer+service (application enforced)

---

### `service_booking_payments`

Links booking to payment attempts. Hardened in `2026_08_19_220000_harden_service_booking_payments.php`.

---

### `provider_reviews`

| FK | `provider_account_id`, `user_id`, `service_booking_id`, `service_id` |
| Content | `rating`, `title`, `comment` |
| Status | `ProviderReviewStatus` — published/hidden/rejected/pending |
| Response | `provider_response`, `provider_responded_at` |

**Unique:** one review per `service_booking_id`

---

### `service_wishlist_items`

| FK | `user_id`, `service_id` |
| **Unique** | `(user_id, service_id)` |

Migration: `2026_08_19_200000_create_service_wishlist_items.php`

---

### `provider_work_policies`

One-to-one with `provider_accounts`. Delivery/revision/cancellation terms.

Migration: `2026_08_19_240000_create_provider_work_policies.php`

---

### Finance extensions

| Table | Purpose |
|-------|---------|
| `provider_bank_accounts` | Payout destination |
| `provider_payouts` | Withdrawal requests |
| Financial transactions | Shared ledger pattern with vendor finance |

Migration: `2026_08_19_080000_create_provider_finance_extensions.php`

---

## Entity relationship (simplified)

```text
users
  ├── provider_accounts
  │     ├── services
  │     ├── service_offers ──► service_requests ◄── users (customer)
  │     ├── service_bookings
  │     ├── provider_reviews
  │     ├── provider_work_policies
  │     └── provider_payouts
  │
  └── service_wishlist_items ──► services
```

---

## Indexes & integrity (highlights)

- Offer duplicate prevention: unique `(service_request_id, provider_account_id)`
- Review duplicate prevention: unique `service_booking_id` on `provider_reviews`
- Wishlist duplicate: unique `(user_id, service_id)`
- Provider scoping: all dashboard queries filter by authenticated user's `provider_account_id`

---

## Stage 13 migrations (2026-08-19 batch)

| Migration | Purpose |
|-----------|---------|
| `120000_add_offer_schedule_and_inbox_improvements` | Offer schedule fields |
| `140000_add_duration_label_to_services` | Service duration label |
| `160000_create_provider_reviews_and_direct_booking` | Reviews + direct booking |
| `180000_add_booking_confirmation_workflow` | Confirm/cancel workflow |
| `200000_create_service_wishlist_items` | Wishlist |
| `220000_harden_service_booking_payments` | Payment idempotency |
| `240000_create_provider_work_policies` | Work policy |
| `260000_add_booking_schedule_history` | Negotiation history columns |

Base catalog migration: `2026_08_18_220000_create_service_marketplace_catalog.php`
