# Batch S2-00: Baseline & Shipping V1 Evidence Audit Report

> **Batch ID:** `S2-00-baseline-audit`  
> **Status:** `COMPLETE`  
> **Execution Date:** 2026-10-27  

---

## 1. Executive Summary

This report establishes the verified empirical baseline of DIYAR's Shipping V1 implementation, resolving all architectural questions and mapping every execution path prior to any functional changes.

---

## 2. Baseline Environment Verification

- **Branch:** `dev`
- **HEAD Commit:** `8e3da0af` (`fix(auth,reviews,routes): dynamic test OTP resolution, UTF-8 reviews seed, and guarded 403 route`)
- **Working Tree:** Clean (verified 0 modified files, 0 untracked files).
- **Environment:** PHP 8.4 CLI, Laravel 11.x, MySQL 8.0, Redis 7.

---

## 3. Verified Shipping V1 Call Paths

1. **Checkout & Pricing:**
   - Handled via `CheckoutPreviewService.php` $\rightarrow$ groups items by vendor $\rightarrow$ queries `ShippingQuoteService.php`.
   - Supports default flat-rate (`CarrierFlatRateStrategy.php`) and advanced rule engine (`ShippingRuleEngine.php`).
   - Server-authoritative calculation: client cannot manipulate shipping fees.
2. **Order Creation:**
   - Handled via `OrderCreationService.php` $\rightarrow$ snapshots recipient address details onto `orders` and creates a 1:1 `Shipment` with status `pending`.
3. **Vendor Fulfillment:**
   - Handled via `VendorOrderController.php` $\rightarrow$ calls `VendorOrderFulfillmentService.php` $\rightarrow$ enforces state machine in `ShipmentStateService.php` (`pending` $\rightarrow$ `prepared` $\rightarrow$ `shipped` $\rightarrow$ `delivered`).

---

## 4. Test Execution Evidence

Targeted baseline tests executed non-destructively:

| Test File | Result | Assertions | Duration |
|---|---|---|---|
| `tests/Feature/Api/V1/Shipping/ShippingStage101HardeningTest.php` | **PASSED (6/6)** | 29 | 13.00s |
| `tests/Feature/Api/V1/Shipping/AdvancedShippingTest.php` | **PASSED (4/4)** | 8 | 1.21s |
| `tests/Unit/Services/Shipping/ShippingRulePrecedenceTest.php` | **PASSED (1/1)** | 3 | 9.45s |
| `frontend/src/admin/utils/shippingCode.test.ts` | **PASSED (3/3)** | 3 | 21.73s |

**Total Verified Assertions:** 43 assertions passed cleanly, 0 failures.

---

## 5. Three-Face Review Summary

- **Face 1 (Principal Software Engineer):** Architecture boundaries verified. Confirmed that multi-vendor cart grouping and order creation snapshots must be preserved completely. Confirmed `vendor_accounts` lacks physical warehouse/pickup address schema.
- **Face 2 (QA/DevOps/Performance):** Test suites confirmed operational. Confirmed that external carrier calls must be queued asynchronously to prevent freezing customer checkout or vendor dashboard requests.
- **Face 3 (Security/Bug Bounty):** Identified that carrier labels contain customer PII and must be stored privately and served via authenticated signed URLs. Webhooks must enforce HMAC-SHA256 signature verification.

---

## 6. Exit Gate Decision

**BATCH S2-00 COMPLETE — READY FOR S2-01 (Domain Scenarios)**
