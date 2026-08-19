# Future Admin Management — Stage 13 Scope Specification

> **Status:** DOCUMENTATION ONLY — **NOT IMPLEMENTED**  
> **Purpose:** Define what a future centralized Admin/Management application must be able to oversee for Stage 13 domains.

---

## Architectural principle

```text
Customer Application     →  marketplace consumption
Provider Application     →  provider operational layer (Stage 13)
Future Admin Application →  platform management / control plane
```

Admin must **reuse domain services** where possible — not duplicate product/service/booking domains.

Example pattern:

```text
Admin ProductManagementController
        ↓
ProductManagementService (admin-specific authorization + audit)
        ↓
Product domain (shared with vendor portal)
```

Admin is a **management layer**, not a second marketplace.

---

## Admin vs Provider responsibility

| Capability | Provider Portal (Stage 13) | Future Admin |
|------------|---------------------------|--------------|
| Manage own services | ✅ | Inspect all services |
| Manage own bookings | ✅ | Inspect all bookings |
| Respond to reviews | ✅ | Moderate/hide/restore globally |
| View own finance | ✅ | Platform-wide finance visibility |
| Change own settings | ✅ | Inspect/override when policy allows |
| Manage other providers | ❌ | ✅ |
| Global search/filter | ❌ | ✅ |
| Audit trail for admin actions | ❌ | ✅ Required |

---

## 1. Provider / vendor store management

Future Admin should eventually:

- View all `ProviderAccount` and `VendorAccount` records
- Search/filter by name, slug, status, city
- Inspect verification/status fields
- Activate/deactivate accounts per platform policy
- Inspect linked user identity
- View public profile vs dashboard configuration

**Not implemented.** Existing admin routes: category CRUD + payout approval only.

---

## 2. Product management (Stage 12 cross-reference)

Future Admin should eventually:

- View/search/filter all products globally
- Inspect ownership (`vendor_account_id`)
- Inspect status, stock, pricing
- Enable/disable problematic listings
- Link to related orders and reviews

Vendor portal remains the **operational owner** of product CRUD.

---

## 3. Service management (Stage 13)

Future Admin should eventually:

- View/search/filter all `Service` records
- Inspect `provider_account_id` ownership
- Inspect `is_active`, pricing mode, category
- Disable services violating platform policy
- View booking/review activity per service

Provider portal remains the **operational owner** of service CRUD.

---

## 4. Bookings (Stage 13)

Future Admin should eventually:

- View all `ServiceBooking` records globally
- Filter by status, provider, customer, date range, payment status
- Inspect full lifecycle timeline (including schedule negotiation fields)
- Investigate stuck bookings (unpaid, disputed)
- **Privileged actions** (cancel, force-complete) only with audit + reason

Normal business rules must not be bypassed silently.

---

## 5. RFQ / offers (Stage 13)

Future Admin should eventually:

- View all `ServiceRequest` records
- Filter by category, status, customer
- Inspect attachments
- View all `ServiceOffer` submissions per request
- Investigate abnormal patterns (spam offers, category abuse)

Provider inbox remains the operational interface for submitting offers.

---

## 6. Orders (Stage 12 cross-reference)

Future Admin should eventually:

- Global order overview (`Order`, `VendorOrder`)
- Search by order number, customer, vendor
- Inspect payment + shipping status
- Investigate failed/problematic orders

Separate from service bookings — different domain tables.

---

## 7. Payments / finance

Future Admin should eventually:

- Platform visibility: payments, refunds, commissions, provider/vendor payouts
- Failed payment investigation
- **Never** arbitrarily rewrite historical financial records
- Financial corrections via explicit audited adjustment operations

Existing: `AdminPayoutController` (approve/reject/mark-paid vendor payouts).

Provider finance: `/dashboard/provider/finance/*` — admin oversight TBD.

---

## 8. Shipping (Stage 12)

Future Admin should eventually:

- View shipments linked to vendor orders
- Filter by vendor, carrier status
- Investigate delivery failures

Not applicable to service bookings (no physical shipping in Stage 13).

---

## 9. Reviews moderation (Stage 13/14)

Future Admin will manage moderation across:

| Domain | Model |
|--------|-------|
| Product reviews | `ProductReview` |
| Store reviews | `StoreReview` |
| Provider/service reviews | `ProviderReview` |

Required capabilities (future):

- Search/filter reviews globally
- Hide / restore / reject
- Inspect reviewer, target, linked order/booking
- Abuse investigation

**Stage 13 does NOT implement this.** `ProviderReviewStatus` enum exists; new reviews currently publish immediately.

---

## 10. Wishlists

Future Admin should eventually:

- Aggregate wishlist statistics (counts per service)
- Investigate abuse patterns
- **Not** expose unnecessary customer-private browsing data

Operational wishlist: customer-only via `ServiceEngagementController`.

---

## 11. Provider settings oversight

Future Admin should eventually inspect:

- Store/provider identity (name, slug, logo)
- Work policy (`ProviderWorkPolicy`)
- Working hours
- Bank account (masked)
- Notification preferences

Administrative modification only where platform policy requires intervention (e.g. suspend non-compliant provider).

---

## 12. Audit log requirement

Future Admin actions must be auditable:

| Field | Purpose |
|-------|---------|
| `admin_user_id` | Who performed action |
| `action` | e.g. `review.hide`, `provider.deactivate` |
| `target_type` / `target_id` | Entity affected |
| `previous_state` / `new_state` | JSON snapshot |
| `reason` | Required for destructive actions |
| `metadata` | IP, request id, etc. |
| `created_at` | Timestamp |

Examples:

- Admin disabled service
- Admin restored hidden review
- Admin deactivated provider account
- Admin investigated flagged booking

**No audit log system exists yet** for Stage 13 admin actions.

---

## 13. Permission model (future)

Do not grant unlimited access to all admins. Conceptual permissions:

```text
manage_vendors
manage_providers
manage_products
manage_services
manage_bookings
manage_rfqs
manage_offers
manage_orders
manage_payments
manage_shipping
moderate_reviews
manage_platform_settings
view_finance
view_audit_logs
```

Exact roles defined in future Admin stage — not implemented now.

---

## 14. What must NOT be built in Stage 13

```text
❌ Admin frontend pages
❌ Admin dashboard for marketplace management
❌ Admin review moderation UI
❌ Admin booking management UI
❌ Duplicate ProviderReview / ServiceBooking domains
❌ Admin-specific business logic duplicated from provider services
```

---

## 15. Future stage placement

Recommended sequence (documentation):

```text
Stage 13 — Provider operations          ← COMPLETE
Stage 14 — Reviews audit
Stage 15 — Vendor coupons
Future Admin Stage
    ├── User management
    ├── Vendor management
    ├── Provider management
    ├── Product/service oversight
    ├── Order & booking oversight
    ├── RFQ/offer investigation
    ├── Payment/finance oversight
    ├── Review moderation
    ├── Platform settings
    └── Audit & reports
```

---

*This document is the authoritative Stage 13 handoff spec for future Admin engineering.*
