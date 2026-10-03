# STEP 8 — MARKETPLACE OPERATIONS MIGRATION AUDIT
**Date:** 2026-10-03  
**Authority:** Senior Software Architect + Backend Lead + QA/Security/Performance Engineer  
**Scope:** `Vendors`, `ServicesMarketplace`, `B2b` domains migration audit  
**Repository Branch:** `dev`  
**Baseline Commit:** `20b270b`

---

## 1. Executive Summary & Scope

This audit establishes the definitive, empirical migration plan for **Step 8 — Marketplace Operations** of the DIYAR Laravel backend modular monolith.

The baseline codebase has been verified prior to any physical file movement:
- **Git status:** Clean working tree on branch `dev` (HEAD `20b270b`).
- **Registered routes:** Exactly 528 routes (522 API v1 + 6 platform routes).
- **Automated backend tests baseline:** 1,108 tests (1,101 passed, 7 skipped for environment constraints, 0 failed, 4,560 assertions).
- **Automated frontend tests baseline:** 87 test files passed, 350/350 tests passed.
- **Database migrations:** 0 changes pending; `backend/database/migrations` will remain 100% untouched.

In accordance with architectural principles:
- **Structural Migration Only:** No business rules, vendor access permissions, team member roles, working hour evaluations, provider scheduling/availability matrices, booking deposit/payment flows, quote/offer negotiations, or B2B lead generation/company verification algorithms will be modified.
- **Model Rule:** All Eloquent models remain strictly centralized in `App\Models\*` (including `VendorAccount`, `VendorBankAccount`, `VendorLegalProfile`, `VendorPayout`, `VendorStoreFollow`, `VendorTeamMember`, `VendorWorkingHour`, `ProviderAccount`, `ProviderBankAccount`, `ProviderLegalProfile`, `ProviderPayout`, `ProviderProfile`, `ProviderReview`, `ProviderService`, `ProviderWorkPolicy`, `ProviderWorkingHour`, `Service`, `ServiceBooking`, `ServiceBookingPayment`, `ServiceCategory`, `ServiceOffer`, `ServicePortfolioItem`, `ServiceRequest`, `ServiceRequestAttachment`, `ServiceReview`, `B2bCompany`, `B2bLead`, `B2bCompanyReview`, `B2bCategory`, `B2bCompanyService`, `B2bCompanyTestimonial`, `B2bTag`).
- **Policies Rule:** Framework policy auto-discovery (`App\Policies\{Model}Policy`) is preserved in `App\Policies\*` (`VendorAccountPolicy`, `VendorPayoutPolicy`, `ProviderAccountPolicy`, `ProviderPayoutPolicy`, `B2bCompanyPolicy`, `B2bLeadPolicy`).
- **Enums Rule:** Domain enums remain centralized in `App\Enums\*` (`B2bPublicationStatus`, `B2bVerificationStatus`, `ServiceBookingStatus`, `ServiceOfferStatus`, `ServiceRequestStatus`, `ProviderPayoutStatus`, `VendorPayoutStatus`, etc.).
- **Events & Listeners Rule:** System-wide domain events remain in `App\Events\Domain\*` and listeners remain in `App\Listeners\*`.
- **Framework & Admin Layer Boundaries:** Admin controllers (`AdminVendorAccountController`, `AdminProviderAccountController`, `AdminB2bCompanyController`, `AdminB2bLeadController`) remain preserved in `App\Http\Controllers\Api\V1\Admin\` for Step 9/10 dedicated Admin platform migration.

---

## 2. Step 8 Inventory & Target Namespace Mapping

Total classes identified for physical migration across Marketplace Operations: **151 classes**.

### 2.1 Domain: Vendors (43 classes) -> `App\Domains\Vendors\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/Catalog/VendorController.php` | `app/Domains/Vendors/Controllers/VendorController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Catalog/VendorFollowController.php` | `app/Domains/Vendors/Controllers/VendorFollowController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorAnalyticsController.php` | `app/Domains/Vendors/Controllers/VendorAnalyticsController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorDashboardController.php` | `app/Domains/Vendors/Controllers/VendorDashboardController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorFinanceController.php` | `app/Domains/Vendors/Controllers/VendorFinanceController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorInventoryController.php` | `app/Domains/Vendors/Controllers/VendorInventoryController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorPreorderController.php` | `app/Domains/Vendors/Controllers/VendorPreorderController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorProductController.php` | `app/Domains/Vendors/Controllers/VendorProductController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorReviewInboxController.php` | `app/Domains/Vendors/Controllers/VendorReviewInboxController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorSettingsController.php` | `app/Domains/Vendors/Controllers/VendorSettingsController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorTeamController.php` | `app/Domains/Vendors/Controllers/VendorTeamController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorTeamInviteController.php` | `app/Domains/Vendors/Controllers/VendorTeamInviteController.php` | `App\Domains\Vendors\Controllers` |
| `app/Http/Requests/Dashboard/AdjustInventoryRequest.php` | `app/Domains/Vendors/Requests/AdjustInventoryRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/InviteVendorTeamMemberRequest.php` | `app/Domains/Vendors/Requests/InviteVendorTeamMemberRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/ReplyVendorReviewRequest.php` | `app/Domains/Vendors/Requests/ReplyVendorReviewRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/StoreProductRequest.php` | `app/Domains/Vendors/Requests/StoreProductRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/UpdateProductRequest.php` | `app/Domains/Vendors/Requests/UpdateProductRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/UpdateVendorBankAccountRequest.php` | `app/Domains/Vendors/Requests/UpdateVendorBankAccountRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/UpdateVendorLegalProfileRequest.php` | `app/Domains/Vendors/Requests/UpdateVendorLegalProfileRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/UpdateVendorSettingsRequest.php` | `app/Domains/Vendors/Requests/UpdateVendorSettingsRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/UpdateVendorTeamMemberRequest.php` | `app/Domains/Vendors/Requests/UpdateVendorTeamMemberRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/UpdateVendorWorkingHoursRequest.php` | `app/Domains/Vendors/Requests/UpdateVendorWorkingHoursRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/UploadVendorCoverRequest.php` | `app/Domains/Vendors/Requests/UploadVendorCoverRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Requests/Dashboard/UploadVendorLogoRequest.php` | `app/Domains/Vendors/Requests/UploadVendorLogoRequest.php` | `App\Domains\Vendors\Requests` |
| `app/Http/Resources/VendorBankAccountResource.php` | `app/Domains/Vendors/Resources/VendorBankAccountResource.php` | `App\Domains\Vendors\Resources` |
| `app/Http/Resources/VendorCardResource.php` | `app/Domains/Vendors/Resources/VendorCardResource.php` | `App\Domains\Vendors\Resources` |
| `app/Http/Resources/VendorFinanceAnalyticsPointResource.php` | `app/Domains/Vendors/Resources/VendorFinanceAnalyticsPointResource.php` | `App\Domains\Vendors\Resources` |
| `app/Http/Resources/VendorFinancePeriodReportResource.php` | `app/Domains/Vendors/Resources/VendorFinancePeriodReportResource.php` | `App\Domains\Vendors\Resources` |
| `app/Http/Resources/VendorFinanceSummaryResource.php` | `app/Domains/Vendors/Resources/VendorFinanceSummaryResource.php` | `App\Domains\Vendors\Resources` |
| `app/Http/Resources/VendorLegalProfileResource.php` | `app/Domains/Vendors/Resources/VendorLegalProfileResource.php` | `App\Domains\Vendors\Resources` |
| `app/Http/Resources/VendorPayoutResource.php` | `app/Domains/Vendors/Resources/VendorPayoutResource.php` | `App\Domains\Vendors\Resources` |
| `app/Http/Resources/VendorPublicResource.php` | `app/Domains/Vendors/Resources/VendorPublicResource.php` | `App\Domains\Vendors\Resources` |
| `app/Http/Resources/VendorSettingsResource.php` | `app/Domains/Vendors/Resources/VendorSettingsResource.php` | `App\Domains\Vendors\Resources` |
| `app/Http/Resources/VendorWorkingHourResource.php` | `app/Domains/Vendors/Resources/VendorWorkingHourResource.php` | `App\Domains\Vendors\Resources` |
| `app/Services/Vendor/VendorAccessService.php` | `app/Domains/Vendors/Services/VendorAccessService.php` | `App\Domains\Vendors\Services` |
| `app/Services/Vendor/VendorDashboardOverviewService.php` | `app/Domains/Vendors/Services/VendorDashboardOverviewService.php` | `App\Domains\Vendors\Services` |
| `app/Services/Vendor/VendorReviewInboxService.php` | `app/Domains/Vendors/Services/VendorReviewInboxService.php` | `App\Domains\Vendors\Services` |
| `app/Services/Vendor/VendorSettingsService.php` | `app/Domains/Vendors/Services/VendorSettingsService.php` | `App\Domains\Vendors\Services` |
| `app/Services/Vendor/VendorStoreFollowService.php` | `app/Domains/Vendors/Services/VendorStoreFollowService.php` | `App\Domains\Vendors\Services` |
| `app/Services/Vendor/VendorStorefrontPresenter.php` | `app/Domains/Vendors/Services/VendorStorefrontPresenter.php` | `App\Domains\Vendors\Services` |
| `app/Services/Vendor/VendorTeamPermissions.php` | `app/Domains/Vendors/Services/VendorTeamPermissions.php` | `App\Domains\Vendors\Services` |
| `app/Services/Vendor/VendorTeamRoleSync.php` | `app/Domains/Vendors/Services/VendorTeamRoleSync.php` | `App\Domains\Vendors\Services` |
| `app/Services/Vendor/VendorTeamService.php` | `app/Domains/Vendors/Services/VendorTeamService.php` | `App\Domains\Vendors\Services` |

### 2.2 Domain: ServicesMarketplace (76 classes) -> `App\Domains\ServicesMarketplace\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/DirectServiceBookingController.php` | `app/Domains/ServicesMarketplace/Controllers/DirectServiceBookingController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ProviderAnalyticsController.php` | `app/Domains/ServicesMarketplace/Controllers/ProviderAnalyticsController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ProviderController.php` | `app/Domains/ServicesMarketplace/Controllers/ProviderController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ProviderFinanceController.php` | `app/Domains/ServicesMarketplace/Controllers/ProviderFinanceController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ProviderFollowController.php` | `app/Domains/ServicesMarketplace/Controllers/ProviderFollowController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ProviderReviewController.php` | `app/Domains/ServicesMarketplace/Controllers/ProviderReviewController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ProviderSettingsController.php` | `app/Domains/ServicesMarketplace/Controllers/ProviderSettingsController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ProviderWorkPolicyController.php` | `app/Domains/ServicesMarketplace/Controllers/ProviderWorkPolicyController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ServiceBookingController.php` | `app/Domains/ServicesMarketplace/Controllers/ServiceBookingController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ServiceBookingPaymentController.php` | `app/Domains/ServicesMarketplace/Controllers/ServiceBookingPaymentController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ServiceCategoryController.php` | `app/Domains/ServicesMarketplace/Controllers/ServiceCategoryController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ServiceController.php` | `app/Domains/ServicesMarketplace/Controllers/ServiceController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ServiceEngagementController.php` | `app/Domains/ServicesMarketplace/Controllers/ServiceEngagementController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ServiceOfferController.php` | `app/Domains/ServicesMarketplace/Controllers/ServiceOfferController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Controllers/Api/V1/ServiceMarketplace/ServiceRequestController.php` | `app/Domains/ServicesMarketplace/Controllers/ServiceRequestController.php` | `App\Domains\ServicesMarketplace\Controllers` |
| `app/Http/Requests/ServiceMarketplace/AcceptServiceOfferRequest.php` | `app/Domains/ServicesMarketplace/Requests/AcceptServiceOfferRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/CreateDirectBookingRequest.php` | `app/Domains/ServicesMarketplace/Requests/CreateDirectBookingRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/CreateProviderReviewRequest.php` | `app/Domains/ServicesMarketplace/Requests/CreateProviderReviewRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/DirectBookingPreviewRequest.php` | `app/Domains/ServicesMarketplace/Requests/DirectBookingPreviewRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/ProposeServiceBookingScheduleRequest.php` | `app/Domains/ServicesMarketplace/Requests/ProposeServiceBookingScheduleRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/ProviderReviewResponseRequest.php` | `app/Domains/ServicesMarketplace/Requests/ProviderReviewResponseRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/RequestProviderPayoutRequest.php` | `app/Domains/ServicesMarketplace/Requests/RequestProviderPayoutRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/SimulateServiceBookingPaymentRequest.php` | `app/Domains/ServicesMarketplace/Requests/SimulateServiceBookingPaymentRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/StoreProviderServiceRequest.php` | `app/Domains/ServicesMarketplace/Requests/StoreProviderServiceRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/StoreServiceOfferRequest.php` | `app/Domains/ServicesMarketplace/Requests/StoreServiceOfferRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/StoreServiceRequestAttachmentRequest.php` | `app/Domains/ServicesMarketplace/Requests/StoreServiceRequestAttachmentRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/StoreServiceRequestRequest.php` | `app/Domains/ServicesMarketplace/Requests/StoreServiceRequestRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/UpdateProviderAccountSettingsRequest.php` | `app/Domains/ServicesMarketplace/Requests/UpdateProviderAccountSettingsRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/UpdateProviderBankAccountRequest.php` | `app/Domains/ServicesMarketplace/Requests/UpdateProviderBankAccountRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/UpdateProviderNotificationSettingsRequest.php` | `app/Domains/ServicesMarketplace/Requests/UpdateProviderNotificationSettingsRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/UpdateProviderPasswordSettingsRequest.php` | `app/Domains/ServicesMarketplace/Requests/UpdateProviderPasswordSettingsRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/UpdateProviderProfileSettingsRequest.php` | `app/Domains/ServicesMarketplace/Requests/UpdateProviderProfileSettingsRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/UpdateProviderReviewRequest.php` | `app/Domains/ServicesMarketplace/Requests/UpdateProviderReviewRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/UpdateProviderServiceRequest.php` | `app/Domains/ServicesMarketplace/Requests/UpdateProviderServiceRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/UpdateProviderWorkPolicyRequest.php` | `app/Domains/ServicesMarketplace/Requests/UpdateProviderWorkPolicyRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/UpdateProviderWorkingHoursRequest.php` | `app/Domains/ServicesMarketplace/Requests/UpdateProviderWorkingHoursRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Requests/ServiceMarketplace/UploadProviderAvatarRequest.php` | `app/Domains/ServicesMarketplace/Requests/UploadProviderAvatarRequest.php` | `App\Domains\ServicesMarketplace\Requests` |
| `app/Http/Resources/ProviderBankAccountResource.php` | `app/Domains/ServicesMarketplace/Resources/ProviderBankAccountResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ProviderPayoutResource.php` | `app/Domains/ServicesMarketplace/Resources/ProviderPayoutResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ProviderPublicResource.php` | `app/Domains/ServicesMarketplace/Resources/ProviderPublicResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ProviderReviewResource.php` | `app/Domains/ServicesMarketplace/Resources/ProviderReviewResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ProviderReviewSummaryResource.php` | `app/Domains/ServicesMarketplace/Resources/ProviderReviewSummaryResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ProviderSettingsResource.php` | `app/Domains/ServicesMarketplace/Resources/ProviderSettingsResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ProviderWorkPolicyResource.php` | `app/Domains/ServicesMarketplace/Resources/ProviderWorkPolicyResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ServiceBookingPaymentResource.php` | `app/Domains/ServicesMarketplace/Resources/ServiceBookingPaymentResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ServiceBookingResource.php` | `app/Domains/ServicesMarketplace/Resources/ServiceBookingResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ServiceCardResource.php` | `app/Domains/ServicesMarketplace/Resources/ServiceCardResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ServiceCategoryResource.php` | `app/Domains/ServicesMarketplace/Resources/ServiceCategoryResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ServiceDetailResource.php` | `app/Domains/ServicesMarketplace/Resources/ServiceDetailResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ServiceOfferResource.php` | `app/Domains/ServicesMarketplace/Resources/ServiceOfferResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ServicePortfolioItemResource.php` | `app/Domains/ServicesMarketplace/Resources/ServicePortfolioItemResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ServiceRequestAttachmentResource.php` | `app/Domains/ServicesMarketplace/Resources/ServiceRequestAttachmentResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ServiceRequestCardResource.php` | `app/Domains/ServicesMarketplace/Resources/ServiceRequestCardResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Http/Resources/ServiceRequestResource.php` | `app/Domains/ServicesMarketplace/Resources/ServiceRequestResource.php` | `App\Domains\ServicesMarketplace\Resources` |
| `app/Services/ServiceMarketplace/DirectServiceBookingService.php` | `app/Domains/ServicesMarketplace/Services/DirectServiceBookingService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderAccountResolver.php` | `app/Domains/ServicesMarketplace/Services/ProviderAccountResolver.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderAvailabilityService.php` | `app/Domains/ServicesMarketplace/Services/ProviderAvailabilityService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderFinanceService.php` | `app/Domains/ServicesMarketplace/Services/ProviderFinanceService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderFinanceTransactionService.php` | `app/Domains/ServicesMarketplace/Services/ProviderFinanceTransactionService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderFollowService.php` | `app/Domains/ServicesMarketplace/Services/ProviderFollowService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderPayoutService.php` | `app/Domains/ServicesMarketplace/Services/ProviderPayoutService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderProfileService.php` | `app/Domains/ServicesMarketplace/Services/ProviderProfileService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderReviewEligibility.php` | `app/Domains/ServicesMarketplace/Services/ProviderReviewEligibility.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderReviewService.php` | `app/Domains/ServicesMarketplace/Services/ProviderReviewService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderServiceManagementService.php` | `app/Domains/ServicesMarketplace/Services/ProviderServiceManagementService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderSettingsService.php` | `app/Domains/ServicesMarketplace/Services/ProviderSettingsService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ProviderWorkPolicyService.php` | `app/Domains/ServicesMarketplace/Services/ProviderWorkPolicyService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ServiceBookingPaymentService.php` | `app/Domains/ServicesMarketplace/Services/ServiceBookingPaymentService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ServiceBookingRfqSyncService.php` | `app/Domains/ServicesMarketplace/Services/ServiceBookingRfqSyncService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ServiceBookingService.php` | `app/Domains/ServicesMarketplace/Services/ServiceBookingService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ServiceCatalogService.php` | `app/Domains/ServicesMarketplace/Services/ServiceCatalogService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ServiceCategoryService.php` | `app/Domains/ServicesMarketplace/Services/ServiceCategoryService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ServiceEngagementService.php` | `app/Domains/ServicesMarketplace/Services/ServiceEngagementService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ServiceOfferService.php` | `app/Domains/ServicesMarketplace/Services/ServiceOfferService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ServiceRequestAttachmentService.php` | `app/Domains/ServicesMarketplace/Services/ServiceRequestAttachmentService.php` | `App\Domains\ServicesMarketplace\Services` |
| `app/Services/ServiceMarketplace/ServiceRequestService.php` | `app/Domains/ServicesMarketplace/Services/ServiceRequestService.php` | `App\Domains\ServicesMarketplace\Services` |

### 2.3 Domain: B2b (32 classes) -> `App\Domains\B2b\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/B2b/B2bCompanyController.php` | `app/Domains/B2b/Controllers/B2bCompanyController.php` | `App\Domains\B2b\Controllers` |
| `app/Http/Controllers/Api/V1/B2b/B2bCompanyReviewController.php` | `app/Domains/B2b/Controllers/B2bCompanyReviewController.php` | `App\Domains\B2b\Controllers` |
| `app/Http/Controllers/Api/V1/B2b/B2bLeadController.php` | `app/Domains/B2b/Controllers/B2bLeadController.php` | `App\Domains\B2b\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/PartnerB2bCompanyController.php` | `app/Domains/B2b/Controllers/PartnerB2bCompanyController.php` | `App\Domains\B2b\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/PartnerB2bLeadController.php` | `app/Domains/B2b/Controllers/PartnerB2bLeadController.php` | `App\Domains\B2b\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/PartnerB2bReviewController.php` | `app/Domains/B2b/Controllers/PartnerB2bReviewController.php` | `App\Domains\B2b\Controllers` |
| `app/Http/Requests/B2b/B2bCompanyListRequest.php` | `app/Domains/B2b/Requests/B2bCompanyListRequest.php` | `App\Domains\B2b\Requests` |
| `app/Http/Requests/B2b/StoreB2bCompanyReviewRequest.php` | `app/Domains/B2b/Requests/StoreB2bCompanyReviewRequest.php` | `App\Domains\B2b\Requests` |
| `app/Http/Requests/B2b/StoreB2bLeadRequest.php` | `app/Domains/B2b/Requests/StoreB2bLeadRequest.php` | `App\Domains\B2b\Requests` |
| `app/Http/Requests/Dashboard/Concerns/PreparesPartnerB2bCompanyInput.php` | `app/Domains/B2b/Requests/Concerns/PreparesPartnerB2bCompanyInput.php` | `App\Domains\B2b\Requests\Concerns` |
| `app/Http/Requests/Dashboard/StorePartnerB2bCompanyRequest.php` | `app/Domains/B2b/Requests/StorePartnerB2bCompanyRequest.php` | `App\Domains\B2b\Requests` |
| `app/Http/Requests/Dashboard/UpdatePartnerB2bCompanyRequest.php` | `app/Domains/B2b/Requests/UpdatePartnerB2bCompanyRequest.php` | `App\Domains\B2b\Requests` |
| `app/Http/Requests/Dashboard/UpdatePartnerB2bLeadStatusRequest.php` | `app/Domains/B2b/Requests/UpdatePartnerB2bLeadStatusRequest.php` | `App\Domains\B2b\Requests` |
| `app/Http/Requests/Dashboard/UploadPartnerB2bImageRequest.php` | `app/Domains/B2b/Requests/UploadPartnerB2bImageRequest.php` | `App\Domains\B2b\Requests` |
| `app/Http/Requests/Dashboard/UploadPartnerB2bPortfolioImageRequest.php` | `app/Domains/B2b/Requests/UploadPartnerB2bPortfolioImageRequest.php` | `App\Domains\B2b\Requests` |
| `app/Http/Resources/B2bCategoryResource.php` | `app/Domains/B2b/Resources/B2bCategoryResource.php` | `App\Domains\B2b\Resources` |
| `app/Http/Resources/B2bCompanyCardResource.php` | `app/Domains/B2b/Resources/B2bCompanyCardResource.php` | `App\Domains\B2b\Resources` |
| `app/Http/Resources/B2bCompanyDetailResource.php` | `app/Domains/B2b/Resources/B2bCompanyDetailResource.php` | `App\Domains\B2b\Resources` |
| `app/Http/Resources/B2bCompanyPortfolioImageResource.php` | `app/Domains/B2b/Resources/B2bCompanyPortfolioImageResource.php` | `App\Domains\B2b\Resources` |
| `app/Http/Resources/B2bCompanyReviewResource.php` | `app/Domains/B2b/Resources/B2bCompanyReviewResource.php` | `App\Domains\B2b\Resources` |
| `app/Http/Resources/B2bCompanyServiceResource.php` | `app/Domains/B2b/Resources/B2bCompanyServiceResource.php` | `App\Domains\B2b\Resources` |
| `app/Http/Resources/B2bCompanyTestimonialResource.php` | `app/Domains/B2b/Resources/B2bCompanyTestimonialResource.php` | `App\Domains\B2b\Resources` |
| `app/Http/Resources/B2bLeadResource.php` | `app/Domains/B2b/Resources/B2bLeadResource.php` | `App\Domains\B2b\Resources` |
| `app/Http/Resources/B2bTagResource.php` | `app/Domains/B2b/Resources/B2bTagResource.php` | `App\Domains\B2b\Resources` |
| `app/Http/Resources/PartnerB2bLeadResource.php` | `app/Domains/B2b/Resources/PartnerB2bLeadResource.php` | `App\Domains\B2b\Resources` |
| `app/Services/B2b/AdminB2bService.php` | `app/Domains/B2b/Services/AdminB2bService.php` | `App\Domains\B2b\Services` |
| `app/Services/B2b/B2bCompanyReviewService.php` | `app/Domains/B2b/Services/B2bCompanyReviewService.php` | `App\Domains\B2b\Services` |
| `app/Services/B2b/B2bLeadService.php` | `app/Domains/B2b/Services/B2bLeadService.php` | `App\Domains\B2b\Services` |
| `app/Services/B2b/B2bQueryService.php` | `app/Domains/B2b/Services/B2bQueryService.php` | `App\Domains\B2b\Services` |
| `app/Services/B2b/B2bService.php` | `app/Domains/B2b/Services/B2bService.php` | `App\Domains\B2b\Services` |
| `app/Services/B2b/PartnerB2bCompanyService.php` | `app/Domains/B2b/Services/PartnerB2bCompanyService.php` | `App\Domains\B2b\Services` |
| `app/Services/B2b/PartnerB2bLeadService.php` | `app/Domains/B2b/Services/PartnerB2bLeadService.php` | `App\Domains\B2b\Services` |

---

## 3. Classes Intentionally Preserved in Place

1. **Admin Administrative Plane Controllers:**
   - `app/Http/Controllers/Api/V1/Admin/AdminVendorAccountController.php`
   - `app/Http/Controllers/Api/V1/Admin/AdminProviderAccountController.php`
   - `app/Http/Controllers/Api/V1/Admin/AdminB2bCompanyController.php`
   - `app/Http/Controllers/Api/V1/Admin/AdminB2bLeadController.php`
   *Rationale:* Preserved in `app/Http/Controllers/Api/V1/Admin/` for Admin platform migration.
2. **Shipping Domain Controllers & Resources:**
   - `app/Http/Controllers/Api/V1/Dashboard/VendorShippingSettingsController.php`
   - `app/Http/Requests/Dashboard/UpdateVendorShippingSettingsRequest.php`
   - `app/Http/Resources/VendorShippingSettingsResource.php`
   *Rationale:* Mapped under `Shipping` domain (`BACKEND_REORGANIZATION_MAP.md` line 37) to be migrated with Shipping in Step 9.
3. **Policies:**
   - `app/Policies/VendorAccountPolicy.php`
   - `app/Policies/VendorPayoutPolicy.php`
   - `app/Policies/ProviderAccountPolicy.php`
   - `app/Policies/ProviderPayoutPolicy.php`
   - `app/Policies/B2bCompanyPolicy.php`
   - `app/Policies/B2bLeadPolicy.php`
   *Rationale:* Preserved in `app/Policies/*` for Laravel framework auto-discovery.
4. **Models:**
   - All 31 domain models preserved in `app/Models/*`.

---

## 4. Cross-Domain Dependencies & Safety Analysis

1. **Vendors Dependencies:**
   - `Vendors -> Identity`: Vendor accounts and team members belong to `User` with roles (`vendor`, `vendor_admin`, `vendor_staff`).
   - `Vendors -> Catalog`: `VendorProductController` manages products via `ProductService`; `VendorInventoryController` adjusts stock via `InventoryService`; `VendorPreorderController` queries `ProductPreorderService`.
   - `Vendors -> Finance`: `VendorFinanceController` calls `VendorBalanceService`, `VendorFinanceReportingService`, and `PayoutService`.
   - `Vendors -> Analytics`: `VendorAnalyticsController` calls `VendorAnalyticsService` and `AnalyticsDateRangeResolver`.
2. **ServicesMarketplace Dependencies:**
   - `ServicesMarketplace -> Identity`: Providers and service requesters belong to `User`.
   - `ServicesMarketplace -> Finance / Payments`: `ServiceBookingPaymentService` handles booking payments and calls `PaymentGatewayInterface` / `PaymentOrchestrator`.
   - `ServicesMarketplace -> Chat`: Booking inquiries integrate with messaging channels.
3. **B2B Dependencies:**
   - `B2b -> Identity`: B2B companies are owned by `User` (`partner`, `vendor`).
   - `B2b -> Vendors`: B2B company can optionally link to `VendorAccount`.
   - `B2b -> Admin`: `AdminB2bCompanyController` and `ChatModerationEnforcementService` call `AdminB2bService`.

---

## 5. Execution Sequence

The migration will proceed in topological substeps:
- **Substep 8.1: B2B Domain Migration** (32 classes) + targeted verification.
- **Substep 8.2: Vendors Domain Migration** (43 classes) + targeted verification.
- **Substep 8.3: ServicesMarketplace Domain Migration** (76 classes) + targeted verification.
- **Substep 8.4: Cross-Domain Reference Audit & Cleanup** (routes, controllers, services, tests).
- **Substep 8.5: Full Regression Verification** (1,108 backend tests, 350 frontend tests, 528 routes invariant, 0 migrations modified).
