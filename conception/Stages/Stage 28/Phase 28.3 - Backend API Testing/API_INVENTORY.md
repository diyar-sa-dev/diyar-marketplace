# Phase 28.3 — API Inventory

**Date:** 2026-08-27  
**Source:** `php artisan route:list` + `stage28-api-inventory.php`  
**Raw:** `_api_route_inventory.json`

---

## Summary

| Metric | Value |
|--------|-------|
| Total `api/v1` routes | **480** |
| Auth required (middleware) | **431** (~90%) |
| Public routes | **49** (~10%) |
| Route definition file | `backend/routes/api.php` (monolithic) |

---

## Routes by domain (classified)

| Domain | Routes | Auth typical | Notes |
|--------|--------|--------------|-------|
| **Admin** | 167 | Admin session + permissions | Separate auth surface |
| **Profile / user** | 45 | Sanctum | Addresses, avatar, phone, notifications prefs |
| **Services / RFQ** | 23 | Mixed | Catalog + service-requests workflow |
| **Catalog** | 22 | Public read / auth write | Products, categories, search |
| **Auth** | 11 | Public (throttled) | Register, login, OTP, password reset |
| **Orders** | 10 | Customer/vendor | Create, pay, cancel, review eligibility |
| **B2B** | 8 | Mixed | Companies, leads, reviews |
| **Blog / CMS** | 7 | Mixed | Articles, projects, wishlist |
| **Cart** | 7 | Sanctum | CRUD + merge |
| **Analytics** | 6 | Role-scoped | Admin/vendor/provider dashboards |
| **Returns** | 4 | Customer/vendor | Return requests + evidence |
| **Platform** | 4 | Mixed | Theme, commerce settings, newsletter |
| **Health** | 3 | Public | live / ready / full |
| **Loyalty** | 3 | Sanctum | Balance, transactions, rewards |
| **Affiliate** | 2 | Public click/resolve | Throttled |
| **Payments (webhooks)** | 2 | Webhook throttle | MyFatoorah + fake |
| **Checkout** | 1 | Sanctum | `POST /checkout/preview` |
| **Vendor account API** | 1 | Vendor | `/vendor/accounts/{id}` |
| **Provider account API** | 1 | Provider | `/provider/accounts/{id}` |
| **Reviews (direct)** | 2 | Auth | Store review mutations |
| **Unclassified** | 151 | Varies | Dashboard, chat, notifications, shipping vendor ops, etc. |

**Note:** 151 routes sit under paths like `api/v1/dashboard/*`, `api/v1/chat/*`, `api/v1/notifications/*`, `api/v1/vendor-orders/*` — covered by Feature tests but grouped as unclassified in the inventory script. See `_api_route_inventory.json` → `unclassified.uris`.

---

## Public endpoints (sample)

```text
GET  /api/v1/health, /health/live, /health/ready
GET  /api/v1/products, /categories, /services, /catalog/search
POST /api/v1/auth/register, /auth/login, /auth/forgot-password
POST /api/v1/webhooks/payments/*
GET  /api/v1/b2b/companies, /blog/articles, /projects
POST /api/v1/platform/newsletter, /affiliate/referrals/click
```

---

## Authentication requirements

| Middleware pattern | Purpose |
|--------------------|---------|
| `auth:sanctum` | Marketplace authenticated routes |
| `admin.permission:*` | Admin RBAC |
| `throttle:auth`, `throttle:otp` | Auth/OTP rate limits |
| `throttle:catalog-search` | Search abuse prevention |
| `throttle:webhooks` | Webhook flood prevention |
| `marketplace.maintenance` | Maintenance mode gate |

Full middleware per route: `_api_route_inventory.json` → `routes[]`

---

## Pagination

Used on list endpoints (products, orders, notifications, admin lists). Structure verified in Feature tests — `{ items, meta: { page, per_page, total, ... } }` envelope pattern.

---

## Idempotency headers

Order creation and payment flows accept `Idempotency-Key` header (verified in `OrderAuthorizationTest`, `PaymentConcurrencyTest`).

---

## Domains marked N/A

| Domain | Status |
|--------|--------|
| Separate "Guichet" role API | **N/A** — not in `RoleName` enum |
| Standalone `/coupons` public API | **N/A** — vendor coupons via dashboard + checkout |
| Dedicated `/bookings` top-level | **Partial** — under services/provider paths |

---

## Inventory gate

```text
PASS
```

480 routes enumerated with method, URI, action, middleware, auth flag.
