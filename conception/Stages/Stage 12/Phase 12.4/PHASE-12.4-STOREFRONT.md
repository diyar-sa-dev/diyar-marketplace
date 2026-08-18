# Phase 12.4 — Storefront (Public Store Profile)

> **Scope:** Dynamic vendor store page, follow/unfollow, product listing, policies, working hours.

---

## UI

**Route:** `/store/:slug`  
**Page:** `frontend/src/pages/StorePage.tsx`

Tabs typically include: Products, Reviews, About (policies/hours).

---

## Public API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/vendors/{slug}` | Store profile + summaries |
| GET | `/vendors/{slug}/products` | Paginated active products + filters |
| GET | `/vendors/{slug}/reviews` | Paginated store reviews + summary |
| POST | `/vendors/{slug}/follow` | Follow store (auth) |
| DELETE | `/vendors/{slug}/follow` | Unfollow store (auth) |

**Services:**

- `Catalog\VendorService` — resolve active vendor by slug
- `VendorStorefrontPresenter` — working hours, shipping/return copy, product count
- `StoreReviewService` — paginated reviews + `ratingSummary`
- `VendorStoreFollowService` — follow state

**Resource:** `VendorPublicResource`

---

## Store profile fields (real data)

| Field | Source |
|-------|--------|
| Logo | `vendor_accounts.logo_path` → public URL |
| Cover | `vendor_accounts.cover_path` |
| Store name | `business_name` |
| Description | `description` |
| Location | `location` |
| Product count | Active non-deleted products |
| Rating average / count | `store_reviews` aggregate (**not** derived from product reviews) |
| Working hours | `vendor_working_hours` via presenter |
| Return policy summary | `vendor_return_policies` via presenter |
| Shipping summary | `vendor_shipping_settings` via presenter |
| Followers count / is_following | `vendor_store_follows` |

---

## Contact / chat

Store contact actions are **disabled** in UI until Stage 17 chat exists. No fake messaging endpoint is exposed.

---

## Product listing

- Pagination via standard catalog query params
- Category/price filters reuse catalog filter patterns where applicable
- Product cards show `is_own_store` for authenticated vendor owners (purchase disabled)

---

## Follow / unfollow

- Requires authentication
- Optimistic UI via `useStoreFollow` hook + `storeFollow.ts` API
- Cannot follow own store (server returns business error)

---

## UX details

- **RTL/LTR:** Locale-driven direction on store layout
- **Long store names:** Truncation / line-clamp on mobile header
- **Responsive:** Cover hero, tab bar, product grid adapt at md/lg breakpoints
- **Empty states:** No products, no reviews — localized empty components

---

## Tests

`backend/tests/Feature/Api/V1/Catalog/VendorFollowTest.php`

- Follow/unfollow lifecycle
- Self-follow prevention
- Follower count on public vendor payload

Store payload review counts covered in `StoreReviewTest.php`.

---

## Related frontend files

- `components/store/StoreReviewsTab.tsx`
- `api/catalog.ts`, `api/storeFollow.ts`, `api/storeReviews.ts`
- `lib/storePath.ts` — slug validation helper
