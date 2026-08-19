# Stage 13 — API Reference (Provider & Service Marketplace)

> Prefix: `/api/v1` · Auth: Sanctum session/cookie unless noted.

---

## Public (no auth)

| Method | Route | Controller |
|--------|-------|------------|
| GET | `/service-categories` | `ServiceCategoryController@index` |
| GET | `/services` | `ServiceController@index` |
| GET | `/services/{slug\|id}` | `ServiceController@show` |
| GET | `/services/{slug\|id}/related` | `ServiceController@related` |
| GET | `/providers/{slug}` | `ProviderController@show` |
| GET | `/providers/{slug}/services` | `ProviderController@services` |
| GET | `/providers/{slug}/portfolio` | `ProviderController@portfolio` |
| GET | `/providers/{slug}/reviews` | `ProviderReviewController@index` |

---

## Customer (authenticated)

| Method | Route | Purpose |
|--------|-------|---------|
| POST/DELETE | `/providers/{slug}/follow` | Follow/unfollow provider |
| GET/POST | `/service-requests` | List/create RFQ |
| GET | `/service-requests/{id}` | RFQ detail |
| POST | `/service-requests/{id}/cancel` | Cancel RFQ |
| POST | `/service-requests/{id}/attachments` | Upload attachment |
| POST | `/service-requests/{id}/offers` | Provider submits offer (provider role) |
| POST | `/service-offers/{id}/accept` | Accept offer → creates booking |
| POST | `/service-offers/{id}/reject` | Reject offer |
| GET | `/service-bookings` | Customer bookings list |
| GET | `/service-bookings/{id}` | Booking detail |
| GET | `/service-bookings/{id}/payment` | Payment status |
| POST | `/service-bookings/{id}/payment/simulate` | Dev payment simulate |
| POST | `/service-bookings/{id}/accept-schedule` | Accept proposed schedule |
| POST | `/service-bookings/{id}/decline-schedule` | Decline proposed schedule |
| POST | `/service-bookings/{id}/cancel` | Customer cancel |
| POST | `/service-bookings/{id}/review` | Create provider review |
| PATCH/DELETE | `/provider-reviews/{id}` | Update/delete own review |
| POST | `/provider-reviews/{id}/response` | Provider response |
| POST | `/services/{id}/booking-preview` | Direct booking preview |
| POST | `/services/{id}/direct-booking` | Create direct booking |
| POST/DELETE | `/services/{id}/wishlist` | Toggle service wishlist |

---

## Provider dashboard (`role:provider,admin`)

Prefix: `/dashboard/provider`

### RFQ & offers

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/service-requests` | Inbox (`status`: all/open/submitted) |
| GET | `/service-requests/{id}` | Request detail for offer form |

### Services

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/services` | Own services list |
| POST | `/services` | Create service |
| PATCH | `/services/{id}` | Update service |
| DELETE | `/services/{id}` | Delete/deactivate service |

### Bookings

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/bookings` | Provider bookings list |
| POST | `/bookings/{id}/confirm` | Confirm pending direct booking |
| POST | `/bookings/{id}/propose-schedule` | Counter-propose schedule |
| POST | `/bookings/{id}/start` | Start work (post-payment) |
| POST | `/bookings/{id}/complete` | Mark completed |
| POST | `/bookings/{id}/cancel` | Provider cancel |

### Finance (13.7)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/finance/summary` | Balance summary |
| GET | `/finance/analytics` | Revenue chart data |
| GET | `/finance/transactions` | Transaction history |
| GET | `/finance/export` | Export report |
| POST | `/finance/payouts` | Request payout |

### Settings (13.10)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/settings` | Full settings bundle |
| PATCH | `/settings/profile` | Profile/specialty/bio |
| PUT | `/settings/working-hours` | Working hours |
| PATCH | `/settings/account` | Account fields |
| PATCH | `/settings/password` | Password change |
| PATCH | `/settings/notifications` | Notification prefs |
| PATCH | `/settings/bank-account` | Bank account |
| POST/DELETE | `/settings/avatar` | Avatar upload/delete |
| GET/PUT | `/settings/work-policy` | Work policy CRUD |

### Reviews (13.9)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/reviews` | Provider review inbox |

---

## Authorization patterns

| Check | Mechanism |
|-------|-----------|
| Provider dashboard access | `role:provider,admin` middleware |
| Own booking/request | `provider_account_id` match in service layer |
| Customer owns RFQ/booking | `user_id` match |
| Category match for offers | Provider must have service in request category |
| Self-review block | Provider cannot review own provider account |
| Payment before start | `ServiceBookingPaymentStatus::Paid` required |

---

## Common HTTP semantics

| Code | Meaning |
|------|---------|
| 403 | Ownership / role / self-action denied |
| 409 | Duplicate offer or review |
| 422 | Validation / invalid state transition |

---

## Form requests (validation)

Located in `backend/app/Http/Requests/ServiceMarketplace/` — e.g. `StoreServiceRequestRequest`, `ProposeServiceBookingScheduleRequest`, `CreateProviderReviewRequest`, `UpdateProviderWorkPolicyRequest`.
