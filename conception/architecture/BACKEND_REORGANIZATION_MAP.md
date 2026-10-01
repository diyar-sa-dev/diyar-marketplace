# DIYAR — Backend Architecture Reorganization & Domain Inventory Map

> **Date:** 2026-10-01  
> **Status:** ACTIVE IMPLEMENTATION (Core, Infrastructure, Identity, Search, and Catalog domains physically migrated and certified)  
> **Authority:** Senior Software Architect + Senior Laravel Engineer  
> **Purpose:** Traceable inventory and migration map of existing backend files to their domain feature groupings.

---

## 1. Inventory Summary

* **Application Directory:** `backend/app/` (1,141 total PHP files)
* **Total Discovered Models:** 114 models in `app/Models/` (104 shared across >1 domain)
* **Total Controllers:** 145 controller / action handlers in `app/Http/Controllers/Api/V1/` (47 Admin, 26 Dashboard, 15 ServiceMarketplace, etc.)
* **Total Form Requests:** 131 requests in `app/Http/Requests/`
* **Total API Resources:** 107 resources in `app/Http/Resources/`
* **Total Application Services:** 327 service classes across 38 subdirectories in `app/Services/`
* **Total Route Endpoints:** 528 active API routes registered in `routes/api.php`
* **Total Automated Tests:** 1,108 backend tests (1,101 passing, 7 skipped, 0 failing, 4,560 assertions)
* **Definitive Pre-Migration Audit:** See `conception/Architecture/PRE_MIGRATION_ARCHITECTURE_AUDIT.md`

---

## 2. Domain Feature Mapping Table

Below is the comprehensive architectural mapping of existing technical namespaces and file locations to their respective business domains:

| Business Domain | Existing Controller / HTTP Layer | Existing Services Layer | Primary Models & Aggregates | Existing Contracts / Jobs / Events |
| :--- | :--- | :--- | :--- | :--- |
| **Catalog** | `App\Http\Controllers\Api\V1\Catalog\ProductController`<br>`CategoryController`<br>`ProductEngagementController`<br>`ProductPreorderController` | `App\Services\Catalog\ProductService`<br>`ProductCatalogService` | `Product`<br>`Category`<br>`ProductColor`<br>`ProductImage`<br>`ProductInventory`<br>`ProductLike`<br>`ProductPreorderRequest` | `ProductPolicy`<br>`CategoryPolicy`<br>`ProductStockLow` |
| **Search** | `App\Http\Controllers\Api\V1\Catalog\CatalogSearchController`<br>`CatalogSearchSuggestionsController`<br>`FilterSuggestionsController` | `App\Services\Catalog\CatalogSearchService`<br>`App\Services\Search\ProductSearchService`<br>`SearchAnalyticsRecorder`<br>`MysqlCatalogSearchEngine` | `SearchQueryEvent` | `App\Contracts\Search\ProductSearchContract`<br>`SearchEngineInterface`<br>`RecordSearchQueryAnalyticsJob` |
| **Visual Search** | `App\Http\Controllers\Api\V1\Search\VisualSearchController` | `App\Services\Visualization\VisualizationService`<br>`VisualizationProviderRegistry` | `VisualIndexEntry`<br>`VisualSearchEvent` | `VisualizationProviderInterface`<br>`IndexProductImageJob`<br>`RecordVisualSearchEventJob`<br>`RemoveVisualIndexEntryJob`<br>`Dhash64Generator` |
| **Cart** | `App\Http\Controllers\Api\V1\Cart\CartController` | `App\Services\Cart\CartService`<br>`CartPricingService` | `Cart`<br>`CartItem` | Cart validation & resource transformers |
| **Checkout** | `App\Http\Controllers\Api\V1\Checkout\CheckoutController` | `App\Services\Checkout\CheckoutService`<br>`AssemblyCalculator`<br>`StubAssemblyCalculator` | `CheckoutSession`<br>`OrderReservation` | Checkout requests & rules |
| **Orders** | `App\Http\Controllers\Api\V1\Order\OrderController`<br>`VendorOrderController` | `App\Services\Order\OrderService`<br>`VendorOrderService` | `Order`<br>`OrderItem`<br>`VendorOrder` | `OrderPolicy`<br>`VendorOrderPolicy`<br>`OrderCreated`<br>`OrderShipped`<br>`OrderDelivered` |
| **Payments** | `App\Http\Controllers\Api\V1\Payment\PaymentController`<br>`PaymentWebhookController`<br>`FakePaymentWebhookController` | `App\Services\Payments\PaymentGatewayManager`<br>`MyFatoorahGateway`<br>`FakePaymentGateway` | `Payment`<br>`PaymentTransaction`<br>`PaymentVendorAllocation`<br>`PaymentWebhookEvent` | `PaymentGatewayInterface`<br>`ProcessPaymentWebhookJob`<br>`PaymentSucceeded`<br>`PaymentFailed` |
| **Shipping** | `App\Http\Controllers\Api\V1\Admin\AdminShippingConfigurationController`<br>`VendorShippingSettingsController` | `App\Services\Shipping\ShippingQuoteService`<br>`ShippingRateService`<br>`VendorShippingSettingsService` | `Shipment`<br>`ShippingCarrier`<br>`ShippingMethod`<br>`ShippingRateRule`<br>`ShippingZone`<br>`VendorShippingProfile`<br>`VendorShippingSettings` | `ShippingCalculatorInterface`<br>`ShippingProviderInterface`<br>`VendorShippingSettingsPolicy` |
| **Coupons** | `App\Http\Controllers\Api\V1\Admin\AdminCouponController`<br>`VendorCouponController` | `App\Services\Coupon\CouponService`<br>`VendorCouponService` | `Coupon`<br>`CouponUsage`<br>`VendorCoupon`<br>`VendorCouponExclusion`<br>`VendorCouponScope`<br>`VendorCouponUsage` | `CouponActivated`<br>`CouponDeactivated` |
| **Reviews** | `App\Http\Controllers\Api\V1\Catalog\StoreReviewController`<br>`CustomerReviewController`<br>`OrderStoreReviewController` | `App\Services\Review\ProductReviewService`<br>`StoreReviewService` | `ProductReview`<br>`StoreReview`<br>`CustomerReview` | `ReviewCreated` |
| **Wishlist** | `App\Http\Controllers\Api\V1\Profile\WishlistController` | `App\Services\Profile\WishlistService` | `WishlistItem`<br>`ServiceWishlistItem` | Wishlist toggle limiter |
| **Identity & Users** | `App\Http\Controllers\Api\V1\Auth\AuthController`<br>`ProfileController`<br>`AddressController`<br>`ProfileSecuritySessionController`<br>`ProfileTwoFactorController`<br>`OwnershipController` | `App\Services\Identity\AuthenticationService`<br>`SecureOtpCodeGenerator`<br>`ProfileService` | `User`<br>`Address`<br>`Role`<br>`UserRole`<br>`UserSession`<br>`Permission` | `OtpCodeGenerator`<br>`SmsProvider`<br>`SmsProviderFactory` |
| **Vendors** | `App\Http\Controllers\Api\V1\Catalog\VendorController`<br>`VendorFollowController`<br>`Dashboard\Vendor*` | `App\Services\Vendor\VendorService`<br>`VendorDashboardService`<br>`VendorTeamService` | `VendorAccount`<br>`VendorBankAccount`<br>`VendorLegalProfile`<br>`VendorPayout`<br>`VendorReturnPolicy`<br>`VendorStoreFollow`<br>`VendorTeamMember`<br>`VendorWorkingHour` | `VendorAccountPolicy`<br>`VendorPayoutPolicy`<br>`VendorReturnPolicyPolicy`<br>`TeamInvitationReceived`<br>`TeamMemberAdded` |
| **Services Marketplace** | `App\Http\Controllers\Api\V1\ServiceMarketplace\*` | `App\Services\ServiceMarketplace\*` | `Service`<br>`ServiceBooking`<br>`ServiceBookingPayment`<br>`ServiceCategory`<br>`ServiceOffer`<br>`ServicePortfolioItem`<br>`ServiceRequest`<br>`ServiceRequestAttachment` | `ProviderAccountPolicy`<br>`ProviderPayoutPolicy`<br>`ServiceOfferReceived`<br>`ServiceOfferAccepted`<br>`BookingCreated`<br>`BookingCompleted` |
| **Room Designer & Try in Room** | `App\Http\Controllers\Api\V1\RoomDesign\RoomDesignController`<br>`TryInRoom\TryInRoomController` | `App\Services\RoomDesign\*`<br>`TryInRoom\*`<br>`SpatialLayout\*` | `RoomDesign`<br>`TryInRoomJob`<br>`TryInRoomSourceImage` | `RoomDesignPolicy`<br>`TryInRoomJobPolicy`<br>`SpatialLayoutContract` |
| **Chat** | `App\Http\Controllers\Api\V1\Chat\*` | `App\Services\Chat\*` | `Conversation`<br>`Message`<br>`MessageAttachment`<br>`ChatMessageReport` | `ChatServiceProvider`<br>`MessageCreated`<br>`BroadcastChatMessageListener` |
| **Notifications** | `App\Http\Controllers\Api\V1\Profile\Notification*` | `App\Services\Notifications\*` | `UserNotification`<br>`NotificationPreference`<br>`NotificationDevice` | `NotificationServiceProvider`<br>`PushProviderInterface`<br>`DispatchNotificationListener` |
| **Affiliate** | `App\Http\Controllers\Api\V1\Affiliate\*`<br>`Dashboard\Affiliate\*` | `App\Services\Affiliate\*` | `AffiliateProfile`<br>`AffiliateLink`<br>`AffiliateClick`<br>`AffiliateCommission`<br>`AffiliatePayout` | `AffiliateServiceProvider`<br>`AffiliatePayoutPolicy`<br>`AffiliateCommissionAvailable` |
| **Loyalty** | `App\Http\Controllers\Api\V1\Loyalty\LoyaltyController`<br>`AdminLoyaltyController` | `App\Services\Loyalty\*` | `LoyaltyLedger`<br>`LoyaltyRule`<br>`CustomerLoyaltySummary` | `LoyaltyServiceProvider`<br>`AccrueLoyaltyOnPaymentSucceeded`<br>`ReverseLoyaltyOnRefund` |
| **B2B** | `App\Http\Controllers\Api\V1\B2b\*`<br>`Dashboard\PartnerB2b*` | `App\Services\B2b\*` | `B2bCompany`<br>`B2bLead`<br>`B2bCompanyReview` | `B2bCompanyPolicy`<br>`B2bLeadPolicy`<br>`B2bLeadReceived` |
| **Returns** | `App\Http\Controllers\Api\V1\Return\ReturnController`<br>`AdminReturnController` | `App\Services\Returns\*` | `ReturnRequest`<br>`ReturnItem`<br>`ReturnEvidence`<br>`Refund` | `ReturnRequestPolicy`<br>`ReturnUpdated` |
| **Blog & CMS** | `App\Http\Controllers\Api\V1\Blog\*`<br>`AdminBlog*` | `App\Services\Blog\*` | `BlogArticle`<br>`BlogCategory`<br>`BlogTag`<br>`BlogEngagement` | `BlogArticlePolicy`<br>`BlogCategoryPolicy`<br>`BlogTagPolicy` |
| **Projects** | `App\Http\Controllers\Api\V1\Projects\*`<br>`AdminProject*` | `App\Services\Projects\*` | `Project`<br>`ProjectImage` | `ProjectPolicy` |
| **Admin Operations** | `App\Http\Controllers\Api\V1\Admin\*` | `App\Services\Admin\*`<br>`Settings\*`<br>`Infrastructure\*` | `SystemSetting`<br>`AuditLog`<br>`WebsiteFeedback` | `AdminOperationalHealthController`<br>`EnvironmentSafetyValidator` |

---

## 3. Migration Seam & Preservation Assurance

* **Preserved Routing API:** All 528 API endpoints in `routes/api.php` remain functionally identical.
* **Preserved Search Contracts:** `App\Contracts\Search\ProductSearchContract` remains bound to `App\Services\Search\ProductSearchService`.
* **Zero Database Impact:** Database migrations, foreign keys, table indexes, and seeders remain completely unchanged.
