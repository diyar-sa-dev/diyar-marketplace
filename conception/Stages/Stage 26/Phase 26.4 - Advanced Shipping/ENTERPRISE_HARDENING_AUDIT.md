# Stage 26.4 / 26.5 — Enterprise Hardening Audit

**Date:** 2026-08-26  
**Scope:** Post-`aa6843c` enterprise hardening pass

## Summary

Hardening focused on correctness, security, performance bounds, and admin operability without rewriting the V1-compatible architecture.

## Implemented & Verified

| Area | Status |
|------|--------|
| Free shipping coupons (server-side waiver) | VERIFIED |
| Zone resolution v3 (specificity + versioned cache) | VERIFIED |
| Rate rule precedence (vendor/zone/band narrowness) | VERIFIED |
| Admin shipping CRUD API (carriers/zones/methods/rules/profiles) | VERIFIED |
| `shipping.manage` permission (was missing from enum) | FIXED |
| Shipping discount snapshot on vendor orders | IMPLEMENTED |
| Coupon snapshot fillable fix | FIXED |
| Batch shipping rule preload at checkout | IMPLEMENTED |
| Query-count regression gate | VERIFIED |
| Coupon redemption idempotency + global limit | VERIFIED |
| Vendor coupon create API (fixed/free_shipping types) | IMPLEMENTED |
| Admin shipping UI tabs (carriers/zones/methods/rules) | IMPLEMENTED |

## Deferred / Partial

| Area | Status |
|------|--------|
| Admin vendor profile UI tab | DEFERRED (API complete) |
| Admin coupon scope/exclusion editor | DEFERRED |
| True parallel concurrency stress (100 threads) | INFRASTRUCTURE-DEPENDENT |
| Endpoint rate limiting | DEFERRED |
| Structured metrics (`shipping.quote.duration`, etc.) | DEFERRED |
| PostgreSQL EXPLAIN ANALYZE benchmarks | INFRASTRUCTURE-DEPENDENT |
| Playwright E2E execution in CI | INFRASTRUCTURE-DEPENDENT (spec added) |

## Critical bug fixed

Routes referenced `admin.permission:shipping.manage` but `AdminPermission::ShippingManage` did not exist — all admin mutations returned **403**. Added enum case + seeder sync.
