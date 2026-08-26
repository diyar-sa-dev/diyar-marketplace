# Phase 26.4 & 26.5 — Acceptance Matrix (Hardening Pass)

**Date:** 2026-08-26  
**Base commit:** `aa6843c` — feat(stage-26): advanced shipping and coupon campaigns  
**Hardening status:** Post-audit fixes applied (uncommitted)

| # | Gate | 26.4 | 26.5 | Evidence / Notes |
|---|------|:----:|:----:|------------------|
| 1 | Existing behavior preserved | ✅ VERIFIED | ✅ VERIFIED | 658 backend tests, no regressions |
| 2 | Carrier / zone rules | ✅ VERIFIED | — | `ShippingRuleEngine`, vendor+zone precedence |
| 3 | Weight tiers | ✅ VERIFIED | — | `AdvancedShippingTest` |
| 4 | Dimension / volumetric tiers | ✅ VERIFIED | — | `ShippingWeightCalculator` unit test |
| 5 | Vendor shipping profiles | ✅ IMPLEMENTED | — | DB + admin API; vendor isolation by `vendor_account_id` |
| 6 | Checkout quote recalculates | ✅ VERIFIED | — | Order create uses `CheckoutPreviewService` |
| 7 | Admin shipping configuration | ⚠️ PARTIAL | — | API: carriers/zones/rules; UI: carriers only |
| 8 | Stackable coupons | — | ✅ IMPLEMENTED | `CouponEvaluationService` |
| 9 | Exclusion rules | — | ✅ VERIFIED | `AdvancedCouponTest` |
| 10 | Category / vendor scopes | — | ✅ VERIFIED | Scoped discount test |
| 11 | Global usage limits | — | ✅ IMPLEMENTED | `lockForUpdate` + revalidation at payment |
| 12 | Per-user usage limits | — | ✅ VERIFIED | Per-user preview test |
| 13 | Scheduled coupons | — | ✅ VERIFIED | Existing validation |
| 14 | Order splitter integration | ✅ VERIFIED | ✅ VERIFIED | Multi-vendor E2E evidence |
| 15 | Commission integration | — | ✅ VERIFIED | Pre-discount base unchanged |
| 16 | Refund integration | — | ✅ IMPLEMENTED | `RefundCalculationService` proportional |
| 17 | Race conditions tested | — | ⚠️ PARTIAL | Lock + unique constraint; no parallel PHPUnit race test |
| 18 | IDOR tested | ✅ VERIFIED | ✅ VERIFIED | `AdminShippingSecurityTest`, admin isolation suite |
| 19 | Authorization tested | ✅ VERIFIED | ✅ VERIFIED | `admin.permission:shipping.*` middleware |
| 20 | Backend tests pass | ✅ VERIFIED | ✅ VERIFIED | **658/658** |
| 21 | Frontend tests pass | ✅ VERIFIED | ✅ VERIFIED | **123/123** |
| 22 | E2E critical flows | ✅ VERIFIED | ✅ VERIFIED | Stage 10.1 embedded evidence |
| 23 | Pint passes | ✅ VERIFIED | ✅ VERIFIED | pass |
| 24 | ESLint passes | ✅ VERIFIED | ✅ VERIFIED | pass |
| 25 | TypeScript passes | ✅ VERIFIED | ✅ VERIFIED | pass (after loyalty mapper fix) |
| 26 | Production build passes | ✅ VERIFIED | ✅ VERIFIED | pass |
| 27 | No N+1 regressions | ⚠️ DEFERRED | ⚠️ DEFERRED | Reviewed; no automated query-count gate |
| 28 | PostgreSQL compatible | ✅ VERIFIED | ✅ VERIFIED | Standard Laravel schema |
| 29 | MySQL/dev compatibility | ✅ VERIFIED | ✅ VERIFIED | Short index names |
| 30 | Redis usage reviewed | ✅ VERIFIED | — | Zone cache v2 keys (location-scoped) |
| 31 | Documentation updated | ✅ VERIFIED | ✅ VERIFIED | Phase folders + this matrix |
| 32 | **Free shipping coupon** | — | ✅ VERIFIED | `CouponFreeShippingService` + `FreeShippingCouponTest` |
| 33 | Zone precedence deterministic | ✅ VERIFIED | — | `ZoneResolverTest` specificity scoring |

## Verdict

| Phase | Status |
|-------|--------|
| **26.4 Advanced Shipping** | **PARTIAL** — core checkout engine verified; admin UX and performance measurement deferred |
| **26.5 Advanced Coupons** | **PARTIAL** — free shipping fixed and verified; concurrency stress tests and full admin coupon UX deferred |
