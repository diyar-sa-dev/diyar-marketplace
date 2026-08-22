# Stage 18 — Entry Audit

**Date:** 2026-08-22  
**Auditor:** Senior engineering agent (pre-implementation)  
**Rule:** Repository implementation is the source of truth over documentation.

---

## 1. Executive Summary

DIYAR V1 marketplace backend (Laravel 13 / PHP 8.3) and frontend (React / Vite / TypeScript) are **functionally complete through Stages 16, 17, and 17.6** per `conception/PLAN.md` and recent commits. **Stage 18 — Admin / Operations does not exist in code.** There is no Filament installation, no `/admin` panel, no admin UI, no `SystemSetting` table, and no admin audit log infrastructure.

What exists today is a **minimal JSON admin API** under `/api/v1/admin/*` (categories CRUD + vendor/affiliate payout state transitions) and **role-based access** where `admin` users can also enter vendor/provider/affiliate React dashboards via `ProtectedRoute`.

Stage 18 must **extend** this foundation with a Filament internal panel, comprehensive operational resources, database-backed runtime configuration, and audit logging — without duplicating domain services or bypassing state machines.

---

## 2. Git Baseline

| Item | Value |
|------|-------|
| Branch | `dev` (tracking `origin/dev`) |
| HEAD | `b66e058` — `fix(ci): Payment Controller import` |
| Stage completion commits | `207b76c` (Stages 16–17.6), `28503cd` (13–15), `d14203e` (6–12), `74862a5` (4–5.5), etc. |

### Uncommitted work (not in Stage 18 scope until merged)

37 modified files + 7 untracked files, primarily:

- Affiliate traffic-source tracking (migration, resolver, click attribution)
- Affiliate platform config service + API endpoint
- Frontend affiliate/home localization, dashboard colors, footer
- Hero/Sections polish

**Risk:** Stage 18 implementation should start from a clean baseline or explicitly include this WIP in the audit branch.

---

## 3. Technology Stack (Verified)

| Layer | Version / Stack |
|-------|-----------------|
| PHP | `^8.3` (`composer.json`) |
| Laravel | `^13.17` |
| Frontend | React + Vite + TypeScript |
| Auth | Laravel Sanctum (session/cookie API) |
| Realtime | Laravel Reverb |
| Payments | MyFatoorah (+ fake gateway in local/test) |
| Admin UI | **None** — Filament **not installed** |
| Tests | PHPUnit 12, ~73 Feature test files |

### Filament compatibility note

Filament is **not** in `composer.json`. Before Phase 18.1 install, verify the **latest Filament major version officially supporting Laravel 13** on [filamentphp.com/docs](https://filamentphp.com). Do **not** downgrade Laravel. Filament panel lives at `/admin` (separate from React SPA).

---

## 4. What Is Actually Implemented vs Documented

### 4.1 Admin / Operations

| Capability | Documented (PLAN / API_SPEC) | Actually implemented |
|------------|------------------------------|---------------------|
| Admin UI (Filament/Nova) | Stage 18 planned | ❌ None |
| `/admin` web panel | Planned | ❌ None |
| Admin user management | Planned | ❌ No admin API |
| Admin vendor approval | API spec mentions | ⚠️ Vendor onboarding via registration; no dedicated admin approve API found |
| Admin provider approval | API spec mentions | ⚠️ Same as vendors |
| Admin categories CRUD | Stage 4 | ✅ `/api/v1/admin/categories/*` |
| Admin vendor payouts | Stage 9 | ✅ approve / reject / mark-paid |
| Admin affiliate payouts | Stage 17.6 | ✅ full lifecycle endpoints |
| Admin orders list | API spec | ❌ Not implemented |
| Admin refunds | API spec | ❌ Not implemented |
| Admin settings | API spec | ❌ Not implemented |
| Admin review moderation | API spec | ❌ Not implemented |
| Runtime DB settings | Stage 18 requirement | ❌ Not implemented |
| Admin audit log | Stage 18 requirement | ❌ Not implemented |
| Feature flags | Stage 18 requirement | ❌ Not implemented |

### 4.2 Admin access pattern today

- **Backend:** `Route::middleware('role:admin')->prefix('admin')` — coarse role gate only.
- **Frontend:** `RoleName.Admin` included in `ProtectedRoute` for vendor/service/affiliate dashboard routes — admins use **the same React dashboards** as operators, not a dedicated admin app.
- **Policies:** 11 policy classes exist (Product, Order, Category, VendorAccount, etc.) — used by API/dashboard, not Filament yet.
- **Permissions:** Vendor team uses `VendorTeamPermissions` matrix; **no granular admin permission table** (e.g. `users.view`).

---

## 5. Existing Admin API Inventory

**Prefix:** `/api/v1/admin` (requires authenticated user with `admin` role)

| Method | Route | Controller | Domain service |
|--------|-------|------------|----------------|
| GET | `/categories` | `CategoryController@index` | `CategoryService` |
| POST | `/categories` | `CategoryController@store` | `CategoryService` |
| GET | `/categories/{category}` | `CategoryController@show` | `CategoryService` |
| PATCH | `/categories/{category}` | `CategoryController@update` | `CategoryService` |
| DELETE | `/categories/{category}` | `CategoryController@destroy` | `CategoryService` |
| GET | `/payouts` | `AdminPayoutController@index` | `PayoutService` |
| POST | `/payouts/{payout}/approve` | `AdminPayoutController@approve` | `PayoutService` |
| POST | `/payouts/{payout}/reject` | `AdminPayoutController@reject` | `PayoutService` |
| POST | `/payouts/{payout}/mark-paid` | `AdminPayoutController@markPaid` | `PayoutService` |
| GET | `/affiliate/payouts` | `AdminAffiliatePayoutController@index` | `AffiliateAdminPayoutService` |
| POST | `/affiliate/payouts/{id}/approve` | … | … |
| POST | `/affiliate/payouts/{id}/processing` | … | … |
| POST | `/affiliate/payouts/{id}/reject` | … | … |
| POST | `/affiliate/payouts/{id}/mark-paid` | … | … |

**Tests:** `CategoryAdminTest.php`, payout flows in `FinancialLedgerTest`, `FinancialStage95AuditTest`, `AffiliateCommerceTest`.

---

## 6. Domain Inventory (Repository)

### 6.1 Models (~80)

Core commerce: `User`, `Role`, `UserRole`, `VendorAccount`, `ProviderAccount`, `Product`, `Category`, `ProductInventory`, `InventoryMovement`, `InventoryReservation`, `Cart`, `CartItem`, `Order`, `OrderItem`, `VendorOrder`, `Payment`, `PaymentAttempt`, `Refund`, `ReturnRequest`, `Shipment`, `VendorCoupon`, `CommissionRule`, `FinancialTransaction`, `VendorPayout`, `ProviderPayout`.

Services marketplace: `Service`, `ServiceCategory`, `ServiceRequest`, `ServiceOffer`, `ServiceBooking`, `ServiceBookingPayment`, `ProviderReview`, `ProductReview`, `StoreReview`.

Affiliate: `AffiliateProfile`, `AffiliateLink`, `AffiliateClick`, `AffiliateAttribution`, `AffiliateCommission`, `AffiliatePayout`, `ProductAffiliateSetting`.

Chat/notifications: `Conversation`, `Message`, `UserNotification`, `NotificationDelivery`, `NotificationDevice`.

**Missing for Stage 18:** `SystemSetting`, `AdminAuditLog`, `FeatureFlag` (or equivalents).

### 6.2 Services (~121)

Authoritative domain services exist and **must be reused** by Filament actions:

- **Catalog:** `CategoryService`, `InventoryService`, `ProductService`
- **Cart/checkout:** `CartService`, `CheckoutPreviewService`, `OrderCreationService`
- **Orders:** `OrderStateService`, `VendorOrderFulfillmentService`
- **Payments:** `PaymentFinalizationService`, `PaymentWebhookService` patterns
- **Finance:** `PayoutService`, `VendorBalanceService`, `CommissionResolver`, ledger via `FinancialTransaction`
- **Returns:** `ReturnEligibilityService`, `RefundCalculationService`, reversal listeners
- **Affiliate:** `AffiliateAttributionService`, `AffiliateCommissionService`, `AffiliatePayoutService`, `AffiliatePlatformConfigService` (env-only today)
- **Services:** `ServiceRequestService`, `ServiceOfferService`, `ServiceBookingService`, `ProviderPayoutService`
- **Coupons:** `VendorCouponManagementService`
- **Notifications:** `NotificationService`
- **Chat:** `ConversationService`, `ChatAuthorizationService`

### 6.3 Configuration (`config/diyar.php`)

Business values currently controlled by **environment variables** with config defaults:

| Group | Examples | Runtime DB override |
|-------|----------|---------------------|
| `affiliate.*` | min/max commission %, attribution days, payout minimum | ❌ Env only (recent `AffiliatePlatformConfigService` reads config) |
| `finance.*` | payout minimum, escrow trigger, currency | ❌ Env only |
| `inventory.*` | reservation timeout | ❌ Env only |
| `cart.*` | max quantity | ❌ Env only |
| `tax.*` | VAT rate | ❌ Env only |
| `shipping.*` | default flat rate | ❌ Env only |
| `payments.*` | gateway, session expiry | ❌ Env only (secrets stay in env) |
| `services.*` | commission rate, booking duration | ❌ Env only |
| `otp.*`, `auth.*` | security thresholds | ❌ Env only (correct) |

**Stage 18.3 must introduce:** DB → cache → effective config layer without `.env` mutation from browser.

### 6.4 Migrations

**67 migration files** under `backend/database/migrations/`. UUID primary keys, soft deletes on key entities, financial ledger tables present.

### 6.5 Frontend

- **Public + role dashboards:** React SPA at `/`, `/dashboard/vendor/*`, `/dashboard/service/*`, `/dashboard/affiliate/*`
- **No admin routes** in `App.tsx` beyond `RoleName.Admin` piggybacking on other portals
- **Localization:** `en.ts` / `ar.ts` with RTL support — pattern to mirror in Filament

---

## 7. Stage Folder Reconstruction

| Stage | Folder in `conception/Stages/` | Completion evidence | Admin relevance |
|-------|-------------------------------|-------------------|-----------------|
| 0 | ✅ `Stage 0/` (1 file) | Discovery complete | Config/module visibility |
| 1 | ✅ `Stage 1/` | Engineering foundation | Health, queues, version |
| 2 | ✅ `Stage 2/` | Identity, RBAC, OTP | **Users, roles, security** |
| 3 | ✅ `Stage 3/` | Profile, media, addresses | User inspection, moderation |
| 4 | ✅ `Stage 4/` | Catalog, categories | **Categories admin API exists** |
| 5 | ✅ `Stage 5/` | Inventory | **Inventory adjustments via service** |
| 5.5 | ✅ `Stage 5.5/` | Storefront integration | Visibility, homepage (mostly static UI) |
| 6 | ✅ `Stage 6/` | Cart | Read-only ops visibility |
| 7 | ✅ `Stage 7/` | Checkout, orders | **Order state via OrderStateService** |
| 8 | ✅ `Stage 8/` | Payments | Payment inspection, no raw card data |
| 9 | ✅ `Stage 9/` | Finance, commissions, payouts | **Vendor payout admin API** |
| 9.5 | ✅ `Stage 9.5/` | Financial audit hardening | Ledger reconciliation |
| 10 | ✅ `Stage 10/` | Shipping | Vendor shipping settings, shipments |
| 11 | ⚠️ `Stage 11/` (2 files only) | Returns/refunds implemented in code | Refund domain services exist |
| 12 | ✅ `Stage 12/` | Vendor portal | Vendor accounts, products, orders |
| 12.5 | ✅ `Stage 12.5/` | Email, engagement | Notifications prefs |
| 13 | ✅ `Stage 13/` | Provider portal | Providers, RFQ, bookings |
| 14 | ✅ `Stage 14/` | Production readiness | Health, deployment docs |
| 15 | ✅ `Stage 15/` | Vendor coupons | Coupon management |
| 16 | ✅ `Stage 16/` | Notifications | Notification inspection |
| 17 | ✅ `Stage 17/` | Chat | Conversation moderation |
| 17.6 | ✅ `Stage 17.6/` | Affiliate commerce | **Affiliate payout admin API** |
| 18 | ❌ **Not found** (created by this audit) | — | **This stage** |
| 19+ | Referenced in PLAN only | Frontend migration | Out of Stage 18 scope |

---

## 8. Security Boundaries (Existing)

| Area | Current state |
|------|---------------|
| Authentication | Sanctum + session cookies, OTP registration |
| Role middleware | `role:admin`, `role:vendor`, etc. |
| IDOR | Extensive Feature tests (ProductIdor, OrderAuthorization, ReturnAuthorization) |
| Financial | State transitions via services; ledger append-only pattern |
| Payment secrets | Env/config; not exposed in API resources |
| Admin payout actions | Tested; idempotency concerns documented in Stage 9.5 tests |
| Impersonation | **Not implemented** (correct — do not add silently) |

**Gaps for Stage 18:** granular admin permissions, admin audit trail, Filament CSRF/session hardening review, bulk action authorization.

---

## 9. Duplication / Inconsistency Findings

| Issue | Detail |
|-------|--------|
| Admin UI split | API spec describes broad admin; only categories + payouts implemented |
| Admin UX | Admins use React vendor/provider/affiliate dashboards — not operational control center |
| Config source | `config/diyar.php` + env; recent affiliate platform hints read env via API — **not yet DB-backed** (Phase 18.3) |
| Documentation drift | `PROJECT_SPECIFICATION.md` still says admin "NOT YET"; PLAN.md marks Stage 18 as next |
| Stage metadata in config | `DIYAR_STAGE` env still says "Stage 3" in defaults — cosmetic drift |
| No Filament | PLAN allows Filament or custom — **prompt mandates Filament** |

---

## 10. What Admin Must NOT Control (Confirmed)

- Raw `.env` / secret editing from browser
- Passwords, OTP secrets, tokens, payment credentials
- Direct `order.status = …` or balance field overwrites
- Silent user impersonation
- Arbitrary CSS/JS injection via settings
- Business rules not defined in domain (new commission formulas, new refund rules)

---

## 11. Reuse vs Build Decisions (Preliminary)

| Build new | Extend existing |
|-----------|-----------------|
| Filament `AdminPanelProvider` | All domain `*Service` classes |
| `SystemSetting` model + service | `CategoryController` logic → Filament Category resource |
| `AdminAuditLog` + listener | `PayoutService`, `AffiliateAdminPayoutService` |
| Filament DIYAR theme (colors, RTL) | Existing `CategoryPolicy`, `OrderPolicy`, etc. |
| Permission middleware for Filament | Existing admin payout routes (can delegate from Filament) |
| Settings cache layer | `config/diyar.php` structure as schema reference |

**Do not create:** `AdminOrderService`, `AdminProductService` unless thin Filament adapters wrapping existing services.

---

## 12. Test Coverage Baseline

- **~73 Feature test files** covering auth, catalog, cart, checkout, payments, finance, returns, shipping, services, chat, notifications, affiliate
- **Admin-specific:** `CategoryAdminTest` + payout tests embedded in finance/affiliate suites
- **Stage 18 will need:** Filament auth tests, resource authorization, settings validation, audit logging, IDOR regression

---

## 13. Recommended Implementation Order

See [STAGE_18_PLAN.md](./STAGE_18_PLAN.md). **Do not install Filament until this audit is reviewed.**

1. Phase 18.1 — Filament + auth + theme + audit foundation  
2. Phase 18.2 Tier 1 — Users, vendors, providers, products, categories, orders, payments, finance  
3. Phase 18.2 Tier 2 — Coupons, reviews, services, affiliate ops, inventory, shipping  
4. Phase 18.3 — Runtime settings + feature flags + effective config integration  

---

## 14. Open Questions for Product Owner

| # | Question | Resolution |
|---|----------|------------|
| Q1 | Single `admin` role vs split Operations/Finance/Content admin roles in V1? | **Resolved:** `admin` role gate + granular permissions seeded; split roles deferred |
| Q2 | Should existing `/api/v1/admin/*` remain for automation, with Filament calling same services? | **Yes** — retain API; Filament uses domain services directly |
| Q3 | Vendor/provider approval workflow — pending status today? | **Audited:** Vendor enum has `pending` but registration sets `active`; provider has no pending. No approval workflow — Phase 18.2 exposes suspend/activate only; approval deferred |
| Q4 | Priority of theme/CMS settings vs operational resources in 18.2 Tier 3? | Open |
| Q5 | Merge uncommitted affiliate WIP before Stage 18 branch? | **Resolved:** committed (`0a16d23`) |

---

## 15. Audit Verdict

```text
Stage 18 — IN PROGRESS
Phase 18.1 — COMPLETE / VERIFIED
Phase 18.2 — NEXT (Admin resources)
Audit — COMPLETE (updated 2026-08-22)
```

**Critical path:** Install Filament compatible with Laravel 13 → wire Sanctum/session auth for panel → map existing policies → build Tier 1 resources calling domain services → add settings + audit in Phase 18.3.
