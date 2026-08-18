# Phase 12.6 — Business Rules & Security (Rules 46–71)

> **Implementation authority:** Server-side services are the source of truth. Frontend guards are UX-only.

This document maps Phase 2 marketplace integrity rules to **actual code** in the repository.

---

## Rule groups

### Self-purchase prevention (Rules 46–50)

| Rule | Implementation | HTTP |
|------|----------------|------|
| Block add-to-cart for own products | `SelfPurchaseGuard` in `CartService` | 403 |
| Cart validation flags `self_purchase` issue | `CartValidationService` | 200 + issue code |
| Cart merge skips own products + warning | `CartMergeService` | — |
| Checkout/order creation final guard | `OrderCreationService` | 403 |
| Multi-vendor cart: only own items blocked | `SelfPurchaseGuard::assertCartItemsNotSelfPurchase` | 403 |

**Support:** `VendorOwnership::userOwnsProduct`

**Tests:** `SelfPurchaseTest.php` (5 cases)

---

### Self-review prevention (Rules 51–53)

| Rule | Implementation |
|------|----------------|
| Vendor cannot review own product | `ProductReviewEligibilityService::assertCanCreateReview` |
| Vendor cannot review own store | `StoreReviewService::assertNotSelfReview` + eligibility status |
| Product/store APIs expose ownership hints | `is_own_store` on product resources; auth `vendor_account` on `/auth/me` |

**Tests:** `ProductReviewIntegrityTest`, `StoreReviewTest`

---

### Verified purchase only (Rules 54–58)

| Rule | Implementation |
|------|----------------|
| Product review requires delivered + paid line | `ProductReviewEligibilityService::eligibleVendorOrderQuery` |
| Store review requires delivered + paid vendor order | `OrderFulfillmentReviewEligibility` |
| Unpaid / undelivered → not eligible | Both services return forbidden or `not_eligible` |
| Partially refunded payment still eligible | `PaymentStatus::PartiallyRefunded` included |
| Multi-vendor: eligibility per vendor order slice | Store review keyed by `(user, vendor, order)` |

**Tests:** Delivered-order fixtures in `InteractsWithDeliveredOrders`; integrity tests

---

### Review ownership & duplicates (Rules 59–64)

| Rule | Implementation | HTTP |
|------|----------------|------|
| Edit/delete own product review only | `ProductReviewEligibilityService::assertReviewOwnership` | 403 |
| Edit/delete own store review only | `StoreReviewService` ownership checks | 403 |
| Duplicate product review | DB unique + `isUniqueConstraintViolation` | 409 |
| Duplicate store review per order | `lockForUpdate` + existing row check | 409 |
| Comment sanitization | `strip_tags` + empty comment rejection | 422 |
| Whitespace-only comment rejected | Store + product normalizers | 422 |

---

### IDOR & authorization (Rules 65–68)

| Rule | Implementation |
|------|----------------|
| Store review update/delete by review ID | Controller resolves review; service verifies `user_id` |
| Order-scoped store review | Order must belong to authenticated user |
| Vendor settings/finance scoped to own account | `VendorAccountPolicy` + `role:vendor` middleware |
| Cross-vendor data access denied | Finance tests, settings policy |

**Tests:** `ProductReviewIntegrityTest`, `VendorFinanceApiTest`, `OwnershipAuthorizationTest` (Stage 2)

---

### HTTP semantics & transactions (Rules 69–71)

| Situation | Status | Handler |
|-----------|--------|---------|
| Business rule denial (self-purchase, not eligible) | 403 | Symfony exceptions / `AccessDeniedHttpException` |
| Duplicate review | 409 | `ConflictHttpException` + `bootstrap/app.php` renderer |
| Validation failures | 422 | Form requests / `InvalidArgumentException` |
| Store review create race | 409 | `DB::transaction` + `lockForUpdate` on duplicate check |

**Transaction safety:** Store review creation and payout requests use explicit DB transactions with row locks where races matter.

---

## Input sanitization & uploads (cross-cutting)

| Area | Mechanism |
|------|-----------|
| Review comments | HTML stripped server-side |
| Vendor logo SVG | `SvgSafetyValidator` |
| Image uploads | MIME whitelist + max size (`diyar_media`) |
| IBAN | `IbanValidator` server-side |

---

## Frontend integrity UX (non-authoritative)

- `is_own_store` disables add-to-cart on product detail/cards
- `CustomerProfileRoute` — vendor-only users redirected from customer profile routes
- `resolveAccountHubPath` — vendor-only account hub → settings account tab
- Security/password: single flow at `/profile/security`

---

## Explicitly not in scope

- Service booking self-purchase/review (future Stage 13+)
- Admin review moderation
- Webhook-style review abuse detection

See [ACCEPTANCE-MATRIX.md](./ACCEPTANCE-MATRIX.md) for per-requirement PASS/PARTIAL/DEFERRED status.
