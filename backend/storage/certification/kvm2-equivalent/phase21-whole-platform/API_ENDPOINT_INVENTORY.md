# Phase 21 — API Endpoint Inventory & Surface Map

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Performance & Capacity Engineering  
**Scope:** Complete platform inventory across Frontend, Backend APIs, Admin, Customer, and Realtime boundaries  

---

## 1. High-Level Surface Summary

| Surface Domain | Total Endpoints | Auth Required | Cache / Stampede Guard | Primary Storage |
| :--- | :---: | :---: | :---: | :--- |
| **Storefront & Catalog** | 28 | Public / Optional | StampedeSafeCache / Redis | MySQL + Fulltext ngram |
| **Search & Discovery** | 12 | Public / Optional | Versioned Redis Cache | MySQL Fulltext + Embeddings |
| **Cart & Checkout** | 22 | Sanctum Customer | Redis session + DB | MySQL transactions + Row locks |
| **Orders & Shipping** | 34 | Sanctum Customer/Vendor| DB transaction | MySQL InnoDB |
| **Payments & Webhooks** | 8 | Public HMAC / Sanctum | Redis rate-limited | MySQL + Gateway Boundary |
| **Customer Engagement** | 30 | Sanctum Customer | Redis cached | MySQL `product_reviews`, `likes` |
| **Services Marketplace** | 42 | Public & Sanctum | Redis cached | MySQL `service_profiles`, `bookings`|
| **Room Designer & Visual Search**| 18 | Public / Sanctum | S3 / Local storage | Vector candidates + Snapshots |
| **Vendor & Provider Dashboard** | 68 | Sanctum Vendor/Provider | Redis cached | MySQL multi-tenant scoped |
| **Admin Operations** | 124 | Sanctum Admin + RBAC | Direct DB query | MySQL multi-model |
| **Chat & Notifications** | 26 | Sanctum + Reverb | Redis pub/sub | MySQL messages + WebSocket |
| **System Health & Ops** | 6 | Public / Internal | Realtime probes | MySQL, Redis, Workers probe |
| **Total Platform Surface** | **528** | — | — | — |

---

## 2. Core Operational Endpoints Detail

### A. Storefront, Catalog & Search
| Method | URI | Auth | Controller & Service | Storage & Caching | Rate Limit |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/storefront/home` | No | `HomeStorefrontController` -> `HomeStorefrontService` | Redis versioned catalog | 120/min |
| `GET` | `/api/v1/products` | No | `ProductController` -> `ProductService` | MySQL Fulltext + Batch Hydration | 120/min |
| `GET` | `/api/v1/products/{id}` | Optional | `ProductController` -> `ProductService` | Redis tagged cache + MySQL detail | 120/min |
| `GET` | `/api/v1/catalog/search` | Optional | `CatalogSearchController` -> `CatalogSearchService` | Redis StampedeSafeCache (60s) | 60/min |
| `POST`| `/api/v1/search/visual` | No | `VisualSearchController` -> `VisualSearchService` | Python vector service / Local | 20/min |
| `GET` | `/api/v1/categories` | No | `CategoryController` -> `CategoryService` | Redis cached | 120/min |
| `GET` | `/api/v1/vendors` | No | `VendorController` -> `VendorService` | Redis cached | 120/min |
| `GET` | `/api/v1/vendors/{slug}` | No | `VendorController` -> `VendorService` | Redis cached | 120/min |

### B. Customer Commerce (Cart, Checkout, Orders)
| Method | URI | Auth | Controller & Service | Storage & Caching | Rate Limit |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/cart` | Sanctum | `CartController` -> `CartService` | MySQL + Redis | 60/min |
| `POST`| `/api/v1/cart/items` | Sanctum | `CartController` -> `CartService` | MySQL lockForUpdate (inventory) | 60/min |
| `DELETE`| `/api/v1/cart/items/{id}`| Sanctum | `CartController` -> `CartService` | MySQL row delete | 60/min |
| `POST`| `/api/v1/checkout/calculate`| Sanctum | `CheckoutController` -> `CheckoutService` | Redis shipping/coupon rules | 30/min |
| `POST`| `/api/v1/checkout/orders` | Sanctum | `CheckoutController` -> `OrderService` | MySQL Transaction + Outbox event | 15/min |
| `GET` | `/api/v1/orders` | Sanctum | `OrderController` -> `OrderService` | MySQL `orders` (user_id scoped) | 60/min |
| `GET` | `/api/v1/orders/{id}` | Sanctum | `OrderController` -> `OrderService` | MySQL eager loads items | 60/min |
| `POST`| `/api/v1/webhooks/payments/myfatoorah`| HMAC | `PaymentWebhookController` -> `PaymentService` | MySQL Transaction + Order status | 120/min |

### C. Customer Engagement & Wishlist
| Method | URI | Auth | Controller & Service | Storage & Caching | Rate Limit |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/wishlist` | Sanctum | `WishlistController` -> `ProductEngagementService` | MySQL `wishlist_items` | 60/min |
| `POST`| `/api/v1/products/{id}/wishlist`| Sanctum | `WishlistController` -> `ProductEngagementService` | MySQL insert/delete | 60/min |
| `POST`| `/api/v1/products/{id}/like`| Sanctum | `LikeController` -> `ProductEngagementService` | MySQL atomic toggle | 60/min |
| `GET` | `/api/v1/products/{id}/reviews`| No | `ReviewController` -> `ProductEngagementService` | MySQL paginated reviews | 60/min |
| `POST`| `/api/v1/products/{id}/reviews`| Sanctum | `ReviewController` -> `ProductEngagementService` | MySQL review eligibility | 20/min |

### D. Advanced Modules (Room Designer, Try-in-Room)
| Method | URI | Auth | Controller & Service | Storage & Caching | Rate Limit |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/room-designs` | Sanctum | `RoomDesignController` -> `RoomDesignService` | MySQL `room_designs` | 60/min |
| `POST`| `/api/v1/room-designs` | Sanctum | `RoomDesignController` -> `RoomDesignService` | MySQL JSON snapshot payload | 30/min |
| `PUT` | `/api/v1/room-designs/{id}`| Sanctum | `RoomDesignController` -> `RoomDesignService` | MySQL JSON document update | 60/min |
| `POST`| `/api/v1/try-in-room` | Sanctum | `TryInRoomController` -> `TryInRoomJob` | Queue `default` (Async worker) | 10/min |

### E. Health & Observability
| Method | URI | Auth | Probe Targets | Expected Result | Rate Limit |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/health/live` | No | Octane HTTP ping | HTTP 200 `status: ok` | None |
| `GET` | `/api/v1/health/ready` | No | MySQL + Redis ping | HTTP 200 `database: ok, redis: ok`| None |
| `GET` | `/api/v1/health/detailed`| Admin | MySQL, Redis, Storage, Queue | Full diagnostic subsystem health | 10/min |

---

## 3. Frontend Route & SPA Inventory

* **Public Web Surface:**
  - `/` (Home Storefront)
  - `/search` (Catalog Search & Facets)
  - `/category/:id` (Category Showcase)
  - `/product/:id` (Product Detail & Engagement)
  - `/store/:slug` (Vendor Storefront)
  - `/services` (Services Catalog)
  - `/service/:id` (Service Detail & Booking)
  - `/blog` & `/blog/:slug` (Content Articles)
* **Customer Account Surface:**
  - `/orders`, `/wishlist`, `/profile`
  - `/checkout`, `/checkout/payment/:orderId`
  - `/profile/room-designer` (2.5D Isometric & 3D WebGL Canvas)
* **Admin Operations Control Plane (`/admin/*`):**
  - `/admin/dashboard`, `/admin/orders`, `/admin/products`, `/admin/coupons`, `/admin/refunds`, `/admin/reviews`, `/admin/roles`, `/admin/health`
