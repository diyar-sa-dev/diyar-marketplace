# DIYAR — Master Software Development Plan

> **Status:** REFERENCE — SUPERSEDED  
> **Use instead:** [MASTER_DEVELOPMENT_PLAN.md](./MASTER_DEVELOPMENT_PLAN.md) (v2.0, updated 2026-08-19)  
> **Current stage:** **Stage 15 — Vendor coupons** (working tree) · **Stage 13 — COMPLETE** · **Stage 14 — Review audit COMPLETE**  
> **Stage 13 docs:** [Stages/Stage 13/README.md](./Stages/Stage%2013/README.md)  
> **Previous:** Stage 12.5 — COMPLETE — [Stages/Stage 12.5/README.md](./Stages/Stage%2012.5/README.md)  
> **Tech baseline:** Laravel 13, MySQL, React 19

## 0. Engineering Strategy

The fundamental approach is:

```text
EXISTING REPOSITORY
        ↓
DISCOVERY
        ↓
ARCHITECTURE
        ↓
DATABASE
        ↓
API CONTRACT
        ↓
BACKEND FOUNDATION
        ↓
AUTHENTICATION
        ↓
COMMERCE
        ↓
FINANCE
        ↓
VENDOR
        ↓
SERVICES
        ↓
PLATFORM OPERATIONS
        ↓
FRONTEND INTEGRATION
        ↓
TESTING
        ↓
STAGING
        ↓
        V1
        ↓
        V1.1
        ↓
        V2
```

---

# STAGE 0 — DISCOVERY & ARCHITECTURE

### Objective

Turn the prototype into a technical contract before implementing business logic.

This stage is partially complete because we already performed the product discovery and resolved the major business rules.

## Phase 0.1 — Repository Audit

### Tasks

* Freeze current prototype branch/tag.
* Document current Git state.
* Inspect all routes.
* Inspect all pages.
* Inspect reusable components.
* Identify all mock data.
* Identify all simulated state.
* Identify all external image dependencies.
* Identify all forms.
* Identify all dashboard functionality.
* Identify all existing workflows.
* Identify unused dependencies.
* Identify existing CI/CD.
* Identify current build/lint behavior.

The repository currently has React 19, TypeScript, Vite, Tailwind, React Router, Recharts and other frontend dependencies, while backend/API/test directories are absent. 

### Deliverable

`docs/REPOSITORY_AUDIT.md`

---

## Phase 0.2 — Requirements Baseline

### Tasks

Create the final requirements document containing:

* product purpose
* actors
* roles
* V1 scope
* V1.1 scope
* V2 scope
* business rules
* commission rules
* order rules
* inventory rules
* service workflow
* authentication
* permissions
* notification requirements
* shipping rules
* payment requirements
* return rules
* unresolved external dependencies

### Important

The Decisions become the authoritative business baseline.

### Deliverable

`docs/REQUIREMENTS_BASELINE.md`

---

## Phase 0.3 — Domain Architecture

Define the domain modules.

## V1 core modules

```text
Identity
Users
Vendors
Providers
Catalog
Products
Categories
Inventory
Cart
Checkout
Orders
Payments
Finance
Shipping
Services
Reviews
Coupons
Notifications
Messaging
Admin
Media
```

Future modules:

```text
Loyalty
Affiliate
B2B
CMS
AI
Advanced Search
Mobile
```

### Tasks

* Define module boundaries.
* Define ownership.
* Define domain relationships.
* Define lifecycle states.
* Define cross-module dependencies.
* Define domain events where useful.
* Define which business rules belong to which module.

### Deliverable

`docs/DOMAIN_ARCHITECTURE.md`

---

## Phase 0.4 — System Architecture

Final target:

```text
                    ┌───────────────────┐
                    │   React SPA       │
                    │ React 19          │
                    │ TanStack Query    │
                    └─────────┬─────────┘
                              │ HTTPS
                              ↓
                    ┌───────────────────┐
                    │ Laravel 13 API    │
                    │ /api/v1           │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼──────────────────────┐
        ↓                     ↓                      ↓
   MySQL                  Laravel Cache          Storage
        │
        ↓
   Domain Modules
        │
        ├── Identity
        ├── Catalog
        ├── Cart
        ├── Orders
        ├── Finance
        ├── Services
        └── ...
```

This keeps the architecture as a **modular monolith**, rather than prematurely creating microservices. The original specification also recommended a monolithic Laravel API + React SPA as the pragmatic direction. 

### Deliverable

`docs/SYSTEM_ARCHITECTURE.md`

---

## Phase 0.5 — Architecture Decisions

Create ADRs for decisions such as:

* Laravel 13
* MySQL
* Sanctum
* REST `/api/v1`
* modular monolith
* Laravel Cache
* database queue initially
* storage abstraction
* dynamic commission engine
* financial ledger
* multi-vendor order/sub-order model
* configurable role activation
* simple polling chat
* AI as future service

### Deliverable

`docs/adr/`

---

## Phase 0.6 — API Contract

Before frontend integration, define:

```text
/api/v1/auth/*
/api/v1/products/*
/api/v1/categories/*
/api/v1/cart/*
/api/v1/checkout/*
/api/v1/orders/*
/api/v1/vendors/*
/api/v1/services/*
/api/v1/service-requests/*
/api/v1/payments/*
/api/v1/notifications/*
```

The original specification already proposed REST with `/api/v1/` and identified the major cart, checkout, order, service and dashboard endpoints.  

### Deliverables

* `docs/API_SPECIFICATION.md`
* OpenAPI specification

---

# STAGE 1 — ENGINEERING FOUNDATION

## Phase 1.1 — Laravel 13 Backend

### Tasks

* Create Laravel 13 project.
* Configure environment.
* Configure application URL.
* Configure API URL.
* Configure MySQL.
* Configure Sanctum.
* Configure storage.
* Configure mail.
* Configure queue.
* Configure cache.
* Configure logging.
* Configure CORS.
* Configure timezone.
* Configure locale.
* Configure API versioning.

---

## Phase 1.2 — Frontend Foundation

Refactor current frontend structure toward:

```text
src/
├── api/
├── types/
├── hooks/
├── context/
├── components/
├── features/
├── pages/
├── layouts/
├── routes/
├── utils/
└── lib/
```

The specification specifically identifies the current frontend's lack of API/service/type organization and recommends this evolution. 

### Tasks

* Axios client.
* API error interceptor.
* Query client.
* Environment variables.
* Shared API types.
* Route configuration.
* Error boundary.
* Toast system.
* Loading states.
* Empty states.
* Form validation.
* Remove unnecessary mock coupling.

---

## Phase 1.3 — Development Standards

Create:

* `.editorconfig`
* ESLint
* Prettier
* Laravel Pint
* PHPStan/Larastan if adopted
* commit conventions
* branch conventions
* PR rules
* environment documentation
* coding standards

---

## Phase 1.4 — CI

Pipeline:

```text
Push
 ↓
Install
 ↓
Lint
 ↓
Type check
 ↓
Backend tests
 ↓
Frontend tests
 ↓
Build
 ↓
Deploy staging
```

---

# STAGE 2 — IDENTITY & ACCESS

This is the first real business module.

## Phase 2.1 — User Model

Entities:

```text
users
roles
user_roles
```

Potential future:

```text
permissions
role_permissions
```

But V1 authorization remains simple role-based.

---

## Phase 2.2 — Registration

Flow:

```text
Registration
 ↓
Create Pending User
 ↓
OTP
 ↓
Phone verified
 ↓
Active
```

Phone is required; email optional.

---

## Phase 2.3 — Authentication

Implement:

* login by phone
* login by email
* password authentication
* logout
* session management
* Sanctum
* password reset
* OTP
* verification
* recovery

Your final decisions require phone-based recovery, with email recovery when a verified email exists.

---

## Phase 2.4 — Multi-role

User may have:

```text
Customer
Vendor
Provider
Marketer
```

Role activation policy should be configurable.

Initial configuration can activate roles directly, but the system must later support:

```text
Automatic
Pending approval
Document verification
Rejected
Suspended
```

---

## Phase 2.5 — Authorization

Implement:

* role middleware
* Laravel policies
* ownership checks
* vendor ownership
* provider ownership
* admin protection

### Acceptance

A Vendor cannot access another Vendor's products/orders/finance.

A Provider cannot access another Provider's bookings.

A Customer cannot access vendor and other roles dashboards .

Admin can operate platform resources.

---

# STAGE 3 — USER PROFILE & MEDIA

## Phase 3.1 — Profile

Implement:

* personal information
* phone
* email
* password
* profile image
* bio
* preferences

---

## Phase 3.2 — Addresses

CRUD:

```text
addresses
```

Support:

* shipping address
* default address
* multiple addresses

---

## Phase 3.3 — Media

Use Laravel filesystem abstraction.

Initially storage can be local, but code should not depend directly on local filesystem.

Support:

* profile image
* product images
* service attachments
* quotation files
* future chat attachments

The prototype already expects product images and service/request attachments, while its current implementation relies heavily on external placeholder URLs. 

---

# STAGE 4 — CATALOG & PRODUCTS

## Phase 4.1 — Categories

Entities:

```text
categories
category relationships
```

Tasks:

* CRUD
* hierarchy if required
* active/inactive
* ordering
* slug

---

## Phase 4.2 — Product Model

Product needs to support the fields demonstrated in your current UI:

```text
Product
├── vendor
├── category
├── name
├── description
├── sale price
├── comparison price
├── stock
├── dimensions
├── materials
├── warranty
├── colors
├── images
└── status
```

Your existing product UI specifically contains up to five images, colors, dimensions, materials, warranty and inventory fields.

---

## Phase 4.3 — Product CRUD

Vendor can:

* create
* view
* edit
* archive
* adjust quantity
* upload images
* define colors
* define warranty
* update pricing

Products are immediately publishable in V1 according to your decision.

---

## Phase 4.4 — Product Detail

Connect:

```text
/product/:id
```

to:

```text
GET /api/v1/products/{id}
```

Include:

* vendor
* product
* images
* price
* availability
* reviews
* related products

---

## Phase 4.5 — Storefront

Connect:

```text
/
 /category/*
 /product/*
 /store/*
 /search
```

to real APIs.

---

# STAGE 5 — INVENTORY

This deserves its own stage because marketplace inventory becomes dangerous when checkout is introduced.

## Phase 5.1 — Inventory Model

Support:

```text
stock_quantity
reserved_quantity
available_quantity
```

with:

```text
available =
stock - reserved
```

---

## Phase 5.2 — Manual Adjustments

Vendor can:

* add stock
* subtract stock
* adjust stock

Every adjustment should be auditable.

---

## Phase 5.3 — Reservation

Checkout:

```text
Customer checkout
       ↓
Reserve stock
       ↓
Payment
       ↓
Success → finalize
Failure → release
Timeout → release
```

Timeout must be configurable.

---

## Phase 5.4 — Out-of-stock behavior

Product-level configuration:

```text
OUT_OF_STOCK
PREORDER
```

If preorder:

* show preorder badge
* accept preorder
* optionally show expected availability date

---

# STAGE 6 — CART

## Phase 6.1 — Guest Cart

Support guest cart using session/device identity.

---

## Phase 6.2 — Authenticated Cart

Persist cart server-side.

---

## Phase 6.3 — Cart Merge

After login:

```text
Guest Cart
     +
User Cart
     ↓
Merge Rules
```

Handle duplicate products correctly.

---

## Phase 6.4 — Cart Validation

Before checkout:

* product active?
* price changed?
* stock available?
* preorder?
* vendor active?
* coupon valid?
* shipping possible?

---

# STAGE 7 — CHECKOUT & ORDER ENGINE

This is one of the most critical stages.

## Phase 7.1 — Checkout Preview

Calculate:

```text
Subtotal
+ Shipping
+ Assembly
- Discount
+ VAT
= Total
```

Nothing should be trusted from frontend calculations.

---

## Phase 7.2 — Multi-Vendor Order Split

Use:

```text
Order
 ├── VendorOrder A
 │    ├── items
 │    ├── shipping
 │    └── financials
 │
 └── VendorOrder B
      ├── items
      ├── shipping
      └── financials
```

The original architecture already identified this `Order → SubOrder → OrderItem` model. 

---

## Phase 7.3 — Order Creation

Transaction:

```text
BEGIN
 ↓
Validate cart
 ↓
Validate stock
 ↓
Reserve stock
 ↓
Calculate totals
 ↓
Create order
 ↓
Create vendor orders
 ↓
Create order items
 ↓
Create payment
 ↓
COMMIT
```

Payment processing should not leave partially-created orders.

---

## Phase 7.4 — Order State Machine

Separate:

### Order

```text
pending
confirmed
processing
completed
cancelled
```

### Vendor order

```text
pending
accepted
processing
shipped
delivered
cancelled
```

### Payment

```text
pending
authorized
paid
failed
partially_refunded
refunded
```

### Shipment

```text
pending
prepared
shipped
in_transit
delivered
failed
```

---

# STAGE 8 — PAYMENTS

Payment gateway remains an external dependency that must be selected before production. The original specification also identified gateway selection as an unresolved high-risk item. 

## Phase 8.1 — Gateway Abstraction

Do not let:

```text
Moyasar / HyperPay / Tap
```

spread throughout controllers.

Use:

```text
PaymentGatewayInterface
        ↓
Concrete Gateway
```

So the platform can change providers later.

---

## Phase 8.2 — Payment Creation

Support:

* Mada
* card
* Apple Pay where gateway supports it
* Tabby when approved/integrated

Your current final decision is that the architecture should support these, but actual provider capability determines implementation.

---

## Phase 8.3 — Webhooks

Implement:

```text
Payment initiated
 ↓
Gateway
 ↓
Webhook
 ↓
Verify signature
 ↓
Update payment
 ↓
Finalize order
 ↓
Release inventory reservation
 ↓
Financial ledger
 ↓
Notifications
```

Never trust frontend payment success alone.

---

# STAGE 9 — FINANCE & COMMISSION ENGINE

This is one of the most important architectural stages.

## Phase 9.1 — Financial Ledger

Create immutable-ish transaction records:

```text
financial_transactions
```

Types:

```text
sale
platform_commission
affiliate_commission
refund
payout
escrow
escrow_release
adjustment
```

---

## Phase 9.2 — Balances

Vendor dashboard:

```text
Total revenue
Pending / escrow
Available balance
Paid out
```

Affiliate architecture can later use the same financial foundation.

---

## Phase 9.3 — Commission Engine

Dynamic rules:

```text
Global
 ↓
Category
 ↓
Vendor
 ↓
Product
 ↓
Campaign
```

Initial V1 may use only the rules actually required.

Do not build the entire rule hierarchy unnecessarily.

---

## Phase 9.4 — Escrow

Your model supports:

```text
Paid
 ↓
Pending / Escrow
 ↓
Release
 ↓
Available Vendor Balance
```

The exact release trigger should be represented as configurable business logic.

---

## Phase 9.5 — Payouts

V1:

* vendor requests payout
* configurable minimum
* admin/manual processing initially if necessary
* ledger records payout

Future:

* automated scheduled payouts
* multiple payout methods
* provider-specific payout integrations

---

# STAGE 10 — SHIPPING

## Phase 10.1 — Shipping Domain

Start simple but scalable.

Entities:

```text
shipping_methods
shipping_rules
shipping_rates
shipments
tracking
```

---

## Phase 10.2 — V1 Rule

Shipping is calculated **per vendor sub-order**.

This means:

```text
Vendor A shipping = X
Vendor B shipping = Y
```

not one global shipping value.

---

## Phase 10.3 — Strategy abstraction

Architecture should allow:

```text
Flat rate
Weight
Dimensions
Distance
Carrier API
Admin-defined
```

without rewriting checkout.

---

# STAGE 11 — RETURNS & REFUNDS

## Phase 11.1 — Vendor Policies

Support:

* vendor policy
* product policy
* platform baseline

Your selected model is the most granular option:

```text
Platform
 ↓
Vendor
 ↓
Product
```

---

## Phase 11.2 — Return Request

Customer:

```text
Order
 ↓
Vendor Order
 ↓
Return Request
 ↓
Reason
 ↓
Evidence
 ↓
Review
 ↓
Approved / Rejected
```

---

## Phase 11.3 — Refund

Support:

* full refund
* partial refund
* item refund
* quantity refund
* vendor sub-order refund

This must update:

* payment
* order
* financial ledger
* vendor balance

---

# STAGE 12 — VENDOR PORTAL

## Phase 12.1 — Vendor Dashboard

Connect existing:

```text
/dashboard/vendor
/dashboard/vendor/orders
/dashboard/vendor/products
/dashboard/vendor/finance
/dashboard/vendor/settings
```

The prototype already defines these partner dashboard routes. 

---

## Phase 12.2 — Vendor Products

Complete:

* CRUD
* images
* inventory
* prices
* colors
* warranty
* dimensions
* product status

---

## Phase 12.3 — Vendor Orders

Vendor can:

* view orders
* filter
* accept/process
* ship
* mark delivered
* cancel according to rules

---

## Phase 12.4 — Vendor Finance

Display:

```text
Revenue
Commission
Pending
Available
Paid
Transactions
Payout requests
```

---

# STAGE 13 — SERVICE MARKETPLACE

## Phase 13.1 — Service Catalog

Support:

* service categories
* provider
* service description
* pricing mode
* availability
* location
* portfolio
* reviews

---

## Phase 13.2 — Customer RFQ

Customer creates:

```text
Service Request
├── categories
├── description
├── budget
├── attachments
└── reference links
```

---

## Phase 13.3 — Provider Offers

Provider submits:

```text
Offer
├── proposed price
├── message
├── quotation file
└── expiration
```

Multiple providers can submit offers.

Customer accepts **one**.

---

## Phase 13.4 — Booking

After acceptance:

```text
Offer
 ↓
Booking
 ↓
Payment
 ↓
Provider performs service
 ↓
Provider marks complete
```

Booking contains:

* date
* time
* location
* customer notes
* provider notes
* price
* payment state
* status

---

## Phase 13.5 — Service Payment

Use the same payment abstraction as commerce where possible.

Service-specific payment strategies remain configurable:

```text
Full
Deposit
Escrow
```

---

# STAGE 14 — REVIEWS

## Phase 14.1 — Product Reviews

Only verified customers who completed a relevant purchase should be able to review.

---

## Phase 14.2 — Service Reviews

Only relevant customers after service completion.

---

## Phase 14.3 — Moderation

Admin capability to:

* hide
* restore
* review abuse

---

# STAGE 15 — COUPONS

V1 simple admin-controlled coupons.

## Phase 15.1

Coupon:

```text
code
type
value
minimum order
maximum discount
start
end
usage limit
active
```

---

## Phase 15.2

V1 scope:

> Cart-level coupon.

Later:

* vendor
* category
* product
* campaign

---

# STAGE 16 — NOTIFICATIONS

V1:

* in-app
* email
* push where available

Important events:

```text
Registration
OTP
Order created
Payment success
Payment failed
Order shipped
Order delivered
Return updated
Service offer received
Offer accepted
Booking created
Booking completed
```

Use queued jobs where appropriate.

---

# STAGE 17 — CHAT

V1:

> **Simple polling**

Not WebSockets yet.

## Phase 17.1

Entities:

```text
conversations
conversation_participants
messages
message_attachments
```

## Phase 17.2

Support:

* Customer ↔ Vendor
* Customer ↔ Provider
* Customer ↔ Admin

Future:

```text
Polling
   ↓
Laravel Reverb/WebSockets
```

without changing the domain model.

---

# STAGE 18 — ADMIN / OPERATIONS

Your final V1 scope explicitly includes Admin.

This is important because the original prototype has no admin UI and the old specification therefore treated it as unresolved. 

## Phase 18.1 — Admin Foundation

Choose/build:

* Filament or custom internal admin
* Admin authentication
* Admin authorization

---

## Phase 18.2 — Admin Resources

Admin needs visibility/control over:

* users
* roles
* vendors
* providers
* products
* categories
* orders
* payments
* refunds
* commissions
* balances
* payouts
* coupons
* reviews
* service requests
* bookings
* notifications

---

## Phase 18.3 — Configuration

Admin should eventually configure:

* commission defaults
* role activation policy
* shipping rules
* coupon rules
* product statuses
* service settings
* payout minimum
* system settings

This is where your "make it dynamic" requirement becomes operational.

---

# STAGE 19 — FRONTEND MIGRATION

Only after backend contracts are stable should we systematically replace mocks.

## Phase 19.1

Replace:

```text
MOCK_PRODUCTS
MOCK_CART
MOCK_ORDERS
MOCK_REQUESTS
MOCK_OFFERS
...
```

with APIs.

The specification identifies mock data as a major integration risk and recommends defining shared API schemas first. 

---

## Phase 19.2 — Route Guards

Examples:

```text
/customer/*
 → authenticated customer

/dashboard/vendor/*
 → vendor role

/dashboard/service/*
 → provider role

/admin/*
 → admin
```

---

## Phase 19.3 — UI States

Every API page needs:

```text
Loading
Success
Empty
Error
Unauthorized
Forbidden
Maintence
```

---

# STAGE 20 — SECURITY

## Phase 20.1

Implement:

* validation
* authorization
* rate limiting
* CSRF where applicable
* secure cookies
* password hashing
* OTP throttling
* upload validation
* MIME verification
* file size limits
* signed/private files
* webhook signature verification

---

## Phase 20.2 — Marketplace security

Special attention:

* price manipulation
* stock manipulation
* coupon abuse
* IDOR
* vendor cross-access
* payout manipulation
* refund manipulation
* commission manipulation
* unauthorized order access

---

# STAGE 21 — TESTING

## Backend

### Unit

* commission calculation
* inventory reservation
* shipping calculation
* coupon calculation
* order splitting
* return/refund calculations

### Feature/API

* authentication
* products
* cart
* checkout
* payment
* orders
* vendor
* services
* reviews
* notifications

---

## Stage 21.2 — Frontend

Use:

* component tests
* integration tests

---

## Stage 21.3 — E2E

Critical flows:

### Customer

```text
Register
 ↓
Verify
 ↓
Browse
 ↓
Add product
 ↓
Checkout
 ↓
Pay
 ↓
View order
```

### Vendor

```text
Register
 ↓
Create product
 ↓
Receive order
 ↓
Process
 ↓
Ship
 ↓
View finance
```

### Services

```text
Customer RFQ
 ↓
Provider offer
 ↓
Accept
 ↓
Pay
 ↓
Booking
 ↓
Complete
```

---

# STAGE 22 — PERFORMANCE & HARDENING

Before production:

* database indexes
* pagination
* API response optimization
* eager loading
* N+1 detection
* cache appropriate catalog queries
* image optimization
* frontend lazy loading
* route code splitting
* API rate limits
* queue verification

Do **not** introduce Redis just because performance testing says "cache."

Start with Laravel Cache as you decided.

Introduce Redis when there is an actual operational reason.

---

# STAGE 23 — STAGING

Create:

```text
Development
     ↓
Staging
     ↓
Production
```

Staging must use:

* separate DB
* separate storage
* separate API credentials
* payment sandbox
* test email/SMS
* test domain

Never test real payment flows against production accidentally.

---

# STAGE 24 — PRODUCTION

Architecture can initially remain simple:

```text
Internet
   ↓
CDN / Reverse Proxy
   ↓
React SPA
   ↓
Laravel API
   ↓
MySQL
   ↓
Storage
```

Later:

```text
Load Balancer
 ↓
Laravel 1
Laravel 2
Laravel 3
 ↓
Managed DB
 ↓
Redis
 ↓
Queue Workers
```

The existing specification similarly recommends a single-server-capable V1 architecture with a scale path toward additional app servers, read replicas, search infrastructure and AI services. 

---

# STAGE 25 — V1 RELEASE

## Release checklist

### Functional

* [ ] Authentication
* [ ] Roles
* [ ] Customer
* [ ] Vendor
* [ ] Provider
* [ ] Admin
* [ ] Products
* [ ] Inventory
* [ ] Cart
* [ ] Checkout
* [ ] Payment
* [ ] Orders
* [ ] Shipping
* [ ] Returns
* [Reviews]
* [Coupons]
* [Services]
* [Bookings]
* [Chat]
* [Notifications]

### Technical

* [ ] API documented
* [ ] Tests passing
* [ ] Security review
* [ ] Database backup
* [ ] Logs
* [ ] Monitoring
* [ ] Error tracking
* [ ] HTTPS
* [ ] Production environment
* [ ] Payment sandbox → production
* [ ] Storage configured
* [ ] CI/CD working

---

# STAGE 26 — V1.1

After actual user feedback:

```text
V1.1
├── Loyalty
├── Advanced shipping
├── Advanced coupons
├── Improved notifications
├── Improved chat
├── Admin improvements
├── Advanced search
├── Additional payment methods
├── Better analytics
└── UX improvements
```

---

# STAGE 27 — V2

Your deferred intelligence/mobile roadmap:

```text
V2
├── AI Designer
├── Image Search
├── Python/FastAPI AI service
├── Mobile Flutter
├── Advanced personalization
├── Advanced search
└── Push/mobile-specific capabilities
```

The original prototype contains AI designer and image-search experiences, but they are currently simulations rather than real AI functionality, so keeping them out of V1 prevents the frontend mock from dictating an unnecessarily expensive architecture. 

---


# Dependency map

The most important dependencies are:

```text
Foundation
   ↓
Identity
   ↓
Users / Roles
   ↓
Catalog
   ↓
Products
   ↓
Inventory
   ↓
Cart
   ↓
Checkout
   ├──────────────→ Shipping
   │
   ├──────────────→ Coupons
   │
   └──────────────→ Payment
                         ↓
                       Orders
                         ↓
                       Finance
```

Separate branch:

```text
Identity
   ↓
Provider
   ↓
Services
   ↓
Service Requests
   ↓
Offers
   ↓
Booking
   ↓
Service Payment
```

Operations branch:

```text
Identity
   ↓
Admin
   ↓
Management of all domains
```

---

## Recommended repository documentation 


```text
docs/
│
├── PROJECT_SPECIFICATION.md
├── REQUIREMENTS_BASELINE.md
├── MASTER_DEVELOPMENT_PLAN.md
│
├── architecture/
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DOMAIN_ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_SPECIFICATION.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md
│
├── business/
│   ├── ORDER_RULES.md
│   ├── COMMISSION_RULES.md
│   ├── SHIPPING_RULES.md
│   ├── RETURN_RULES.md
│   └── SERVICE_RULES.md
│
├── adr/
│   ├── ADR-001-backend.md
│   ├── ADR-002-database.md
│   ├── ADR-003-authentication.md
│   ├── ADR-004-api.md
│   ├── ADR-005-financial-ledger.md
│   └── ...
│
└── runbooks/
    ├── LOCAL_SETUP.md
    ├── STAGING.md
    └── PRODUCTION.md
```
