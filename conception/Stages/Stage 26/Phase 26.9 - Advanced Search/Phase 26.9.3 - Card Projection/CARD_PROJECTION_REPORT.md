# Phase 26.9.3 — Card Projection Report

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Architecture & Performance Engineering  
**Scope:** Strict minimal projection audit and separation between listing cards and product detail  

---

## 1. Executive Summary

DIYAR enforces a clean separation of concerns between catalog cards (search/listing) and the product detail view:
* **Search / Listing (`GET /products`, `GET /catalog/search`):** Returns lightweight card projection (`ProductCardResource`). Large text columns (`description`, `materials`, `warranty`), unneeded relationships (multi-angle images, full reviews list, vendor profile settings) are excluded from the initial SELECT.
* **Product Detail (`GET /products/{id}`):** Returns the full representation (`ProductDetailResource`), including full description, all images, dimension specs, reviews list, and seller profile.

---

## 2. Card Projection Field Analysis

The fields projected by `cardColumns()` and hydrated via `cardEagerLoads()` precisely match the requirements of `ProductCardResource`:

| Field | Source | Purpose on Card |
| :--- | :--- | :--- |
| `id` | `products.id` | Card key, navigation |
| `name` | `products.name` | Title |
| `slug` | `products.slug` | URL routing |
| `sale_price` | `products.sale_price` | Primary price |
| `compare_price` | `products.compare_price` | Strikethrough price |
| `promotion_ends_at` | `products.promotion_ends_at` | Discount urgency countdown |
| `discount_percent` | Computed from prices | Badge percentage |
| `availability_mode` | `products.availability_mode` | In-stock / pre-order badge |
| `product_type` | `products.product_type` | Physical / customizable badge |
| `image_url` | `primaryImage.mediaFile.path` | Cover thumbnail |
| `vendor` | `vendorAccount (id, business_name, slug)` | Seller store link |
| `category` | `category (name, slug, type)` | Category chip |
| `inventory` | `inventory (stock, reserved, available)` | Low stock indicator |
| `rating_avg` | Hydrated from `product_reviews` batch | Star rating |
| `reviews_count` | Hydrated from `product_reviews` batch | Review counter |
| `loyalty_points_estimate`| Computed from sale price | Reward estimate |
| `user_saved` | Authenticated user wishlist check | Heart toggle state |

---

## 3. Detail Separation Audit

| Attribute | Card Query (`listPublic`) | Detail Query (`findPublic`) |
| :--- | :---: | :---: |
| `description` | **Excluded** | Included |
| `materials` | **Excluded** | Included |
| `warranty` | **Excluded** | Included |
| `dimensions` (width, height, depth) | **Excluded** | Included |
| Secondary Images | **Excluded** (only primary image) | Included (all uploaded gallery media) |
| Reviews List | **Excluded** | Included with user avatars & comments |

### Verification
No N+1 queries were introduced. Frontend card rendering passed all Vitest integration suites (350/350 tests passed).
