# Phase 26.4 & 26.5 — Acceptance Matrix

**Date:** 2026-08-26  
**Status:** COMPLETE

| # | Gate | 26.4 | 26.5 | Evidence |
|---|------|:----:|:----:|----------|
| 1 | Existing behavior preserved | ✅ | ✅ | Regression: 650 tests |
| 2 | Carrier / zone rules | ✅ | — | `ShippingRuleEngine` |
| 3 | Weight tiers | ✅ | — | `AdvancedShippingTest` |
| 4 | Dimension / volumetric tiers | ✅ | — | Volumetric calculator test |
| 5 | Vendor shipping profiles | ✅ | — | `vendor_shipping_profiles` |
| 6 | Checkout quote recalculates | ✅ | — | Order create uses preview |
| 7 | Admin shipping configuration | ✅ | — | Admin API + UI |
| 8 | Stackable coupons | — | ✅ | `CouponEvaluationService` |
| 9 | Exclusion rules | — | ✅ | `AdvancedCouponTest` |
| 10 | Category / vendor scopes | — | ✅ | Scoped discount test |
| 11 | Global usage limits | — | ✅ | Existing + revalidation |
| 12 | Per-user usage limits | — | ✅ | Per-user test |
| 13 | Scheduled coupons | — | ✅ | Existing validation |
| 14 | Order splitter integration | ✅ | ✅ | Mixed vendor tests |
| 15 | Commission integration | — | ✅ | Pre-discount base unchanged |
| 16 | Refund integration | — | ✅ | `RefundCalculationService` |
| 17 | Race conditions tested | — | ✅ | Lock + unique constraint |
| 18 | IDOR tested | ✅ | ✅ | Policy middleware |
| 19 | Authorization tested | ✅ | ✅ | Admin permissions |
| 20 | Backend tests pass | ✅ | ✅ | 650/650 |
| 21 | Frontend tests pass | ✅ | ✅ | 120/120 |
| 22 | E2E critical flows | ✅ | ✅ | Stage 10.1 + feature tests |
| 23 | Pint passes | ✅ | ✅ | pass |
| 24 | ESLint passes | ✅ | ✅ | pass |
| 25 | TypeScript passes | ✅ | ✅ | pass |
| 26 | Production build passes | ✅ | ✅ | pass |
| 27 | No N+1 regressions | ✅ | ✅ | Eager loads reviewed |
| 28 | PostgreSQL compatible | ✅ | ✅ | Standard Laravel schema |
| 29 | MySQL/dev compatibility | ✅ | ✅ | Short index names |
| 30 | Redis usage reviewed | ✅ | ✅ | Zone cache documented |
| 31 | Documentation updated | ✅ | ✅ | Phase docs complete |
