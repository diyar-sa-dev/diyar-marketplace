# Phase 28.1 — Test Coverage Matrix

**Date:** 2026-08-27  
**Commit:** `92638a9`  
**Legend:** YES = automated coverage exists · PARTIAL = some paths · NO = not found · NOT VERIFIED = not executed in 28.1

---

## Summary counts

| Layer | Files | Tests (measured) | Baseline result |
|-------|-------|------------------|-----------------|
| PHPUnit Feature | 128 | ~717 (732 total − 15 unit) | 1 error |
| PHPUnit Unit | 15 | ~15 | included above |
| Vitest | 25 | 124 | PASS |
| Playwright | 15 specs | 39 | 33 PASS / 3 FAIL / 3 skipped |
| k6 scripts | 4 | N/A (infra) | NOT RUN in 28.1 |

---

## Domain matrix

| Domain | PHPUnit (Feature) | Vitest | Playwright E2E | Security tests | Load (k6) | Status | Known gaps |
|--------|-------------------|--------|----------------|----------------|-------------|--------|------------|
| **Authentication** | YES — `Api/V1/Auth/*`, `Admin/*` | PARTIAL — `AuthContext.test.tsx` | YES — `auth-isolation`, journeys | PARTIAL — `RateLimitingTest` | NO | PARTIAL | OTP abuse matrix incomplete (Phase 28.6) |
| **Users / Roles / Admin** | YES — `Admin/*`, `AdminIsolationTest` | PARTIAL — `roles.test.ts` | YES — `admin-journey` | PARTIAL — admin isolation | NO | PARTIAL | — |
| **Catalog / Products** | YES — `Catalog/ProductTest`, search | PARTIAL — mappers | YES — `customer-journey` | PARTIAL | YES — smoke search/products | PASS domain | — |
| **Categories** | YES — catalog tests | NO | PARTIAL — category page via home | NO | NO | PARTIAL | — |
| **Cart** | YES — `Cart/CartTest` | YES — `useCart.test.ts` | PARTIAL — cart sidebar | NO | NO | PASS | — |
| **Checkout / Orders** | YES — checkout, order creation | PARTIAL — coupon errors | PARTIAL — customer journey | PARTIAL — concurrency | NO | PARTIAL | Full checkout E2E limited (README Stage 21) |
| **Payments** | YES — `Payment/*`, webhooks | NO | NO dedicated E2E | PARTIAL — idempotency tests | NO | PARTIAL | Webhook replay matrix Phase 28.6 |
| **Finance / Payouts** | YES — vendor finance feature tests | NO | NO | NO | NO | PARTIAL | — |
| **Shipping** | YES — extensive `Shipping/*` | NO | YES — `admin-shipping` | YES — `AdminShippingSecurityTest` | NO | PARTIAL | 1 PHPUnit unit error (weight limit) |
| **Returns / Refunds** | YES — `Returns/*` | NO | NO | PARTIAL — idempotency | NO | PARTIAL | — |
| **Coupons** | YES — `Coupon/*` | PARTIAL — checkout coupon | NO | PARTIAL — concurrency | NO | PASS | — |
| **Services / RFQ** | YES — `ServiceMarketplace/*` | PARTIAL | YES — `provider-journey`, customer services | NO | NO | PARTIAL | — |
| **Bookings** | YES — direct booking tests | NO | PARTIAL | NO | NO | PARTIAL | — |
| **Reviews** | YES — store/product/provider/B2B reviews | PARTIAL | NO | NO | NO | PARTIAL | — |
| **Notifications** | YES — `Notifications/*` | NO | YES — `messaging.spec` | NO | NO | PARTIAL | — |
| **Chat** | YES — `Chat/*`, admin oversight | NO | YES — messaging, admin chat | PARTIAL — moderation | NO | PARTIAL | Realtime delivery NOT VERIFIED in E2E |
| **Affiliate** | YES — affiliate feature tests | NO | NO | NO | NO | PARTIAL | — |
| **B2B** | YES — `B2b/*` | YES — B2B pages | YES — `b2b`, `b2b-admin` | PARTIAL — company security | NO | **FAIL E2E** | Dev DB seed mismatch; admin draft test fails |
| **Loyalty** | YES — `Loyalty/*` | YES — `LoyaltyPage.test.tsx` | YES — `loyalty.spec` | NO | NO | PASS (local) | CI was flaky historically |
| **Blog / CMS** | YES — `Blog/*`, admin blog | YES — blog pages | YES — `blog`, `blog-admin` | YES — `BlogSecurityTest` | NO | **FAIL E2E** (blog public) | E2E article missing in dev DB |
| **Projects / CMS** | YES — `Projects/*` | NO | **FAIL** — `projects.spec` | YES — `ProjectSecurityTest` | NO | FAIL E2E | Modal blocks click — test/UI |
| **Analytics** | YES — `Analytics/*` | NO | YES — `analytics.spec` | NO | YES — `analytics.js` smoke | PASS | k6 p95 ~2s CI — not a functional fail |
| **Platform / Health** | YES — health, readiness, live | NO | YES — `maintenance.spec` | NO | YES — health in smoke | PASS | — |
| **Maintenance mode** | YES — middleware tests | NO | YES — `maintenance.spec` | NO | NO | PASS | — |
| **Uploads / Media** | PARTIAL | NO | NO | YES — `UploadSecurityTest` | NO | PARTIAL | — |
| **Wishlist** | YES — blog/service wishlist | NO | YES — indirect | NO | NO | PARTIAL | — |
| **Vendor dashboard** | YES — dashboard tests | NO | YES — `vendor-journey` | NO | NO | PASS | — |
| **Provider dashboard** | YES — provider tests | NO | YES — `provider-journey` | NO | NO | PASS | — |
| **AI / Assistant** | NOT VERIFIED | NO | NO | NO | NO | NOT TESTED | Route exists — coverage unknown |
| **i18n / RTL** | PARTIAL | YES — translate tests | PARTIAL — locale ar-SA | NO | NO | PARTIAL | Visual RTL audit NOT VERIFIED |

---

## Playwright spec inventory

| Spec file | Tests | Journeys covered |
|-----------|-------|------------------|
| `admin-journey.spec.ts` | 2 | Admin login, dashboard, isolation |
| `admin-shipping.spec.ts` | 1 | Admin shipping config |
| `analytics.spec.ts` | 5 | Vendor/provider/admin analytics |
| `auth-isolation.spec.ts` | 6 | Dual session UI + API |
| `b2b.spec.ts` | 2 | Public B2B directory, RFQ guest gate |
| `b2b-admin.spec.ts` | 4 | Admin B2B publish, RFQ (serial) |
| `blog.spec.ts` | 1 | Public blog |
| `blog-admin.spec.ts` | 1 | Admin blog CRUD |
| `customer-journey.spec.ts` | 3 | Browse, login, services |
| `loyalty.spec.ts` | 2 | Guest + authenticated loyalty |
| `maintenance.spec.ts` | 2 | Health + admin maintenance UI |
| `messaging.spec.ts` | 3 | Chat reports, notifications, chat |
| `projects.spec.ts` | 1 | Sidebar projects modal |
| `provider-journey.spec.ts` | 3 | Provider dashboard/services |
| `vendor-journey.spec.ts` | 3 | Vendor dashboard/products/orders |

**Total:** 39 tests (measured run)

---

## k6 script matrix

| Script | Journey | Auth | Peak VUs | Duration | Thresholds |
|--------|---------|------|----------|----------|------------|
| `smoke.js` | Catalog browse | No | 100 | ~100s | p95<1500ms, fail<5% |
| `profiles.js` | Catalog (profile env) | No | 10–25000 | varies | profile-specific |
| `analytics.js` | Admin/vendor/provider analytics | Yes (session) | 20 | 60s | p95<3000ms, fail<10% |
| `common.js` | Helpers | — | — | — | — |

**25K profile:** defined, **NOT VERIFIED**

---

## PHPUnit Feature folder map (top-level)

| Directory | Domain |
|-----------|--------|
| `Api/V1/Auth` | Authentication |
| `Api/V1/Cart`, `Checkout`, `Coupon` | Commerce |
| `Api/V1/Payment` | Payments |
| `Api/V1/Shipping` | Shipping |
| `Api/V1/Returns` | Returns |
| `Api/V1/B2b`, `Blog`, `Projects` | B2B, CMS |
| `Api/V1/Analytics` | Analytics |
| `Api/V1/ServiceMarketplace` | Services |
| `Api/V1/Admin` | Admin ops |
| `Chat`, `Notifications`, `Loyalty` | Messaging & loyalty |
| `Security` | Security |
| `Admin` | Admin SPA auth |

---

## Test suite quality notes (Phase 28.1)

| Finding | Evidence |
|---------|----------|
| PHPUnit does **not** exercise Redis | `phpunit.xml`: `CACHE_STORE=array`, `QUEUE_CONNECTION=sync` |
| CI backend job does **not** use Redis extension path for app tests | `ci.yml` backend: pdo_sqlite only |
| E2E CI **does** use Redis | bootstrap + Redis service |
| Auth uses Sanctum stateful — tests use `postStatefulJson` pattern | `InteractsWithIdentity` trait |
| Concurrency partially tested | `PaymentConcurrencyTest`, `CouponConcurrencyTest` |
| Idempotency partially tested | `RefundIdempotencyTest` |
| Load at 25K VUs | **NOT VERIFIED** |
