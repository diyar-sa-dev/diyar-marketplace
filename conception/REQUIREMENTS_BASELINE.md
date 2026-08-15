# DIYAR — Requirements Baseline

> **Stage:** 0 — Discovery & Architecture  
> **Phase:** 0.2 — Requirements Baseline  
> **Status:** Authoritative (product owner QCM completed)  
> **Date:** 2026-08-15

This document captures **confirmed business and technical decisions**. Do not reopen unless a genuine technical contradiction is discovered. Undefined items are marked **OPEN DECISION**.

---

## 1. Product Summary

**DIYAR** is an Arabic RTL multi-vendor marketplace for furniture products and home services, targeting Saudi Arabia (SAR, VAT, Mada payments).

---

## 2. Technology Baseline (CONFIRMED)

**Laravel 13 is the confirmed V1 backend framework.** Installed scaffold: `laravel/framework ^13.17`.

| Component | V1 Decision |
|-----------|-------------|
| Backend | **Laravel 13**, PHP 8.3+, REST `/api/v1` |
| Auth | Laravel Sanctum |
| Database | **MySQL** |
| Cache | **Laravel Cache** (not Redis in V1) |
| Queue | **Database queue** (not Redis in V1) |
| Storage | Laravel filesystem abstraction → S3-compatible in production |
| Architecture | **Modular monolith** |
| Frontend | Existing React 19 + TS + Vite + Tailwind (preserve, connect progressively) |
| Server state | TanStack Query + Axios (to be added) |

**Explicitly NOT in V1:** PostgreSQL, Redis, microservices, WebSockets, social login, AI features.

---

## 3. User Roles (CONFIRMED)

| Role | Arabic UI Label | Notes |
|------|-----------------|-------|
| Customer | عميل | Default role |
| Vendor | تاجر | Sells products |
| Service Provider | مقدم خدمة | Offers services |
| Marketer | مسوق | Affiliate/marketing (UI: affiliate dashboard) |
| Admin | — | No UI prototype; **V1 backend required** |

**Multi-role:** One `User` entity; multiple role memberships via `user_roles`. Account is separate from role profiles.

---

## 4. Account Lifecycle (CONFIRMED)

### Registration fields

| Field | Required |
|-------|----------|
| Full name | Yes |
| Phone | Yes (mandatory identity) |
| Email | Optional |
| Password | Yes |

### Password policy (V1)

- Minimum 8 characters
- Uppercase, lowercase, number, special character

### Account statuses

`pending_verification` → (OTP) → `active` → `suspended` / `disabled`

### Role statuses (separate from account)

Each role: `pending`, `active`, `suspended`, `rejected` (extensible)

**Role activation policy:** Configurable (auto, admin approval, document verification). Do NOT hard-code vendor=always-approval.

---

## 5. Authentication (CONFIRMED)

| Method | V1 |
|--------|-----|
| Phone + password | Yes |
| Email + password | Yes |
| Phone OTP verification | Yes |
| Password recovery | Yes |
| Phone OTP recovery | Yes |
| Email recovery | If email verified |
| Social login (Google, Apple) | **Not V1** — architecture must allow future |

---

## 6. Authorization (CONFIRMED)

- V1: Role-based (middleware + Policies + ownership checks)
- No complex permission UI in V1
- Architecture must allow future: Role → Permission Set → Granular Permissions

---

## 7. Admin (CONFIRMED)

- First admin via **secure database seeder only**
- Public registration must NOT create admin
- V1 admin capabilities: users, roles, vendors, providers, products, categories, inventory, orders, payments, refunds, commissions, balances, payouts, coupons, reviews, service requests, bookings, notifications, platform settings

---

## 8. V1 Feature Scope (CONFIRMED — Must Deliver)

1. Customer profile
2. Vendor registration/application
3. Provider registration/application
4. Marketer registration/application
5. Product marketplace + details
6. Search/filter
7. Cart (guest + auth + merge)
8. Multi-vendor checkout
9. Payment (gateway abstracted)
10. Orders (parent + vendor orders)
11. Vendor order management
12. Inventory (stock, reserved, available, preorder)
13. Shipping (per-vendor initially)
14. Returns
15. Reviews (purchase-verified)
16. Services marketplace
17. Service requests + attachments
18. Provider offers (one accepted per request)
19. Service booking + payment
20. Simple chat (polling)
21. Simple notifications
22. Admin-controlled coupons (cart-level V1)
23. Admin operations backend

---

## 9. V1.1 / Later (CONFIRMED — Not V1)

- Loyalty program
- Affiliate/marketer full system
- B2B directory
- Blog/CMS
- Advanced search (Meilisearch etc.)
- Advanced notifications
- Advanced chat (WebSockets)

---

## 10. V2 (CONFIRMED — Future)

- AI Designer
- Image Search
- AI services
- Mobile application
- Advanced personalization

---

## 11. Product Domain Rules (CONFIRMED)

- Products belong to vendors
- Max **5 images** per product (JPG, PNG, high-resolution)
- Fields: name, sale price, comparison price, stock, width, depth, height, materials, warranty, description, colors, status, availability mode
- Availability modes: normal stock, unavailable, **preorder** (configurable per product)
- When stock = 0: product can become unavailable OR accept preorder based on product config

---

## 12. Inventory Rules (CONFIRMED)

```
available_quantity = stock_quantity - reserved_quantity
```

- Auditable inventory movements
- Vendor can increase/decrease/adjust stock
- Reserve stock during checkout (transaction-safe)

---

## 13. Order Model (CONFIRMED)

```
Order (customer checkout)
 ├── VendorOrder A (items, shipping, financials)
 └── VendorOrder B (items, shipping, financials)
```

- Separate order-level and vendor-order-level statuses
- Order: pending, confirmed, processing, completed, cancelled
- VendorOrder: pending, accepted, processing, shipped, delivered, cancelled
- Status transitions must be validated (no arbitrary changes)

---

## 14. Checkout Rules (CONFIRMED)

Server-side calculation only:

```
Subtotal + Shipping + Assembly - Discount + VAT = Total
```

Components configurable per business rules. Must use DB transactions:

Validate cart → validate products → validate stock → reserve stock → calculate → create order → create vendor orders → create items → create payment → commit

---

## 15. Payment Rules (CONFIRMED)

- `PaymentGatewayInterface` abstraction
- V1 methods: Mada, Card, Apple Pay (if gateway supports), Tabby (if approved)
- **Bank transfer NOT in initial scope**
- States: pending, paid, failed, partially_refunded, refunded
- Success via **verified webhooks only** — never trust frontend redirect alone

---

## 16. Finance Rules (CONFIRMED)

- **Ledger-oriented design** — no mutable balance without transaction history
- Transaction types: sale, platform_commission, affiliate_commission, refund, payout, escrow, escrow_release, adjustment
- Vendor balances: total revenue, pending/escrow, available, paid, history
- Escrow flow: Payment → Pending/Escrow → Release → Available → Payout
- Initial platform commission: **10%** — must be **configurable**, not hard-coded
- Commission hierarchy (future): Global → Category → Vendor → Product → Campaign

---

## 17. Payout Rules (CONFIRMED)

V1: Vendor requests payout → Admin processes → Ledger entry → Status tracked

---

## 18. Shipping Rules (CONFIRMED)

- V1: Calculated **per vendor** in checkout
- Architecture supports future: flat rate, weight, dimensions, distance, carrier API

---

## 19. Returns Rules (CONFIRMED)

- Policy hierarchy: Platform → Vendor → Product
- States: requested, under_review, approved, rejected, received, refunded, closed
- Refunds update: payment, order, ledger, vendor balance

---

## 20. Service Marketplace Rules (CONFIRMED)

- Categories: interior design, installation/maintenance, upholstery, architectural plans, transport, other
- Request: description, categories, budget, attachments (JPG/PNG/PDF, max 10MB), reference links
- Provider offer: price, message, optional quotation file
- **One accepted offer per request** → Booking → Payment → Service
- Provider marks complete → customer reviews

---

## 21. Reviews Rules (CONFIRMED)

- Product reviews: completed purchase only
- Service reviews: after service completion
- Admin moderation

---

## 22. Coupons Rules (CONFIRMED)

V1: Admin-controlled, cart-level focus

Fields: code, type, value, min order, max discount, dates, usage limit, active

---

## 23. Notifications Rules (CONFIRMED)

V1 simple in-app + email where appropriate. Queue via database jobs.

Events: registration, OTP, order created, payment success/failure, shipped, delivered, return update, offer received/accepted, booking created/completed

---

## 24. Chat Rules (CONFIRMED)

- V1: **Polling only** — no WebSockets/Reverb unless explicitly requested
- Conversations: Customer↔Vendor, Customer↔Provider, Customer↔Admin
- Schema must allow future WebSocket migration

---

## 25. Frontend Migration Rules (CONFIRMED)

- Do NOT delete existing UI
- Progressive replacement: mock → API contract → hooks → connect → remove mocks
- Every API page: loading, success, empty, error, unauthorized, forbidden states

---

## 26. Open Decisions (Require Confirmation)

| ID | Question |
|----|----------|
| OD-02 | Tabby BNPL approval timeline |
| OD-03 | Escrow release rules (time-based, delivery confirmation, manual) |
| OD-04 | Default role activation policy per role type |
| OD-05 | Assembly service: vendor-provided or platform-provided |
| OD-06 | VAT invoice format / ZATCA compliance requirements |
| OD-07 | Admin UI: Laravel Nova/Filament vs custom React admin |
| OD-08 | Marketer registration V1 scope vs V1.1 affiliate features |

### Resolved decisions

| ID | Decision |
|----|----------|
| OD-09 (formerly Laravel version) | **Laravel 13** — see ADR-001 |
| OD-01 | **Payment provider: MyFatoorah (Saudi Arabia)** — API `https://api-sa.myfatoorah.com/` — integration **DEFERRED** to Payments stage — see ADR-006 |
| OD-10 | **OTP/SMS provider: MSEGAT / مسجات (Saudi Arabia)** — integration **DEFERRED** to Stage 2 — see ADR-006 |
| OD-11 | **AI provider: OpenAI** (text + image generation) — integration **DEFERRED** to AI stage — see ADR-006 |

---

## 27. Intentionally Deferred Work (Not Forgotten)

The following are **assigned to future stages**, not open unknowns:

```text
PHPStan / Larastan
Authentication workflows
OTP / SMS integration (MSEGAT)
Roles / authorization workflows
Payment integration (MyFatoorah)
Orders, catalog, media
AI features (OpenAI)
Staging deployment
Production infrastructure
External provider adapter implementations
```

See `MASTER_DEVELOPMENT_PLAN.md` and `conception/API/providers/`.

---

## 28. Traceability

| Source | Document |
|--------|----------|
| UI prototype | `REPOSITORY_AUDIT.md`, prior `PROJECT_SPECIFICATION.md` |
| Business decisions | Product owner QCM (this document) |
| Architecture | `architecture/*.md`, `adr/*.md` |
