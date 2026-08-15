# DIYAR — API Specification

> **Stage:** 0 — Phase 0.6 (planned contract)  
> **Status:** CURRENT BASELINE for **planned** endpoints  
> **Implemented API (Stage 1):** see [`../API/README.md`](../API/README.md)  
> **Base URL:** `/api/v1`  
> **Format:** JSON  
> **Auth:** Laravel Sanctum (infrastructure Stage 1; workflows Stage 2)

**Important:** Most endpoints in this document are **not yet implemented**. Only `GET /api/v1/health` exists in code. Response envelope for implemented endpoints uses `success` + `data` — see [`../API/API_CONVENTIONS.md`](../API/API_CONVENTIONS.md).

OpenAPI generation planned for a future stage (Scramble or L5-Swagger).

---

## 1. Conventions

### 1.1 Response Envelope

**Success (single resource):**
```json
{
  "data": { }
}
```

**Success (collection):**
```json
{
  "data": [ ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 98
  },
  "links": { "next": "...", "prev": null }
}
```

### 1.2 Error Format (Laravel standard)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "phone": ["The phone field is required."]
  }
}
```

### 1.3 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | OK |
| 201 | Created |
| 204 | No content (delete) |
| 401 | Unauthenticated |
| 403 | Forbidden (role/ownership) |
| 404 | Not found |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

### 1.4 Pagination

Query: `?page=1&per_page=20` (max 100)

### 1.5 Filtering & Sorting

Query: `?sort=-created_at&filter[status]=active&filter[category_id]=3`

### 1.6 Idempotency

Required for: `POST /checkout`, `POST /payments/webhook` (via gateway reference)

Header: `Idempotency-Key: {uuid}` on checkout

---

## 2. Authentication (`/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Guest | Register user + roles |
| POST | `/auth/login` | Guest | Phone or email + password |
| POST | `/auth/logout` | Required | Invalidate token |
| POST | `/auth/otp/send` | Guest | Send phone OTP |
| POST | `/auth/otp/verify` | Guest | Verify OTP → activate account |
| POST | `/auth/forgot-password` | Guest | Initiate recovery |
| POST | `/auth/reset-password` | Guest | Reset with token |
| GET | `/auth/me` | Required | Current user + roles + profiles |

### POST `/auth/register`

**Request:**
```json
{
  "name": "محمد العتيبي",
  "phone": "+966501234567",
  "email": "optional@example.com",
  "password": "SecureP@ss1",
  "password_confirmation": "SecureP@ss1",
  "roles": ["customer", "vendor"]
}
```

**Validation:** name required; phone required unique Saudi format; password policy; roles array valid enums; admin role rejected.

**Response 201:**
```json
{
  "data": {
    "user": { "id": 1, "name": "...", "phone": "...", "account_status": "pending_verification" },
    "message": "OTP sent"
  }
}
```

---

## 3. User Profile (`/api/v1/user`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/user/profile` | Required |
| PATCH | `/user/profile` | Required |
| GET | `/user/addresses` | Required |
| POST | `/user/addresses` | Required |
| PUT | `/user/addresses/{id}` | Required |
| DELETE | `/user/addresses/{id}` | Required |
| POST | `/user/password` | Required |
| GET | `/user/notifications` | Required |
| PATCH | `/user/notifications/{id}/read` | Required |
| GET/PATCH | `/user/notification-preferences` | Required |

---

## 4. Catalog (`/api/v1`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/categories` | Optional |
| GET | `/categories/{slug}/items` | Optional |
| GET | `/products` | Optional |
| GET | `/products/{id}` | Optional |
| GET | `/services` | Optional |
| GET | `/services/{id}` | Optional |
| GET | `/vendors/{slug}` | Optional |
| GET | `/providers/{slug}` | Optional |
| GET | `/search` | Optional |

### GET `/products`

**Query:** `?q=&category_id=&vendor_id=&min_price=&max_price=&sort=price&page=1`

**Response item shape:**
```json
{
  "id": 1,
  "name": "أريكة استرخاء",
  "sale_price": 1850.00,
  "compare_price": 2200.00,
  "vendor": { "id": 1, "store_name": "...", "slug": "..." },
  "primary_image": { "url": "..." },
  "rating_avg": 4.5,
  "availability_mode": "in_stock"
}
```

---

## 5. Cart (`/api/v1/cart`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/cart` | Optional (session or user) |
| POST | `/cart/items` | Optional |
| PATCH | `/cart/items/{id}` | Optional |
| DELETE | `/cart/items/{id}` | Optional |
| POST | `/cart/merge` | Required (merge guest → user) |

### POST `/cart/items`

**Request:**
```json
{
  "item_type": "product",
  "product_id": 1,
  "quantity": 1,
  "attributes": { "color_id": 2 }
}
```

**Server validates:** product active, vendor active, stock/preorder rules, current price loaded server-side.

---

## 6. Checkout (`/api/v1/checkout`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/checkout/preview` | Required |
| POST | `/checkout` | Required |

### POST `/checkout/preview`

**Request:**
```json
{
  "shipping_address_id": 1,
  "coupon_code": "SAVE10",
  "assembly_selections": { "cart_item_id": true }
}
```

**Response:**
```json
{
  "data": {
    "vendor_groups": [
      {
        "vendor_id": 1,
        "vendor_name": "...",
        "items": [ ],
        "subtotal": 1850.00,
        "shipping": 150.00,
        "assembly": 75.00,
        "discount": 0,
        "vendor_total": 2075.00
      }
    ],
    "subtotal": 1850.00,
    "shipping_total": 150.00,
    "assembly_total": 75.00,
    "discount_total": 0,
    "vat_rate": 0.15,
    "vat_amount": 311.25,
    "grand_total": 2386.25
  }
}
```

### POST `/checkout`

**Request:** Same as preview + `payment_method: "mada"|"card"|"apple_pay"|"tabby"`

**Response 201:**
```json
{
  "data": {
    "order_id": 100,
    "order_number": "DYR-20260815-100",
    "payment": {
      "status": "pending",
      "redirect_url": "https://gateway.example/pay/..."
    }
  }
}
```

---

## 7. Orders (`/api/v1/orders`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/orders` | Customer |
| GET | `/orders/{id}` | Customer (owner) |
| POST | `/orders/{id}/reviews` | Customer |

---

## 8. Vendor Dashboard (`/api/v1/dashboard/vendor`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/dashboard/vendor/stats` | Vendor |
| GET | `/dashboard/vendor/orders` | Vendor |
| GET | `/dashboard/vendor/orders/{id}` | Vendor |
| PATCH | `/dashboard/vendor/orders/{id}/status` | Vendor |
| GET | `/dashboard/vendor/products` | Vendor |
| POST | `/dashboard/vendor/products` | Vendor |
| PUT | `/dashboard/vendor/products/{id}` | Vendor |
| DELETE | `/dashboard/vendor/products/{id}` | Vendor |
| PATCH | `/dashboard/vendor/inventory/{productId}` | Vendor |
| GET | `/dashboard/vendor/finance` | Vendor |
| POST | `/dashboard/vendor/payouts` | Vendor |
| GET | `/dashboard/vendor/team` | Vendor (owner) |
| POST | `/dashboard/vendor/team/invite` | Vendor (owner) |
| PUT | `/dashboard/vendor/settings` | Vendor |

### PATCH `/dashboard/vendor/orders/{id}/status`

**Request:**
```json
{
  "status": "shipped",
  "tracking_number": "TRK123456"
}
```

**Validation:** Valid state machine transition only.

---

## 9. Provider Dashboard (`/api/v1/dashboard/provider`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/dashboard/provider/stats` | Provider |
| GET | `/dashboard/provider/requests` | Provider |
| GET | `/dashboard/provider/requests/{id}` | Provider |
| POST | `/dashboard/provider/requests/{id}/offers` | Provider |
| GET | `/dashboard/provider/bookings` | Provider |
| PATCH | `/dashboard/provider/bookings/{id}` | Provider |
| CRUD | `/dashboard/provider/services` | Provider |
| GET | `/dashboard/provider/finance` | Provider |

---

## 10. Service Requests (`/api/v1/service-requests`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/service-requests` | Customer |
| GET | `/service-requests` | Customer |
| GET | `/service-requests/{id}` | Customer |
| POST | `/service-requests/{id}/offers/{offerId}/accept` | Customer |

---

## 11. Payments (`/api/v1/payments`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/payments/webhook/{gateway}` | Gateway (signed) |
| GET | `/payments/{id}/status` | Customer |

**Webhook:** Verify signature → idempotent update → finalize order → ledger → notifications

---

## 12. Returns (`/api/v1/returns`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/returns` | Customer |
| GET | `/returns` | Customer |
| GET | `/returns/{id}` | Customer |

---

## 13. Reviews, Coupons, Notifications

| Method | Path | Auth |
|--------|------|------|
| POST | `/reviews` | Customer (verified purchase) |
| GET | `/coupons/validate?code=` | Required (checkout) |
| GET | `/notifications` | Required |

---

## 14. Messaging (`/api/v1/conversations`) — Polling V1

| Method | Path | Auth |
|--------|------|------|
| GET | `/conversations` | Required |
| POST | `/conversations` | Required |
| GET | `/conversations/{id}/messages?since_id=` | Required |
| POST | `/conversations/{id}/messages` | Required |

**Polling:** Client polls `GET messages?since_id={lastId}` every 5–10 seconds.

---

## 15. Media (`/api/v1/media`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/media/upload` | Required |

**Request:** multipart/form-data  
**Validation:** MIME whitelist, size limits per context

---

## 16. Admin (`/api/v1/admin`) — V1

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/users` | Admin |
| PATCH | `/admin/users/{id}/roles` | Admin |
| PATCH | `/admin/vendors/{id}/approve` | Admin |
| PATCH | `/admin/providers/{id}/approve` | Admin |
| CRUD | `/admin/categories` | Admin |
| CRUD | `/admin/coupons` | Admin |
| GET | `/admin/orders` | Admin |
| POST | `/admin/payouts/{id}/process` | Admin |
| PATCH | `/admin/reviews/{id}/moderate` | Admin |
| GET/PATCH | `/admin/settings` | Admin |

---

## 17. Role Applications (`/api/v1/applications`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/applications/vendor` | Customer/User |
| POST | `/applications/provider` | Customer/User |
| POST | `/applications/marketer` | Customer/User |

Creates pending role + profile for approval workflow.

---

## 18. Frontend Route → API Mapping

| Frontend Route | Primary Endpoints |
|----------------|-------------------|
| `/auth` | `/auth/*` |
| `/` | `/home`, `/products`, `/categories` |
| `/category/:id` | `/categories/{slug}/items` |
| `/product/:id` | `/products/{id}`, `POST /cart/items` |
| `/checkout` | `/checkout/preview`, `/checkout` |
| `/orders` | `/orders` |
| `/profile/*` | `/user/*` |
| `/profile/service-requests` | `/service-requests` |
| `/dashboard/vendor/*` | `/dashboard/vendor/*` |
| `/dashboard/service/*` | `/dashboard/provider/*` |
| `/chat` | `/conversations/*` |

---

## 19. Security Requirements (All Endpoints)

- Validate all input server-side
- Ownership checks on order, cart, conversation access
- Vendor can only access own vendor_orders and products
- Provider can only access own offers and bookings
- Admin routes require admin role
- Rate limit auth: 5/min per IP
- Webhook endpoints: signature verification only, no user auth

---

*Implementation begins Stage 1+. See `adr/ADR-004-api.md`.*
