# Phase 12.5 — Review System

> **Principle:** Product reviews and store reviews are **separate domains**. Store ratings are **never** derived from product review averages.

---

## Domain separation

| Aspect | Product reviews | Store reviews |
|--------|-----------------|---------------|
| Table | `product_reviews` | `store_reviews` |
| Service | `ProductEngagementService` + `ProductReviewEligibilityService` | `StoreReviewService` (source of truth) |
| Scope | One review per user per product | One review per user per vendor per order |
| Public display | Product detail page | Store page + vendor dashboard |
| Aggregation | Product rating on catalog cards | `StoreReviewService::ratingSummary` |

---

## Eligibility pipeline

```text
Delivered vendor order
        +
Valid payment (Paid | PartiallyRefunded)
        ↓
OrderFulfillmentReviewEligibility::isVendorOrderEligible
        ↓
┌───────────────────────┬────────────────────────┐
│ Product review path   │ Store review path      │
│ ProductReview         │ StoreReviewService     │
│ EligibilityService    │ ::createReview         │
└───────────────────────┴────────────────────────┘
        ↓
Aggregation (product avg | store summary)
```

**Shared rule:** `OrderFulfillmentReviewEligibility` — delivered + paid.

**Product-specific:** Must have order line for that product (`ProductReviewEligibilityService::hasVerifiedPurchase`).

**Store-specific:** Must include `order_id` tying review to a multi-vendor order slice; vendor must appear on that order.

---

## Product reviews

### API

| Method | Endpoint |
|--------|----------|
| GET | `/products/{id}/reviews` (public) |
| POST | `/products/{id}/reviews` |
| PATCH | `/products/{id}/reviews` |
| DELETE | `/products/{id}/reviews` |

### Rules (server-side)

- Verified purchase required
- Vendor cannot review own product (`VendorOwnership`)
- One review per user/product (unique constraint → **409**)
- Owner can edit/delete; others **403**
- Comments stripped/sanitized (`strip_tags`, trim)

### Frontend

- `ProductDetailsPage.tsx` — submit/edit/delete when eligible
- `ProductCard.tsx` / detail — `is_own_store` disables purchase + review prompts appropriately

---

## Store reviews

### API

| Method | Endpoint |
|--------|----------|
| GET | `/vendors/{slug}/reviews` (public paginated + summary) |
| POST | `/vendors/{slug}/reviews` |
| PATCH | `/store-reviews/{review}` |
| DELETE | `/store-reviews/{review}` |
| GET | `/orders/{order}/store-review-eligibility` |

### StoreReviewService responsibilities

- `paginateReviews`, `ratingSummary`, `reviewsCount`, `ratingAverage`
- `eligibilityForOrder` — per-vendor status: `eligible`, `already_reviewed`, `not_eligible`
- `createReview` — validates order ownership, vendor on order, eligibility, self-review block, duplicate lock
- `updateReview` / `deleteReview` — ownership enforcement

**Controller:** `StoreReviewController`, `OrderStoreReviewController`

---

## Review history (customer)

**Route:** `/profile/reviews`  
**API:** `GET /profile/reviews`  
**Service:** `CustomerReviewHistoryService` — unified paginated history of product + store reviews with type discriminator.

Store review edit/delete from profile page: **PARTIAL** — backend ready; list cards remain read-only in UI.

---

## Tests

| File | Coverage |
|------|----------|
| `ProductReviewIntegrityTest.php` | Verified purchase, self-review, duplicate, ownership |
| `ProductEngagementTest.php` | Engagement flows with delivered orders |
| `StoreReviewTest.php` | Create, eligibility, self-review, update/delete, aggregates on vendor payload |
| `CustomerReviewHistoryTest.php` | Unified review history API |

---

## Intentionally deferred

- **Service reviews** — not in V1; history API supports future `type`
- **Admin moderation** (hide/restore) — Stage 14/18
- **Profile UI** for editing store reviews — backend PATCH/DELETE complete
