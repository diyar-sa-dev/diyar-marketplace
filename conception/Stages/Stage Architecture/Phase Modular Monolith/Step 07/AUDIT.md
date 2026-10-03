# STEP 7 — SUPPORT, ENGAGEMENT & POST-COMMERCE DOMAINS MIGRATION AUDIT
**Date:** 2026-10-03  
**Authority:** Senior Software Architect + Backend Lead + QA/Security/Performance Engineer  
**Scope:** `Reviews`, `Coupons`, `Loyalty`, `Affiliate`, `Returns` domains migration audit  
**Repository Branch:** `dev`  
**Baseline Commit:** `18039e41bc5059071817ef5971a657f25d39a52f`

---

## 1. Executive Summary

This audit establishes the definitive, empirical migration plan for **Step 7 — Support, Engagement & Post-Commerce Domains** of the DIYAR Laravel backend modular monolith.

The baseline codebase has been verified prior to any physical file movement:
- **Git status:** Clean working tree on branch `dev` (HEAD `18039e41`).
- **Registered routes:** Exactly 528 routes (522 API v1 + 6 platform routes).
- **Automated backend tests baseline:** 1,108 tests (1,101 passed, 7 skipped for environment constraints, 0 failed, 4,560 assertions).
- **Automated frontend tests:** 87 test files passed, 350/350 tests passed.
- **Database migrations:** 0 changes pending; database migrations directory will remain 100% untouched.

In accordance with architectural principles:
- **Structural Migration Only:** No business rules, rating calculations, eligibility rules, discount computations, point accruals/redemptions, affiliate attribution, commission formulas, RMA lifecycles, or refund processing algorithms will be modified.
- **Model Rule:** All Eloquent models remain strictly centralized in `App\Models\*` (including `Review`, `ProductReview`, `StoreReview`, `CustomerReview`, `Coupon`, `CouponUsage`, `VendorCoupon`, `VendorCouponExclusion`, `VendorCouponScope`, `VendorCouponUsage`, `LoyaltyLedger`, `LoyaltyRule`, `CustomerLoyaltySummary`, `AffiliateProfile`, `AffiliateLink`, `AffiliateClick`, `AffiliateAttribution`, `AffiliateCommission`, `AffiliatePayout`, `AffiliatePlatformConfig`, `ProductAffiliateSetting`, `ReturnRequest`, `ReturnItem`, `ReturnEvidence`, `Refund`, `VendorReturnPolicy`).
- **Policies Rule:** Framework policy auto-discovery (`App\Policies\{Model}Policy`) is preserved in `App\Policies\*` (`AffiliatePayoutPolicy`, `ReturnRequestPolicy`, `VendorReturnPolicyPolicy`).
- **Enums Rule:** Domain enums remain centralized in `App\Enums\*` (`LoyaltyTransactionType`, `RefundStatus`, `ReturnRequestStatus`, `ReturnEvidenceType`, `AffiliatePayoutStatus`, `AffiliateCommissionStatus`, `AffiliateLinkStatus`, `AffiliateProfileStatus`, `CouponDiscountType`).
- **Events & Listeners Rule:** System-wide domain events remain in `App\Events\Domain\*` (`AffiliateCommissionAvailable`, `AffiliatePayoutRequested`, `CouponActivated`, `CouponDeactivated`, `ReturnUpdated`, `ReviewCreated`) and listeners remain in `App\Listeners\*`.
- **Framework & Admin Layer Boundaries:** Admin controllers (`AdminReviewController`, `AdminCouponController`, `AdminLoyaltyController`, `AdminAffiliate*Controller`, `AdminReturnController`) and Admin services (`AdminCouponService`, `AdminReturnService`, `AdminReviewModerationService`, `AdminAffiliate*Service`) are preserved in `App\Http\Controllers\Api\V1\Admin\` and `App\Services\Admin\` to be migrated with the Admin domain. Multi-domain dashboard controllers like `VendorReviewInboxController` and services like `VendorReviewInboxService` are preserved for Step 8 (Marketplace Operations: Vendors).

---

## 2. Step 7 Inventory & Target Namespace Mapping

Total classes identified for physical migration across the five Support & Engagement domains: **92 classes**.

### 2.1 Domain: Reviews (13 classes) -> `App\Domains\Reviews\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/Catalog/StoreReviewController.php` | `app/Domains/Reviews/Controllers/StoreReviewController.php` | `App\Domains\Reviews\Controllers` |
| `app/Http/Controllers/Api/V1/Order/OrderStoreReviewController.php` | `app/Domains/Reviews/Controllers/OrderStoreReviewController.php` | `App\Domains\Reviews\Controllers` |
| `app/Http/Controllers/Api/V1/Profile/CustomerReviewController.php` | `app/Domains/Reviews/Controllers/CustomerReviewController.php` | `App\Domains\Reviews\Controllers` |
| `app/Http/Requests/Catalog/StoreProductReviewRequest.php` | `app/Domains/Reviews/Requests/StoreProductReviewRequest.php` | `App\Domains\Reviews\Requests` |
| `app/Http/Requests/StoreReview/StoreStoreReviewRequest.php` | `app/Domains/Reviews/Requests/StoreStoreReviewRequest.php` | `App\Domains\Reviews\Requests` |
| `app/Http/Requests/StoreReview/UpdateStoreReviewRequest.php` | `app/Domains/Reviews/Requests/UpdateStoreReviewRequest.php` | `App\Domains\Reviews\Requests` |
| `app/Http/Resources/ProductReviewResource.php` | `app/Domains/Reviews/Resources/ProductReviewResource.php` | `App\Domains\Reviews\Resources` |
| `app/Http/Resources/StoreReviewResource.php` | `app/Domains/Reviews/Resources/StoreReviewResource.php` | `App\Domains\Reviews\Resources` |
| `app/Http/Resources/StoreReviewSummaryResource.php` | `app/Domains/Reviews/Resources/StoreReviewSummaryResource.php` | `App\Domains\Reviews\Resources` |
| `app/Services/Review/ProductReviewEligibilityService.php` | `app/Domains/Reviews/Services/ProductReviewEligibilityService.php` | `App\Domains\Reviews\Services` |
| `app/Services/Review/OrderFulfillmentReviewEligibility.php` | `app/Domains/Reviews/Services/OrderFulfillmentReviewEligibility.php` | `App\Domains\Reviews\Services` |
| `app/Services/StoreReview/StoreReviewService.php` | `app/Domains/Reviews/Services/StoreReviewService.php` | `App\Domains\Reviews\Services` |
| `app/Services/Profile/CustomerReviewHistoryService.php` | `app/Domains/Reviews/Services/CustomerReviewHistoryService.php` | `App\Domains\Reviews\Services` |

### 2.2 Domain: Coupons (12 classes) -> `App\Domains\Coupons\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/Dashboard/VendorCouponController.php` | `app/Domains/Coupons/Controllers/VendorCouponController.php` | `App\Domains\Coupons\Controllers` |
| `app/Http/Requests/Dashboard/StoreVendorCouponRequest.php` | `app/Domains/Coupons/Requests/StoreVendorCouponRequest.php` | `App\Domains\Coupons\Requests` |
| `app/Http/Requests/Dashboard/UpdateVendorCouponRequest.php` | `app/Domains/Coupons/Requests/UpdateVendorCouponRequest.php` | `App\Domains\Coupons\Requests` |
| `app/Http/Resources/VendorCouponResource.php` | `app/Domains/Coupons/Resources/VendorCouponResource.php` | `App\Domains\Coupons\Resources` |
| `app/Services/Coupon/CheckoutCouponService.php` | `app/Domains/Coupons/Services/CheckoutCouponService.php` | `App\Domains\Coupons\Services` |
| `app/Services/Coupon/CouponEligibleSubtotalService.php` | `app/Domains/Coupons/Services/CouponEligibleSubtotalService.php` | `App\Domains\Coupons\Services` |
| `app/Services/Coupon/CouponEvaluationService.php` | `app/Domains/Coupons/Services/CouponEvaluationService.php` | `App\Domains\Coupons\Services` |
| `app/Services/Coupon/CouponFreeShippingService.php` | `app/Domains/Coupons/Services/CouponFreeShippingService.php` | `App\Domains\Coupons\Services` |
| `app/Services/Coupon/VendorCouponCalculationService.php` | `app/Domains/Coupons/Services/VendorCouponCalculationService.php` | `App\Domains\Coupons\Services` |
| `app/Services/Coupon/VendorCouponManagementService.php` | `app/Domains/Coupons/Services/VendorCouponManagementService.php` | `App\Domains\Coupons\Services` |
| `app/Services/Coupon/VendorCouponUsageService.php` | `app/Domains/Coupons/Services/VendorCouponUsageService.php` | `App\Domains\Coupons\Services` |
| `app/Services/Coupon/VendorCouponValidationService.php` | `app/Domains/Coupons/Services/VendorCouponValidationService.php` | `App\Domains\Coupons\Services` |

### 2.3 Domain: Loyalty (6 classes) -> `App\Domains\Loyalty\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/Loyalty/LoyaltyController.php` | `app/Domains/Loyalty/Controllers/LoyaltyController.php` | `App\Domains\Loyalty\Controllers` |
| `app/Http/Resources/LoyaltyTransactionResource.php` | `app/Domains/Loyalty/Resources/LoyaltyTransactionResource.php` | `App\Domains\Loyalty\Resources` |
| `app/Services/Loyalty/LoyaltyEligibleAmountService.php` | `app/Domains/Loyalty/Services/LoyaltyEligibleAmountService.php` | `App\Domains\Loyalty\Services` |
| `app/Services/Loyalty/LoyaltyLedgerService.php` | `app/Domains/Loyalty/Services/LoyaltyLedgerService.php` | `App\Domains\Loyalty\Services` |
| `app/Services/Loyalty/LoyaltyQueryService.php` | `app/Domains/Loyalty/Services/LoyaltyQueryService.php` | `App\Domains\Loyalty\Services` |
| `app/Services/Loyalty/LoyaltyRuleService.php` | `app/Domains/Loyalty/Services/LoyaltyRuleService.php` | `App\Domains\Loyalty\Services` |

### 2.4 Domain: Affiliate (33 classes) -> `App\Domains\Affiliate\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/Affiliate/AffiliateReferralController.php` | `app/Domains/Affiliate/Controllers/AffiliateReferralController.php` | `App\Domains\Affiliate\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/Affiliate/AffiliateDashboardController.php` | `app/Domains/Affiliate/Controllers/AffiliateDashboardController.php` | `App\Domains\Affiliate\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/Affiliate/AffiliateLinkController.php` | `app/Domains/Affiliate/Controllers/AffiliateLinkController.php` | `App\Domains\Affiliate\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/Affiliate/AffiliatePayoutController.php` | `app/Domains/Affiliate/Controllers/AffiliatePayoutController.php` | `App\Domains\Affiliate\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/Affiliate/AffiliatePlatformConfigController.php` | `app/Domains/Affiliate/Controllers/AffiliatePlatformConfigController.php` | `App\Domains\Affiliate\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/Affiliate/AffiliateProductController.php` | `app/Domains/Affiliate/Controllers/AffiliateProductController.php` | `App\Domains\Affiliate\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/Affiliate/AffiliateReportController.php` | `app/Domains/Affiliate/Controllers/AffiliateReportController.php` | `App\Domains\Affiliate\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/Affiliate/AffiliateSettingsController.php` | `app/Domains/Affiliate/Controllers/AffiliateSettingsController.php` | `App\Domains\Affiliate\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorProductAffiliateController.php` | `app/Domains/Affiliate/Controllers/VendorProductAffiliateController.php` | `App\Domains\Affiliate\Controllers` |
| `app/Http/Requests/Affiliate/CreateAffiliateLinkRequest.php` | `app/Domains/Affiliate/Requests/CreateAffiliateLinkRequest.php` | `App\Domains\Affiliate\Requests` |
| `app/Http/Requests/Affiliate/RejectAffiliatePayoutRequest.php` | `app/Domains/Affiliate/Requests/RejectAffiliatePayoutRequest.php` | `App\Domains\Affiliate\Requests` |
| `app/Http/Requests/Affiliate/RequestAffiliatePayoutRequest.php` | `app/Domains/Affiliate/Requests/RequestAffiliatePayoutRequest.php` | `App\Domains\Affiliate\Requests` |
| `app/Http/Requests/Affiliate/ResolveAffiliateReferralRequest.php` | `app/Domains/Affiliate/Requests/ResolveAffiliateReferralRequest.php` | `App\Domains\Affiliate\Requests` |
| `app/Http/Requests/Affiliate/TrackAffiliateClickRequest.php` | `app/Domains/Affiliate/Requests/TrackAffiliateClickRequest.php` | `App\Domains\Affiliate\Requests` |
| `app/Http/Requests/Affiliate/UpdateAffiliateSettingsRequest.php` | `app/Domains/Affiliate/Requests/UpdateAffiliateSettingsRequest.php` | `App\Domains\Affiliate\Requests` |
| `app/Http/Requests/Affiliate/UpsertProductAffiliateSettingsRequest.php` | `app/Domains/Affiliate/Requests/UpsertProductAffiliateSettingsRequest.php` | `App\Domains\Affiliate\Requests` |
| `app/Http/Resources/AffiliateLinkResource.php` | `app/Domains/Affiliate/Resources/AffiliateLinkResource.php` | `App\Domains\Affiliate\Resources` |
| `app/Http/Resources/AffiliatePayoutResource.php` | `app/Domains/Affiliate/Resources/AffiliatePayoutResource.php` | `App\Domains\Affiliate\Resources` |
| `app/Http/Resources/AffiliateProfileResource.php` | `app/Domains/Affiliate/Resources/AffiliateProfileResource.php` | `App\Domains\Affiliate\Resources` |
| `app/Http/Resources/ProductAffiliateSettingResource.php` | `app/Domains/Affiliate/Resources/ProductAffiliateSettingResource.php` | `App\Domains\Affiliate\Resources` |
| `app/Services/Affiliate/AffiliateAdminPayoutService.php` | `app/Domains/Affiliate/Services/AffiliateAdminPayoutService.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliateAttributionService.php` | `app/Domains/Affiliate/Services/AffiliateAttributionService.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliateBalanceService.php` | `app/Domains/Affiliate/Services/AffiliateBalanceService.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliateCommissionRules.php` | `app/Domains/Affiliate/Services/AffiliateCommissionRules.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliateCommissionService.php` | `app/Domains/Affiliate/Services/AffiliateCommissionService.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliateDashboardService.php` | `app/Domains/Affiliate/Services/AffiliateDashboardService.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliateFinanceTransactionService.php` | `app/Domains/Affiliate/Services/AffiliateFinanceTransactionService.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliateLinkService.php` | `app/Domains/Affiliate/Services/AffiliateLinkService.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliatePayoutService.php` | `app/Domains/Affiliate/Services/AffiliatePayoutService.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliatePlatformConfigService.php` | `app/Domains/Affiliate/Services/AffiliatePlatformConfigService.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliateProfileService.php` | `app/Domains/Affiliate/Services/AffiliateProfileService.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/AffiliateTrafficSourceResolver.php` | `app/Domains/Affiliate/Services/AffiliateTrafficSourceResolver.php` | `App\Domains\Affiliate\Services` |
| `app/Services/Affiliate/ProductAffiliateSettingsService.php` | `app/Domains/Affiliate/Services/ProductAffiliateSettingsService.php` | `App\Domains\Affiliate\Services` |

### 2.5 Domain: Returns (28 classes) -> `App\Domains\Returns\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/Return/ReturnController.php` | `app/Domains/Returns/Controllers/ReturnController.php` | `App\Domains\Returns\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorReturnController.php` | `app/Domains/Returns/Controllers/VendorReturnController.php` | `App\Domains\Returns\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorReturnPolicyController.php` | `app/Domains/Returns/Controllers/VendorReturnPolicyController.php` | `App\Domains\Returns\Controllers` |
| `app/Http/Requests/Returns/ProcessReturnRefundRequest.php` | `app/Domains/Returns/Requests/ProcessReturnRefundRequest.php` | `App\Domains\Returns\Requests` |
| `app/Http/Requests/Returns/RejectReturnRequest.php` | `app/Domains/Returns/Requests/RejectReturnRequest.php` | `App\Domains\Returns\Requests` |
| `app/Http/Requests/Returns/StoreReturnEvidenceRequest.php` | `app/Domains/Returns/Requests/StoreReturnEvidenceRequest.php` | `App\Domains\Returns\Requests` |
| `app/Http/Requests/Returns/StoreReturnRequest.php` | `app/Domains/Returns/Requests/StoreReturnRequest.php` | `App\Domains\Returns\Requests` |
| `app/Http/Requests/Returns/UpdateVendorReturnPolicyRequest.php` | `app/Domains/Returns/Requests/UpdateVendorReturnPolicyRequest.php` | `App\Domains\Returns\Requests` |
| `app/Http/Resources/EffectiveReturnPolicyResource.php` | `app/Domains/Returns/Resources/EffectiveReturnPolicyResource.php` | `App\Domains\Returns\Resources` |
| `app/Http/Resources/RefundResource.php` | `app/Domains/Returns/Resources/RefundResource.php` | `App\Domains\Returns\Resources` |
| `app/Http/Resources/ReturnEvidenceResource.php` | `app/Domains/Returns/Resources/ReturnEvidenceResource.php` | `App\Domains\Returns\Resources` |
| `app/Http/Resources/ReturnItemResource.php` | `app/Domains/Returns/Resources/ReturnItemResource.php` | `App\Domains\Returns\Resources` |
| `app/Http/Resources/ReturnRequestResource.php` | `app/Domains/Returns/Resources/ReturnRequestResource.php` | `App\Domains\Returns\Resources` |
| `app/Http/Resources/VendorReturnPolicyResource.php` | `app/Domains/Returns/Resources/VendorReturnPolicyResource.php` | `App\Domains\Returns\Resources` |
| `app/Services/Returns/DTO/EffectiveReturnPolicy.php` | `app/Domains/Returns/Services/DTO/EffectiveReturnPolicy.php` | `App\Domains\Returns\Services\DTO` |
| `app/Services/Returns/DTO/RefundBreakdown.php` | `app/Domains/Returns/Services/DTO/RefundBreakdown.php` | `App\Domains\Returns\Services\DTO` |
| `app/Services/Returns/DTO/RefundCalculationResult.php` | `app/Domains/Returns/Services/DTO/RefundCalculationResult.php` | `App\Domains\Returns\Services\DTO` |
| `app/Services/Returns/EffectiveReturnPolicyService.php` | `app/Domains/Returns/Services/EffectiveReturnPolicyService.php` | `App\Domains\Returns\Services` |
| `app/Services/Returns/RefundCalculationService.php` | `app/Domains/Returns/Services/RefundCalculationService.php` | `App\Domains\Returns\Services` |
| `app/Services/Returns/RefundProcessingService.php` | `app/Domains/Returns/Services/RefundProcessingService.php` | `App\Domains\Returns\Services` |
| `app/Services/Returns/ReturnedQuantityService.php` | `app/Domains/Returns/Services/ReturnedQuantityService.php` | `App\Domains\Returns\Services` |
| `app/Services/Returns/ReturnEligibilityService.php` | `app/Domains/Returns/Services/ReturnEligibilityService.php` | `App\Domains\Returns\Services` |
| `app/Services/Returns/ReturnEvidenceService.php` | `app/Domains/Returns/Services/ReturnEvidenceService.php` | `App\Domains\Returns\Services` |
| `app/Services/Returns/ReturnPolicySnapshot.php` | `app/Domains/Returns/Services/ReturnPolicySnapshot.php` | `App\Domains\Returns\Services` |
| `app/Services/Returns/ReturnReferenceService.php` | `app/Domains/Returns/Services/ReturnReferenceService.php` | `App\Domains\Returns\Services` |
| `app/Services/Returns/ReturnRequestService.php` | `app/Domains/Returns/Services/ReturnRequestService.php` | `App\Domains\Returns\Services` |
| `app/Services/Returns/ReturnStateService.php` | `app/Domains/Returns/Services/ReturnStateService.php` | `App\Domains\Returns\Services` |
| `app/Services/Returns/VendorReturnPolicyService.php` | `app/Domains/Returns/Services/VendorReturnPolicyService.php` | `App\Domains\Returns\Services` |

---

## 3. Classes Intentionally Preserved in Place

1. **Admin Controllers & Services:**
   - `app/Http/Controllers/Api/V1/Admin/AdminReviewController.php`
   - `app/Http/Controllers/Api/V1/Admin/AdminCouponController.php`
   - `app/Http/Controllers/Api/V1/Admin/AdminLoyaltyController.php`
   - `app/Http/Controllers/Api/V1/Admin/AdminReturnController.php`
   - `app/Http/Controllers/Api/V1/Admin/AdminAffiliate*Controller.php` (6 controllers)
   - `app/Services/Admin/AdminCouponService.php`
   - `app/Services/Admin/AdminReturnService.php`
   - `app/Services/Admin/AdminReviewModerationService.php`
   - `app/Services/Admin/AdminAffiliate*Service.php` (2 services)
   - `app/Http/Resources/AdminAffiliate*.php` (4 resources)
   *Rationale:* Preserved as part of the Admin administrative control plane (`BACKEND_ARCHITECTURE.md` Section 3, Rule 4), migrating in a dedicated Admin step.
2. **Merchant & Marketplace Inboxes / Cross-Domain Controllers:**
   - `app/Http/Controllers/Api/V1/Dashboard/VendorReviewInboxController.php`
   - `app/Services/Vendor/VendorReviewInboxService.php`
   *Rationale:* Deeply bound to `VendorAccessService` and multi-vendor roles, mapped under Vendors domain (`BACKEND_REORGANIZATION_MAP.md` line 42).
   - `app/Http/Controllers/Api/V1/ServiceMarketplace/ProviderReviewController.php`
   - `app/Services/ServiceMarketplace/ProviderReview*.php`
   *Rationale:* Belongs to the `ServicesMarketplace` domain (`BACKEND_REORGANIZATION_MAP.md` line 43).
   - `app/Http/Controllers/Api/V1/B2b/*Review*.php`
   *Rationale:* Belongs to the `B2b` domain (`BACKEND_REORGANIZATION_MAP.md` line 49).
3. **Policies:**
   - `app/Policies/AffiliatePayoutPolicy.php`
   - `app/Policies/ReturnRequestPolicy.php`
   - `app/Policies/VendorReturnPolicyPolicy.php`
   *Rationale:* Preserved in `app/Policies/*` for Laravel framework convention and automatic policy resolution.
4. **Events & Listeners:**
   - `app/Events/Domain/Affiliate*.php`, `Coupon*.php`, `ReturnUpdated.php`, `ReviewCreated.php`
   - `app/Listeners/Affiliate/*`, `app/Listeners/Loyalty/*`
   *Rationale:* Preserved in `app/Events/Domain/*` and `app/Listeners/*` for centralized event dispatching.
5. **Models:**
   - All 24 domain models preserved in `app/Models/*`.

---

## 4. Cross-Domain Dependencies & Safety Analysis

1. **Reviews Dependencies:**
   - `Reviews -> Catalog`: `StoreReviewController` queries `VendorAccount` via slug; `ProductReviewEligibilityService` checks `Product` and `OrderItem` purchased status; `ProductEngagementController` in Catalog consumes `ProductReviewResource` and `StoreProductReviewRequest`.
   - `Reviews -> Orders`: `OrderStoreReviewController` verifies `Order` ownership and status; `OrderFulfillmentReviewEligibility` checks delivery state.
   - `Reviews -> Identity`: Reviews belong to authenticated `User`.
2. **Coupons Dependencies:**
   - `Coupons -> Orders & Checkout`: `CheckoutPreviewService` and `OrderCreationService` call `CheckoutCouponService`, `CouponEvaluationService`, and `CouponEligibleSubtotalService`.
   - `Coupons -> Cart`: Discounts are calculated on subtotal and shipping items.
   - `Coupons -> Catalog`: Products and categories evaluated for coupon scopes and exclusions.
3. **Loyalty Dependencies:**
   - `Loyalty -> Payments & Orders`: `AccrueLoyaltyOnPaymentSucceeded` and `ReverseLoyaltyOnRefund` update points ledger upon payment and refund completions.
   - `Loyalty -> Identity`: Customer points ledger mapped to `User`.
4. **Affiliate Dependencies:**
   - `Affiliate -> Orders & Payments`: `ProcessAffiliateCommissionOnPaymentSucceeded`, `ReleaseAffiliateCommissionOnVendorOrderDelivered`, and `ReverseAffiliateCommissionOnRefund` synchronize commission ledger with payment and delivery events.
   - `Affiliate -> Identity`: Affiliate profiles belong to `User` with `marketer` role.
5. **Returns Dependencies:**
   - `Returns -> Payments`: `RefundProcessingService` calls `PaymentGatewayInterface::refund()`, `PaymentStateService`, and emits refund records.
   - `Returns -> Orders`: Returns reference `Order`, `VendorOrder`, `OrderItem`, and `Shipment`.
   - `Returns -> Finance`: `RefundProcessingService` calls `FinancialPostingService` for general ledger entries.

---

## 5. Execution Sequence

The migration will proceed in topological substeps:
- **Subphase 7.1: Reviews** (13 classes) + targeted verification.
- **Subphase 7.2: Coupons** (12 classes) + targeted verification.
- **Subphase 7.3: Loyalty** (6 classes) + targeted verification.
- **Subphase 7.4: Affiliate** (33 classes) + targeted verification.
- **Subphase 7.5: Returns** (28 classes) + targeted verification.
- **Subphase 7.6: Cross-domain reference audit** (routes, controllers, services, tests).
- **Subphase 7.7: Full regression verification** (Backend test suite, Frontend test suite, Routes invariant, Migrations diff).
