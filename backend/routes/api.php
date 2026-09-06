<?php

use App\Http\Controllers\Api\V1\Admin\AdminAffiliateAttributionController;
use App\Http\Controllers\Api\V1\Admin\AdminAffiliateClickController;
use App\Http\Controllers\Api\V1\Admin\AdminAffiliateCommissionController;
use App\Http\Controllers\Api\V1\Admin\AdminAffiliateLinkController;
use App\Http\Controllers\Api\V1\Admin\AdminAffiliatePayoutController;
use App\Http\Controllers\Api\V1\Admin\AdminAffiliateProfileController;
use App\Http\Controllers\Api\V1\Admin\AdminAnalyticsController;
use App\Http\Controllers\Api\V1\Admin\AdminAnnouncementController;
use App\Http\Controllers\Api\V1\Admin\AdminAuditLogController;
use App\Http\Controllers\Api\V1\Admin\AdminAuthController;
use App\Http\Controllers\Api\V1\Admin\AdminB2bCompanyController;
use App\Http\Controllers\Api\V1\Admin\AdminBlogArticleController;
use App\Http\Controllers\Api\V1\Admin\AdminBlogCategoryController;
use App\Http\Controllers\Api\V1\Admin\AdminBlogTagController;
use App\Http\Controllers\Api\V1\Admin\AdminChatController;
use App\Http\Controllers\Api\V1\Admin\AdminCmsMediaController;
use App\Http\Controllers\Api\V1\Admin\AdminCouponController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminFinanceController;
use App\Http\Controllers\Api\V1\Admin\AdminFinancialTransactionController;
use App\Http\Controllers\Api\V1\Admin\AdminInventoryController;
use App\Http\Controllers\Api\V1\Admin\AdminLoyaltyController;
use App\Http\Controllers\Api\V1\Admin\AdminNotificationBroadcastController;
use App\Http\Controllers\Api\V1\Admin\AdminNotificationController;
use App\Http\Controllers\Api\V1\Admin\AdminOperationalHealthController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\AdminPaymentController;
use App\Http\Controllers\Api\V1\Admin\AdminPayoutController;
use App\Http\Controllers\Api\V1\Admin\AdminPermissionController;
use App\Http\Controllers\Api\V1\Admin\AdminProductController;
use App\Http\Controllers\Api\V1\Admin\AdminProjectController;
use App\Http\Controllers\Api\V1\Admin\AdminProviderAccountController;
use App\Http\Controllers\Api\V1\Admin\AdminProviderPayoutController;
use App\Http\Controllers\Api\V1\Admin\AdminReportController;
use App\Http\Controllers\Api\V1\Admin\AdminReturnController;
use App\Http\Controllers\Api\V1\Admin\AdminReviewController;
use App\Http\Controllers\Api\V1\Admin\AdminRoleController;
use App\Http\Controllers\Api\V1\Admin\AdminServiceBookingController;
use App\Http\Controllers\Api\V1\Admin\AdminServiceRequestController;
use App\Http\Controllers\Api\V1\Admin\AdminSessionController;
use App\Http\Controllers\Api\V1\Admin\AdminShipmentController;
use App\Http\Controllers\Api\V1\Admin\AdminShippingConfigurationController;
use App\Http\Controllers\Api\V1\Admin\AdminSystemSettingController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\Admin\AdminVendorAccountController;
use App\Http\Controllers\Api\V1\Admin\AdminWebsiteFeedbackController;
use App\Http\Controllers\Api\V1\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\V1\Affiliate\AffiliateReferralController;
use App\Http\Controllers\Api\V1\Assistant\AssistantChatController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\B2b\B2bCompanyController;
use App\Http\Controllers\Api\V1\B2b\B2bCompanyReviewController;
use App\Http\Controllers\Api\V1\B2b\B2bLeadController;
use App\Http\Controllers\Api\V1\Blog\BlogArticleController;
use App\Http\Controllers\Api\V1\Blog\BlogCategoryController;
use App\Http\Controllers\Api\V1\Blog\BlogEngagementController;
use App\Http\Controllers\Api\V1\Blog\BlogTagController;
use App\Http\Controllers\Api\V1\Cart\CartController;
use App\Http\Controllers\Api\V1\Catalog\CatalogSearchController;
use App\Http\Controllers\Api\V1\Catalog\CatalogSearchSuggestionsController;
use App\Http\Controllers\Api\V1\Catalog\CategoryController;
use App\Http\Controllers\Api\V1\Catalog\ProductController;
use App\Http\Controllers\Api\V1\Catalog\ProductEngagementController;
use App\Http\Controllers\Api\V1\Catalog\ProductPreorderController;
use App\Http\Controllers\Api\V1\Catalog\SearchController;
use App\Http\Controllers\Api\V1\Catalog\StoreReviewController;
use App\Http\Controllers\Api\V1\Catalog\VendorController;
use App\Http\Controllers\Api\V1\Catalog\VendorFollowController;
use App\Http\Controllers\Api\V1\Chat\AttachmentController;
use App\Http\Controllers\Api\V1\Chat\ConversationController;
use App\Http\Controllers\Api\V1\Chat\MessageController;
use App\Http\Controllers\Api\V1\Checkout\CheckoutController;
use App\Http\Controllers\Api\V1\Dashboard\Affiliate\AffiliateDashboardController;
use App\Http\Controllers\Api\V1\Dashboard\Affiliate\AffiliateLinkController;
use App\Http\Controllers\Api\V1\Dashboard\Affiliate\AffiliatePayoutController;
use App\Http\Controllers\Api\V1\Dashboard\Affiliate\AffiliatePlatformConfigController;
use App\Http\Controllers\Api\V1\Dashboard\Affiliate\AffiliateProductController;
use App\Http\Controllers\Api\V1\Dashboard\Affiliate\AffiliateReportController;
use App\Http\Controllers\Api\V1\Dashboard\Affiliate\AffiliateSettingsController;
use App\Http\Controllers\Api\V1\Dashboard\PartnerB2bCompanyController;
use App\Http\Controllers\Api\V1\Dashboard\PartnerB2bLeadController;
use App\Http\Controllers\Api\V1\Dashboard\PartnerB2bReviewController;
use App\Http\Controllers\Api\V1\Dashboard\VendorAnalyticsController;
use App\Http\Controllers\Api\V1\Dashboard\VendorCouponController;
use App\Http\Controllers\Api\V1\Dashboard\VendorDashboardController;
use App\Http\Controllers\Api\V1\Dashboard\VendorFinanceController;
use App\Http\Controllers\Api\V1\Dashboard\VendorInventoryController;
use App\Http\Controllers\Api\V1\Dashboard\VendorOrderController;
use App\Http\Controllers\Api\V1\Dashboard\VendorPreorderController;
use App\Http\Controllers\Api\V1\Dashboard\VendorProductAffiliateController;
use App\Http\Controllers\Api\V1\Dashboard\VendorProductController;
use App\Http\Controllers\Api\V1\Dashboard\VendorReturnController;
use App\Http\Controllers\Api\V1\Dashboard\VendorReturnPolicyController;
use App\Http\Controllers\Api\V1\Dashboard\VendorReviewInboxController;
use App\Http\Controllers\Api\V1\Dashboard\VendorSettingsController;
use App\Http\Controllers\Api\V1\Dashboard\VendorShippingSettingsController;
use App\Http\Controllers\Api\V1\Dashboard\VendorTeamController;
use App\Http\Controllers\Api\V1\Dashboard\VendorTeamInviteController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\Identity\OwnershipController;
use App\Http\Controllers\Api\V1\LiveHealthController;
use App\Http\Controllers\Api\V1\Loyalty\LoyaltyController;
use App\Http\Controllers\Api\V1\Order\OrderController;
use App\Http\Controllers\Api\V1\Order\OrderStoreReviewController;
use App\Http\Controllers\Api\V1\Payment\FakePaymentWebhookController;
use App\Http\Controllers\Api\V1\Payment\PaymentController;
use App\Http\Controllers\Api\V1\Payment\PaymentWebhookController;
use App\Http\Controllers\Api\V1\Platform\PlatformAnnouncementController;
use App\Http\Controllers\Api\V1\Platform\PlatformCommerceController;
use App\Http\Controllers\Api\V1\Platform\PlatformContactController;
use App\Http\Controllers\Api\V1\Platform\PlatformThemeController;
use App\Http\Controllers\Api\V1\Profile\AddressController;
use App\Http\Controllers\Api\V1\Profile\CustomerReviewController;
use App\Http\Controllers\Api\V1\Profile\NotificationController;
use App\Http\Controllers\Api\V1\Profile\NotificationPreferenceController;
use App\Http\Controllers\Api\V1\Profile\ProfileController;
use App\Http\Controllers\Api\V1\Profile\WishlistController;
use App\Http\Controllers\Api\V1\Projects\ProjectController;
use App\Http\Controllers\Api\V1\ReadinessController;
use App\Http\Controllers\Api\V1\Return\ReturnController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\DirectServiceBookingController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ProviderAnalyticsController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ProviderController as ServiceProviderController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ProviderFinanceController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ProviderFollowController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ProviderReviewController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ProviderSettingsController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ProviderWorkPolicyController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceBookingController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceBookingPaymentController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceCategoryController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceEngagementController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceOfferController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceRequestController;
use App\Http\Controllers\Api\V1\WebsiteFeedbackController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes Â Version 1
|--------------------------------------------------------------------------
|
| All V1 endpoints are prefixed with /api/v1 (see bootstrap/app.php).
|
*/

Route::get('/health/live', LiveHealthController::class)->name('api.v1.health.live');
Route::get('/health/ready', ReadinessController::class)->name('api.v1.health.ready');
Route::get('/health', HealthController::class)->name('api.v1.health');
Route::get('/readiness', ReadinessController::class)->name('api.v1.readiness');

Route::post('/assistant/chat', AssistantChatController::class)
    ->middleware('throttle:assistant-chat')
    ->name('api.v1.assistant.chat');

Route::post('/platform/consultation', [PlatformContactController::class, 'consultation'])
    ->middleware('throttle:6,1')
    ->name('api.v1.platform.consultation');

Route::post('/feedback', [WebsiteFeedbackController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('api.v1.feedback.store');
Route::get('/feedback/status', [WebsiteFeedbackController::class, 'status'])
    ->name('api.v1.feedback.status');

Route::get('/platform/theme', [PlatformThemeController::class, 'show'])
    ->name('api.v1.platform.theme');

Route::get('/platform/announcement', [PlatformAnnouncementController::class, 'show'])
    ->name('api.v1.platform.announcement');

Route::get('/platform/commerce', [PlatformCommerceController::class, 'show'])
    ->name('api.v1.platform.commerce');

Route::post('/webhooks/payments/myfatoorah', [PaymentWebhookController::class, 'myfatoorah'])
    ->middleware('throttle:webhooks')
    ->name('api.v1.webhooks.payments.myfatoorah');

Route::post('/webhooks/payments/fake', FakePaymentWebhookController::class)
    ->middleware('throttle:webhooks')
    ->name('api.v1.webhooks.payments.fake');

Route::get('/storefront/home', [\App\Http\Controllers\Api\V1\Storefront\HomeStorefrontController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);
Route::get('/categories/{slug}/items', [CategoryController::class, 'items']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/products/{id}/reviews', [ProductEngagementController::class, 'reviews']);
Route::get('/search', SearchController::class)->middleware('throttle:catalog-search');
Route::get('/catalog/search', CatalogSearchController::class)->middleware('throttle:catalog-search');
Route::get('/catalog/search/suggestions', CatalogSearchSuggestionsController::class)->middleware('throttle:catalog-search-suggestions');
Route::get('/vendors', [VendorController::class, 'index']);
Route::get('/vendors/{slug}', [VendorController::class, 'show']);
Route::get('/vendors/{slug}/products', [VendorController::class, 'products']);
Route::get('/vendors/{slug}/reviews', [StoreReviewController::class, 'index']);
Route::get('/service-categories', [ServiceCategoryController::class, 'index']);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{identifier}', [ServiceController::class, 'show']);
Route::get('/services/{identifier}/related', [ServiceController::class, 'related']);
Route::get('/providers/{slug}', [ServiceProviderController::class, 'show']);
Route::get('/providers/{slug}/services', [ServiceProviderController::class, 'services']);
Route::get('/providers/{slug}/portfolio', [ServiceProviderController::class, 'portfolio']);
Route::get('/providers/{slug}/reviews', [ProviderReviewController::class, 'index']);

Route::prefix('blog')->group(function () {
    Route::get('/articles', [BlogArticleController::class, 'index']);
    Route::get('/articles/{slug}', [BlogArticleController::class, 'show']);
    Route::get('/categories', [BlogCategoryController::class, 'index']);
    Route::get('/tags/{slug}', [BlogTagController::class, 'show']);
});

Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{slug}', [ProjectController::class, 'show']);

Route::prefix('b2b')->group(function () {
    Route::get('/companies', [B2bCompanyController::class, 'index']);
    Route::get('/companies/{slug}', [B2bCompanyController::class, 'show']);
    Route::get('/companies/{slug}/reviews', [B2bCompanyReviewController::class, 'index']);
    Route::get('/categories', [B2bCompanyController::class, 'categories']);
});

Route::post('/affiliate/referrals/click', [AffiliateReferralController::class, 'trackClick'])
    ->middleware('throttle:affiliate-click')
    ->name('api.v1.affiliate.referrals.click');

Route::get('/affiliate/referrals/resolve', [AffiliateReferralController::class, 'resolve'])
    ->middleware('throttle:affiliate-resolve')
    ->name('api.v1.affiliate.referrals.resolve');

Route::prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'show']);
    Route::delete('/', [CartController::class, 'clear']);
    Route::post('/items', [CartController::class, 'storeItem']);
    Route::patch('/items/{item}', [CartController::class, 'updateItem']);
    Route::delete('/items/{item}', [CartController::class, 'destroyItem']);
    Route::post('/validate', [CartController::class, 'validateCart']);
});

Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:otp');
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:otp');
    Route::post('/verify-email-otp', [AuthController::class, 'verifyEmailOtp'])->middleware('throttle:otp');
    Route::post('/resend-email-otp', [AuthController::class, 'resendEmailOtp'])->middleware('throttle:otp');
    Route::post('/resend-otp', [AuthController::class, 'resendOtp'])->middleware('throttle:otp');
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:otp');
    Route::post('/verify-password-reset-otp', [AuthController::class, 'verifyPasswordResetOtp'])->middleware('throttle:otp');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:otp');
});

Route::prefix('admin/auth')->middleware('throttle:auth')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
});

Route::middleware(['auth:admin', 'admin.active', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/session', [AdminSessionController::class, 'show']);
    Route::post('/auth/logout', [AdminAuthController::class, 'logout']);

    Route::get('/dashboard', [AdminDashboardController::class, 'show'])
        ->middleware('admin.permission:panel.access');

    Route::get('/system/health', [AdminOperationalHealthController::class, 'show'])
        ->middleware('admin.permission:system.health.view');

    Route::get('/users', [AdminUserController::class, 'index'])
        ->middleware('admin.permission:users.view');
    Route::get('/users/{user}', [AdminUserController::class, 'show'])
        ->middleware('admin.permission:users.view');
    Route::post('/users/{user}/suspend', [AdminUserController::class, 'suspend'])
        ->middleware('admin.permission:users.suspend');
    Route::post('/users/{user}/activate', [AdminUserController::class, 'activate'])
        ->middleware('admin.permission:users.update');

    Route::get('/vendor-accounts', [AdminVendorAccountController::class, 'index'])
        ->middleware('admin.permission:vendors.view');
    Route::get('/vendor-accounts/{vendorAccount}', [AdminVendorAccountController::class, 'show'])
        ->middleware('admin.permission:vendors.view');
    Route::post('/vendor-accounts/{vendorAccount}/suspend', [AdminVendorAccountController::class, 'suspend'])
        ->middleware('admin.permission:vendors.suspend');
    Route::post('/vendor-accounts/{vendorAccount}/activate', [AdminVendorAccountController::class, 'activate'])
        ->middleware('admin.permission:vendors.suspend');

    Route::get('/provider-accounts', [AdminProviderAccountController::class, 'index'])
        ->middleware('admin.permission:providers.view');
    Route::get('/provider-accounts/{providerAccount}', [AdminProviderAccountController::class, 'show'])
        ->middleware('admin.permission:providers.view');
    Route::post('/provider-accounts/{providerAccount}/suspend', [AdminProviderAccountController::class, 'suspend'])
        ->middleware('admin.permission:providers.suspend');
    Route::post('/provider-accounts/{providerAccount}/activate', [AdminProviderAccountController::class, 'activate'])
        ->middleware('admin.permission:providers.suspend');

    Route::get('/categories', [AdminCategoryController::class, 'index'])
        ->middleware('admin.permission:categories.view');
    Route::post('/categories', [AdminCategoryController::class, 'store'])
        ->middleware('admin.permission:categories.manage');
    Route::get('/categories/{category}', [AdminCategoryController::class, 'show'])
        ->middleware('admin.permission:categories.view');
    Route::patch('/categories/{category}', [AdminCategoryController::class, 'update'])
        ->middleware('admin.permission:categories.manage');
    Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])
        ->middleware('admin.permission:categories.manage');

    Route::get('/orders', [AdminOrderController::class, 'index'])
        ->middleware('admin.permission:orders.view');
    Route::get('/orders/{order}', [AdminOrderController::class, 'show'])
        ->middleware('admin.permission:orders.view');
    Route::post('/orders/{order}/cancel', [AdminOrderController::class, 'cancel'])
        ->middleware('admin.permission:orders.action');

    Route::get('/products', [AdminProductController::class, 'index'])
        ->middleware('admin.permission:products.view');
    Route::get('/products/{product}', [AdminProductController::class, 'show'])
        ->middleware('admin.permission:products.view');
    Route::post('/products/{product}/activate', [AdminProductController::class, 'activate'])
        ->middleware('admin.permission:products.update');
    Route::post('/products/{product}/deactivate', [AdminProductController::class, 'deactivate'])
        ->middleware('admin.permission:products.update');

    Route::get('/payouts', [AdminPayoutController::class, 'index'])
        ->middleware('admin.permission:payouts.view');
    Route::post('/payouts/{payout}/approve', [AdminPayoutController::class, 'approve'])
        ->middleware('admin.permission:payouts.approve');
    Route::post('/payouts/{payout}/reject', [AdminPayoutController::class, 'reject'])
        ->middleware('admin.permission:payouts.approve');
    Route::post('/payouts/{payout}/mark-paid', [AdminPayoutController::class, 'markPaid'])
        ->middleware('admin.permission:payouts.process');

    Route::get('/provider/payouts', [AdminProviderPayoutController::class, 'index'])
        ->middleware('admin.permission:payouts.view');
    Route::post('/provider/payouts/{providerPayout}/approve', [AdminProviderPayoutController::class, 'approve'])
        ->middleware('admin.permission:payouts.approve');
    Route::post('/provider/payouts/{providerPayout}/reject', [AdminProviderPayoutController::class, 'reject'])
        ->middleware('admin.permission:payouts.approve');
    Route::post('/provider/payouts/{providerPayout}/mark-paid', [AdminProviderPayoutController::class, 'markPaid'])
        ->middleware('admin.permission:payouts.process');

    Route::get('/affiliate/payouts', [AdminAffiliatePayoutController::class, 'index'])
        ->middleware('admin.permission:affiliate.view');
    Route::post('/affiliate/payouts/{affiliatePayout}/approve', [AdminAffiliatePayoutController::class, 'approve'])
        ->middleware('admin.permission:affiliate.payouts.process');
    Route::post('/affiliate/payouts/{affiliatePayout}/processing', [AdminAffiliatePayoutController::class, 'markProcessing'])
        ->middleware('admin.permission:affiliate.payouts.process');
    Route::post('/affiliate/payouts/{affiliatePayout}/mark-processing', [AdminAffiliatePayoutController::class, 'markProcessing'])
        ->middleware('admin.permission:affiliate.payouts.process');
    Route::post('/affiliate/payouts/{affiliatePayout}/reject', [AdminAffiliatePayoutController::class, 'reject'])
        ->middleware('admin.permission:affiliate.payouts.process');
    Route::post('/affiliate/payouts/{affiliatePayout}/mark-paid', [AdminAffiliatePayoutController::class, 'markPaid'])
        ->middleware('admin.permission:affiliate.payouts.process');

    Route::get('/audit-logs', [AdminAuditLogController::class, 'index'])
        ->middleware('admin.permission:audit.view');
    Route::get('/audit-logs/{auditLog}', [AdminAuditLogController::class, 'show'])
        ->middleware('admin.permission:audit.view');

    Route::get('/settings', [AdminSystemSettingController::class, 'index'])
        ->middleware('admin.permission:settings.view');
    Route::patch('/settings', [AdminSystemSettingController::class, 'update'])
        ->middleware('admin.permission:settings.update');

    Route::get('/payments', [AdminPaymentController::class, 'index'])
        ->middleware('admin.permission:payments.view');
    Route::get('/payments/{payment}', [AdminPaymentController::class, 'show'])
        ->middleware('admin.permission:payments.view');

    Route::get('/return-requests', [AdminReturnController::class, 'index'])
        ->middleware('admin.permission:refunds.view');
    Route::get('/return-requests/{returnRequest}', [AdminReturnController::class, 'show'])
        ->middleware('admin.permission:refunds.view');
    Route::post('/return-requests/{returnRequest}/approve', [AdminReturnController::class, 'approve'])
        ->middleware('admin.permission:refunds.approve');
    Route::post('/return-requests/{returnRequest}/reject', [AdminReturnController::class, 'reject'])
        ->middleware('admin.permission:refunds.approve');
    Route::post('/return-requests/{returnRequest}/mark-received', [AdminReturnController::class, 'markReceived'])
        ->middleware('admin.permission:refunds.approve');
    Route::post('/return-requests/{returnRequest}/mark-inspected', [AdminReturnController::class, 'markInspected'])
        ->middleware('admin.permission:refunds.approve');
    Route::post('/return-requests/{returnRequest}/process-refund', [AdminReturnController::class, 'processRefund'])
        ->middleware('admin.permission:refunds.approve');

    Route::get('/coupons', [AdminCouponController::class, 'index'])
        ->middleware('admin.permission:coupons.view');
    Route::get('/coupons/{coupon}', [AdminCouponController::class, 'show'])
        ->middleware('admin.permission:coupons.view');
    Route::post('/coupons/{coupon}/activate', [AdminCouponController::class, 'activate'])
        ->middleware('admin.permission:coupons.manage');
    Route::post('/coupons/{coupon}/deactivate', [AdminCouponController::class, 'deactivate'])
        ->middleware('admin.permission:coupons.manage');

    Route::get('/reviews/products', [AdminReviewController::class, 'productReviews'])
        ->middleware('admin.permission:reviews.view');
    Route::get('/reviews/stores', [AdminReviewController::class, 'storeReviews'])
        ->middleware('admin.permission:reviews.view');
    Route::get('/reviews/providers', [AdminReviewController::class, 'providerReviews'])
        ->middleware('admin.permission:reviews.view');
    Route::post('/reviews/providers/{providerReview}/hide', [AdminReviewController::class, 'hideProviderReview'])
        ->middleware('admin.permission:reviews.moderate');
    Route::post('/reviews/providers/{providerReview}/unhide', [AdminReviewController::class, 'unhideProviderReview'])
        ->middleware('admin.permission:reviews.moderate');

    Route::get('/roles', [AdminRoleController::class, 'index'])
        ->middleware('admin.permission:roles.view');
    Route::get('/roles/{role}', [AdminRoleController::class, 'show'])
        ->middleware('admin.permission:roles.view');
    Route::put('/roles/{role}/permissions', [AdminRoleController::class, 'syncPermissions'])
        ->middleware('admin.permission:roles.manage');
    Route::get('/permissions', [AdminPermissionController::class, 'index'])
        ->middleware('admin.permission:roles.view');

    Route::get('/service-requests', [AdminServiceRequestController::class, 'index'])
        ->middleware('admin.permission:service_requests.view');
    Route::get('/service-requests/{serviceRequest}', [AdminServiceRequestController::class, 'show'])
        ->middleware('admin.permission:service_requests.view');

    Route::get('/service-bookings', [AdminServiceBookingController::class, 'index'])
        ->middleware('admin.permission:bookings.view');
    Route::get('/service-bookings/{serviceBooking}', [AdminServiceBookingController::class, 'show'])
        ->middleware('admin.permission:bookings.view');

    Route::get('/inventory/products', [AdminInventoryController::class, 'products'])
        ->middleware('admin.permission:inventory.view');
    Route::get('/inventory/movements', [AdminInventoryController::class, 'movements'])
        ->middleware('admin.permission:inventory.view');

    Route::get('/shipments', [AdminShipmentController::class, 'index'])
        ->middleware('admin.permission:shipping.view');
    Route::get('/shipments/{shipment}', [AdminShipmentController::class, 'show'])
        ->middleware('admin.permission:shipping.view');

    Route::get('/shipping/carriers', [AdminShippingConfigurationController::class, 'carriers'])
        ->middleware('admin.permission:shipping.view');
    Route::post('/shipping/carriers', [AdminShippingConfigurationController::class, 'storeCarrier'])
        ->middleware('admin.permission:shipping.manage');
    Route::patch('/shipping/carriers/{carrier}', [AdminShippingConfigurationController::class, 'updateCarrier'])
        ->middleware('admin.permission:shipping.manage');
    Route::delete('/shipping/carriers/{carrier}', [AdminShippingConfigurationController::class, 'destroyCarrier'])
        ->middleware('admin.permission:shipping.manage');
    Route::get('/shipping/zones', [AdminShippingConfigurationController::class, 'zones'])
        ->middleware('admin.permission:shipping.view');
    Route::post('/shipping/zones', [AdminShippingConfigurationController::class, 'storeZone'])
        ->middleware('admin.permission:shipping.manage');
    Route::patch('/shipping/zones/{zone}', [AdminShippingConfigurationController::class, 'updateZone'])
        ->middleware('admin.permission:shipping.manage');
    Route::delete('/shipping/zones/{zone}', [AdminShippingConfigurationController::class, 'destroyZone'])
        ->middleware('admin.permission:shipping.manage');
    Route::get('/shipping/methods', [AdminShippingConfigurationController::class, 'methods'])
        ->middleware('admin.permission:shipping.view');
    Route::post('/shipping/methods', [AdminShippingConfigurationController::class, 'storeMethod'])
        ->middleware('admin.permission:shipping.manage');
    Route::patch('/shipping/methods/{method}', [AdminShippingConfigurationController::class, 'updateMethod'])
        ->middleware('admin.permission:shipping.manage');
    Route::delete('/shipping/methods/{method}', [AdminShippingConfigurationController::class, 'destroyMethod'])
        ->middleware('admin.permission:shipping.manage');
    Route::get('/shipping/rate-rules', [AdminShippingConfigurationController::class, 'rateRules'])
        ->middleware('admin.permission:shipping.view');
    Route::post('/shipping/rate-rules', [AdminShippingConfigurationController::class, 'storeRateRule'])
        ->middleware('admin.permission:shipping.manage');
    Route::patch('/shipping/rate-rules/{rateRule}', [AdminShippingConfigurationController::class, 'updateRateRule'])
        ->middleware('admin.permission:shipping.manage');
    Route::delete('/shipping/rate-rules/{rateRule}', [AdminShippingConfigurationController::class, 'destroyRateRule'])
        ->middleware('admin.permission:shipping.manage');
    Route::get('/shipping/vendor-profiles', [AdminShippingConfigurationController::class, 'vendorProfiles'])
        ->middleware('admin.permission:shipping.view');
    Route::post('/shipping/vendor-profiles', [AdminShippingConfigurationController::class, 'storeVendorProfile'])
        ->middleware('admin.permission:shipping.manage');
    Route::patch('/shipping/vendor-profiles/{profile}', [AdminShippingConfigurationController::class, 'updateVendorProfile'])
        ->middleware('admin.permission:shipping.manage');
    Route::delete('/shipping/vendor-profiles/{profile}', [AdminShippingConfigurationController::class, 'destroyVendorProfile'])
        ->middleware('admin.permission:shipping.manage');

    Route::get('/notifications/deliveries', [AdminNotificationController::class, 'deliveries'])
        ->middleware('admin.permission:notifications.view');
    Route::post('/notifications/deliveries/{delivery}/retry', [AdminNotificationController::class, 'retryDelivery'])
        ->middleware('admin.permission:notifications.manage');
    Route::get('/notifications/broadcasts', [AdminNotificationBroadcastController::class, 'index'])
        ->middleware('admin.permission:notifications.view');
    Route::post('/notifications/broadcasts', [AdminNotificationBroadcastController::class, 'store'])
        ->middleware('admin.permission:notifications.manage')
        ->middleware('throttle:admin-broadcasts');
    Route::get('/notifications/broadcasts/{broadcast}', [AdminNotificationBroadcastController::class, 'show'])
        ->middleware('admin.permission:notifications.view');

    Route::get('/feedback', [AdminWebsiteFeedbackController::class, 'index'])
        ->middleware('admin.permission:feedback.view');
    Route::delete('/feedback/{websiteFeedback}', [AdminWebsiteFeedbackController::class, 'destroy'])
        ->middleware('admin.permission:feedback.manage');

    Route::get('/announcement', [AdminAnnouncementController::class, 'show'])
        ->middleware('admin.permission:settings.view');
    Route::patch('/announcement', [AdminAnnouncementController::class, 'update'])
        ->middleware('admin.permission:settings.update');

    Route::get('/notifications', [AdminNotificationController::class, 'index'])
        ->middleware('admin.permission:notifications.view');
    Route::get('/notifications/{notification}', [AdminNotificationController::class, 'show'])
        ->middleware('admin.permission:notifications.view');

    Route::get('/chat/conversations', [AdminChatController::class, 'indexConversations'])
        ->middleware('admin.permission:chat.view');
    Route::get('/chat/conversations/{conversation}', [AdminChatController::class, 'showConversation'])
        ->middleware('admin.permission:chat.view');
    Route::get('/chat/conversations/{conversation}/messages', [AdminChatController::class, 'indexMessages'])
        ->middleware('admin.permission:chat.view');
    Route::get('/chat/reports', [AdminChatController::class, 'indexReports'])
        ->middleware('admin.permission:chat.view');
    Route::get('/chat/reports/{report}', [AdminChatController::class, 'showReport'])
        ->middleware('admin.permission:chat.view');
    Route::patch('/chat/reports/{report}', [AdminChatController::class, 'updateReport'])
        ->middleware('admin.permission:chat.moderate');

    Route::get('/transactions', [AdminFinancialTransactionController::class, 'index'])
        ->middleware('admin.permission:balances.view');
    Route::get('/transactions/{transaction}', [AdminFinancialTransactionController::class, 'show'])
        ->middleware('admin.permission:balances.view');

    Route::get('/finance/summary', [AdminFinanceController::class, 'summary'])
        ->middleware('admin.permission:balances.view');
    Route::get('/finance/report', [AdminFinanceController::class, 'exportReport'])
        ->middleware('admin.permission:balances.view');

    Route::get('/reports/summary', [AdminReportController::class, 'summary'])
        ->middleware('admin.permission:panel.access');

    Route::prefix('analytics')->group(function () {
        Route::get('/overview', [AdminAnalyticsController::class, 'overview'])
            ->middleware('admin.permission:analytics.view');
        Route::get('/sales', [AdminAnalyticsController::class, 'sales'])
            ->middleware('admin.permission:analytics.view');
        Route::get('/funnel', [AdminAnalyticsController::class, 'funnel'])
            ->middleware('admin.permission:analytics.view');
        Route::get('/cohorts', [AdminAnalyticsController::class, 'cohorts'])
            ->middleware('admin.permission:analytics.view');
        Route::get('/search', [AdminAnalyticsController::class, 'search'])
            ->middleware('admin.permission:search.analytics.view');
        Route::get('/export', [AdminAnalyticsController::class, 'export'])
            ->middleware(['admin.permission:analytics.export', 'throttle:analytics-export']);
    });

    Route::post('/cms/media/image', [AdminCmsMediaController::class, 'uploadImage']);

    Route::get('/affiliate/profiles', [AdminAffiliateProfileController::class, 'index'])
        ->middleware('admin.permission:affiliate.view');
    Route::get('/affiliate/profiles/{affiliateProfile}', [AdminAffiliateProfileController::class, 'show'])
        ->middleware('admin.permission:affiliate.view');
    Route::post('/affiliate/profiles/{affiliateProfile}/suspend', [AdminAffiliateProfileController::class, 'suspend'])
        ->middleware('admin.permission:affiliate.manage');
    Route::post('/affiliate/profiles/{affiliateProfile}/activate', [AdminAffiliateProfileController::class, 'activate'])
        ->middleware('admin.permission:affiliate.manage');

    Route::get('/affiliate/links', [AdminAffiliateLinkController::class, 'index'])
        ->middleware('admin.permission:affiliate.view');
    Route::get('/affiliate/links/{affiliateLink}', [AdminAffiliateLinkController::class, 'show'])
        ->middleware('admin.permission:affiliate.view');
    Route::post('/affiliate/links/{affiliateLink}/disable', [AdminAffiliateLinkController::class, 'disable'])
        ->middleware('admin.permission:affiliate.manage');

    Route::get('/affiliate/clicks', [AdminAffiliateClickController::class, 'index'])
        ->middleware('admin.permission:affiliate.view');
    Route::get('/affiliate/clicks/{affiliateClick}', [AdminAffiliateClickController::class, 'show'])
        ->middleware('admin.permission:affiliate.view');

    Route::get('/affiliate/attributions', [AdminAffiliateAttributionController::class, 'index'])
        ->middleware('admin.permission:affiliate.view');
    Route::get('/affiliate/attributions/{affiliateAttribution}', [AdminAffiliateAttributionController::class, 'show'])
        ->middleware('admin.permission:affiliate.view');

    Route::get('/affiliate/commissions', [AdminAffiliateCommissionController::class, 'index'])
        ->middleware('admin.permission:commissions.view');
    Route::get('/affiliate/commissions/{affiliateCommission}', [AdminAffiliateCommissionController::class, 'show'])
        ->middleware('admin.permission:commissions.view');

    Route::prefix('blog')->group(function () {
        Route::get('/articles', [AdminBlogArticleController::class, 'index'])
            ->middleware('admin.permission:blog.view');
        Route::post('/articles', [AdminBlogArticleController::class, 'store'])
            ->middleware('admin.permission:blog.manage');
        Route::get('/articles/{article}', [AdminBlogArticleController::class, 'show'])
            ->middleware('admin.permission:blog.view');
        Route::patch('/articles/{article}', [AdminBlogArticleController::class, 'update'])
            ->middleware('admin.permission:blog.manage');
        Route::delete('/articles/{article}', [AdminBlogArticleController::class, 'destroy'])
            ->middleware('admin.permission:blog.manage');
        Route::post('/articles/{article}/publish', [AdminBlogArticleController::class, 'publish'])
            ->middleware('admin.permission:blog.manage');
        Route::post('/articles/{article}/unpublish', [AdminBlogArticleController::class, 'unpublish'])
            ->middleware('admin.permission:blog.manage');
        Route::post('/articles/{article}/archive', [AdminBlogArticleController::class, 'archive'])
            ->middleware('admin.permission:blog.manage');

        Route::get('/categories', [AdminBlogCategoryController::class, 'index'])
            ->middleware('admin.permission:blog.view');
        Route::post('/categories', [AdminBlogCategoryController::class, 'store'])
            ->middleware('admin.permission:blog.manage');
        Route::get('/categories/{category}', [AdminBlogCategoryController::class, 'show'])
            ->middleware('admin.permission:blog.view');
        Route::patch('/categories/{category}', [AdminBlogCategoryController::class, 'update'])
            ->middleware('admin.permission:blog.manage');
        Route::delete('/categories/{category}', [AdminBlogCategoryController::class, 'destroy'])
            ->middleware('admin.permission:blog.manage');

        Route::get('/tags', [AdminBlogTagController::class, 'index'])
            ->middleware('admin.permission:blog.view');
        Route::post('/tags', [AdminBlogTagController::class, 'store'])
            ->middleware('admin.permission:blog.manage');
        Route::get('/tags/{tag}', [AdminBlogTagController::class, 'show'])
            ->middleware('admin.permission:blog.view');
        Route::patch('/tags/{tag}', [AdminBlogTagController::class, 'update'])
            ->middleware('admin.permission:blog.manage');
        Route::delete('/tags/{tag}', [AdminBlogTagController::class, 'destroy'])
            ->middleware('admin.permission:blog.manage');
    });

    Route::prefix('projects')->group(function () {
        Route::get('/', [AdminProjectController::class, 'index'])
            ->middleware('admin.permission:projects.view');
        Route::post('/', [AdminProjectController::class, 'store'])
            ->middleware('admin.permission:projects.manage');
        Route::get('/{project}', [AdminProjectController::class, 'show'])
            ->middleware('admin.permission:projects.view');
        Route::patch('/{project}', [AdminProjectController::class, 'update'])
            ->middleware('admin.permission:projects.manage');
        Route::delete('/{project}', [AdminProjectController::class, 'destroy'])
            ->middleware('admin.permission:projects.manage');
        Route::post('/{project}/publish', [AdminProjectController::class, 'publish'])
            ->middleware('admin.permission:projects.manage');
        Route::post('/{project}/unpublish', [AdminProjectController::class, 'unpublish'])
            ->middleware('admin.permission:projects.manage');
        Route::post('/{project}/archive', [AdminProjectController::class, 'archive'])
            ->middleware('admin.permission:projects.manage');
    });

    Route::prefix('b2b')->group(function () {
        Route::get('/companies', [AdminB2bCompanyController::class, 'index'])
            ->middleware('admin.permission:b2b.view');
        Route::post('/companies', [AdminB2bCompanyController::class, 'store'])
            ->middleware('admin.permission:b2b.manage');
        Route::get('/companies/{company}', [AdminB2bCompanyController::class, 'show'])
            ->middleware('admin.permission:b2b.view');
        Route::patch('/companies/{company}', [AdminB2bCompanyController::class, 'update'])
            ->middleware('admin.permission:b2b.manage');
        Route::delete('/companies/{company}', [AdminB2bCompanyController::class, 'destroy'])
            ->middleware('admin.permission:b2b.manage');
        Route::post('/companies/{company}/publish', [AdminB2bCompanyController::class, 'publish'])
            ->middleware('admin.permission:b2b.manage');
        Route::post('/companies/{company}/unpublish', [AdminB2bCompanyController::class, 'unpublish'])
            ->middleware('admin.permission:b2b.manage');
        Route::post('/companies/{company}/archive', [AdminB2bCompanyController::class, 'archive'])
            ->middleware('admin.permission:b2b.manage');
        Route::post('/companies/{company}/verify', [AdminB2bCompanyController::class, 'verify'])
            ->middleware('admin.permission:b2b.manage');
        Route::post('/companies/{company}/reject-verification', [AdminB2bCompanyController::class, 'rejectVerification'])
            ->middleware('admin.permission:b2b.manage');
        Route::post('/companies/{company}/feature', [AdminB2bCompanyController::class, 'feature'])
            ->middleware('admin.permission:b2b.manage');
        Route::post('/companies/{company}/unfeature', [AdminB2bCompanyController::class, 'unfeature'])
            ->middleware('admin.permission:b2b.manage');
        Route::get('/categories', [AdminB2bCompanyController::class, 'categories'])
            ->middleware('admin.permission:b2b.view');
        Route::get('/tags', [AdminB2bCompanyController::class, 'tags'])
            ->middleware('admin.permission:b2b.view');
        Route::get('/leads', [AdminB2bCompanyController::class, 'leads'])
            ->middleware('admin.permission:b2b.leads.view');
        Route::get('/leads/{lead}', [AdminB2bCompanyController::class, 'showLead'])
            ->middleware('admin.permission:b2b.leads.view');
    });

    Route::prefix('loyalty')->group(function () {
        Route::get('/customers/{user}', [AdminLoyaltyController::class, 'showCustomer'])
            ->middleware('admin.permission:loyalty.view');
        Route::post('/customers/{user}/adjust', [AdminLoyaltyController::class, 'adjust'])
            ->middleware('admin.permission:loyalty.adjust');
    });
});

Route::middleware(['auth:sanctum', 'account.active'])->group(function () {
    Route::middleware('marketplace.access')->group(function () {
        Route::prefix('auth')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });

        Route::get('/vendor/accounts/{vendorAccount}', [OwnershipController::class, 'showVendorAccount'])
            ->middleware('role:vendor');

        Route::get('/provider/accounts/{providerAccount}', [OwnershipController::class, 'showProviderAccount'])
            ->middleware('role:provider');

        Route::post('/cart/merge', [CartController::class, 'merge']);

        Route::post('/checkout/preview', [CheckoutController::class, 'preview']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::get('/orders/{order}/store-review-eligibility', [OrderStoreReviewController::class, 'eligibility']);
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
        Route::post('/vendors/{slug}/reviews', [StoreReviewController::class, 'store']);
        Route::patch('/store-reviews/{review}', [StoreReviewController::class, 'update']);
        Route::delete('/store-reviews/{review}', [StoreReviewController::class, 'destroy']);
        Route::post('/vendors/{slug}/follow', [VendorFollowController::class, 'follow']);
        Route::delete('/vendors/{slug}/follow', [VendorFollowController::class, 'unfollow']);
        Route::post('/providers/{slug}/follow', [ProviderFollowController::class, 'follow']);
        Route::delete('/providers/{slug}/follow', [ProviderFollowController::class, 'unfollow']);
        Route::get('/orders/{order}/payment', [PaymentController::class, 'show']);
        Route::post('/orders/{order}/payment', [PaymentController::class, 'initiate']);
        Route::post('/orders/{order}/payment/submit', [PaymentController::class, 'submit']);
        Route::post('/orders/{order}/payment/simulate', [PaymentController::class, 'simulate']);
        Route::get('/orders/{order}/payment/callback', [PaymentController::class, 'callback']);

        Route::get('/returns', [ReturnController::class, 'index']);
        Route::post('/returns', [ReturnController::class, 'store']);
        Route::get('/returns/{returnRequest}', [ReturnController::class, 'show']);
        Route::post('/returns/{returnRequest}/evidence', [ReturnController::class, 'storeEvidence']);
        Route::get('/vendor-orders/{vendorOrder}/items/{orderItem}/return-eligibility', [ReturnController::class, 'eligibility']);

        Route::get('/service-requests', [ServiceRequestController::class, 'index']);
        Route::post('/service-requests', [ServiceRequestController::class, 'store']);
        Route::get('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'show']);
        Route::post('/service-requests/{serviceRequest}/cancel', [ServiceRequestController::class, 'cancel']);
        Route::post('/service-requests/{serviceRequest}/attachments', [ServiceRequestController::class, 'storeAttachment']);
        Route::post('/service-requests/{serviceRequest}/offers', [ServiceOfferController::class, 'store']);
        Route::post('/service-offers/{serviceOffer}/accept', [ServiceOfferController::class, 'accept']);
        Route::post('/service-offers/{serviceOffer}/reject', [ServiceOfferController::class, 'reject']);
        Route::get('/service-bookings', [ServiceBookingController::class, 'index']);
        Route::get('/service-bookings/{serviceBooking}', [ServiceBookingController::class, 'show']);
        Route::get('/service-bookings/{serviceBooking}/payment', [ServiceBookingPaymentController::class, 'show']);
        Route::post('/service-bookings/{serviceBooking}/payment/simulate', [ServiceBookingPaymentController::class, 'simulate']);
        Route::post('/service-bookings/{serviceBooking}/accept-schedule', [ServiceBookingController::class, 'acceptSchedule']);
        Route::post('/service-bookings/{serviceBooking}/decline-schedule', [ServiceBookingController::class, 'declineSchedule']);
        Route::post('/service-bookings/{serviceBooking}/cancel', [ServiceBookingController::class, 'cancelAsCustomer']);
        Route::post('/service-bookings/{serviceBooking}/review', [ProviderReviewController::class, 'store'])->middleware('throttle:30,1');
        Route::patch('/provider-reviews/{review}', [ProviderReviewController::class, 'update'])->middleware('throttle:30,1');
        Route::delete('/provider-reviews/{review}', [ProviderReviewController::class, 'destroy'])->middleware('throttle:30,1');
        Route::post('/provider-reviews/{review}/response', [ProviderReviewController::class, 'respond'])->middleware('throttle:30,1');
        Route::post('/services/{identifier}/booking-preview', [DirectServiceBookingController::class, 'preview'])->middleware('throttle:30,1');
        Route::post('/services/{identifier}/direct-booking', [DirectServiceBookingController::class, 'store'])->middleware('throttle:20,1');

        Route::post('/platform/newsletter', [PlatformContactController::class, 'newsletter'])
            ->middleware('throttle:10,1');

        Route::prefix('profile')->group(function () {
            Route::get('/', [ProfileController::class, 'show']);
            Route::patch('/', [ProfileController::class, 'update']);
            Route::patch('/password', [ProfileController::class, 'updatePassword']);
            Route::post('/avatar', [ProfileController::class, 'uploadAvatar']);
            Route::delete('/avatar', [ProfileController::class, 'deleteAvatar']);

            Route::post('/phone/request-change', [ProfileController::class, 'requestPhoneChange'])
                ->middleware('throttle:otp');
            Route::post('/phone/resend-change', [ProfileController::class, 'resendPhoneChange'])
                ->middleware('throttle:otp');
            Route::post('/phone/verify-change', [ProfileController::class, 'verifyPhoneChange'])
                ->middleware('throttle:otp');

            Route::post('/email/request-verification', [ProfileController::class, 'requestEmailVerification'])
                ->middleware('throttle:otp');
            Route::post('/email/resend-verification', [ProfileController::class, 'resendEmailVerification'])
                ->middleware('throttle:otp');
            Route::post('/email/verify', [ProfileController::class, 'verifyEmailVerification'])
                ->middleware('throttle:otp');

            Route::get('/addresses', [AddressController::class, 'index']);
            Route::post('/addresses', [AddressController::class, 'store']);
            Route::get('/addresses/{address}', [AddressController::class, 'show']);
            Route::patch('/addresses/{address}', [AddressController::class, 'update']);
            Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
            Route::post('/addresses/{address}/default', [AddressController::class, 'setDefault']);

            Route::get('/wishlist/summary', [WishlistController::class, 'summary']);
            Route::get('/wishlist', [WishlistController::class, 'index']);
            Route::delete('/wishlist', [WishlistController::class, 'clear']);
            Route::get('/reviews', [CustomerReviewController::class, 'index']);
            Route::get('/reviews/{type}/{id}', [CustomerReviewController::class, 'show'])
                ->whereIn('type', ['product', 'store']);

            Route::get('/notifications', [NotificationController::class, 'index']);
            Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
            Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
            Route::delete('/notifications', [NotificationController::class, 'destroyAll']);
            Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
            Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);
            Route::post('/notifications/devices', [NotificationController::class, 'registerDevice'])
                ->middleware('throttle:notification-devices');
            Route::get('/notification-preferences', [NotificationPreferenceController::class, 'show']);
            Route::patch('/notification-preferences', [NotificationPreferenceController::class, 'update'])
                ->middleware('throttle:notification-preferences');

            Route::get('/chat/report-reasons', [MessageController::class, 'reportReasons']);
            Route::get('/conversations/unread-count', [ConversationController::class, 'unreadCount']);
            Route::get('/conversations', [ConversationController::class, 'index']);
            Route::post('/conversations', [ConversationController::class, 'store'])
                ->middleware('throttle:chat-conversations');
            Route::get('/conversations/{id}', [ConversationController::class, 'show']);
            Route::patch('/conversations/{id}/read', [ConversationController::class, 'markRead']);
            Route::delete('/conversations/{id}', [ConversationController::class, 'destroy']);
            Route::post('/conversations/{id}/typing', [ConversationController::class, 'typing'])
                ->middleware('throttle:chat-typing');
            Route::get('/conversations/{id}/messages', [MessageController::class, 'index']);
            Route::post('/conversations/{id}/messages', [MessageController::class, 'store'])
                ->middleware('throttle:chat-messages');
            Route::patch('/conversations/{conversationId}/messages/{messageId}', [MessageController::class, 'update'])
                ->middleware('throttle:chat-messages');
            Route::delete('/conversations/{conversationId}/messages/{messageId}', [MessageController::class, 'destroy'])
                ->middleware('throttle:chat-messages');
            Route::post('/conversations/{conversationId}/messages/{messageId}/report', [MessageController::class, 'report'])
                ->middleware('throttle:chat-messages');
            Route::get('/conversations/{conversationId}/attachments/{attachmentId}', [AttachmentController::class, 'show'])
                ->middleware('throttle:chat-attachments');
        });

        Route::post('/products/{id}/reviews', [ProductEngagementController::class, 'storeReview']);
        Route::patch('/products/{id}/reviews', [ProductEngagementController::class, 'updateReview']);
        Route::delete('/products/{id}/reviews', [ProductEngagementController::class, 'destroyReview']);
        Route::post('/products/{id}/like', [ProductEngagementController::class, 'toggleLike']);
        Route::post('/products/{id}/wishlist', [ProductEngagementController::class, 'toggleWishlist'])
            ->middleware('throttle:wishlist-toggle');
        Route::post('/services/{identifier}/wishlist', [ServiceEngagementController::class, 'toggleWishlist'])
            ->middleware('throttle:wishlist-toggle');
        Route::post('/blog/articles/{slug}/wishlist', [BlogEngagementController::class, 'toggleWishlist'])
            ->middleware('throttle:wishlist-toggle');

        Route::prefix('b2b')->group(function () {
            Route::post('/companies/{slug}/leads', [B2bLeadController::class, 'store'])
                ->middleware('throttle:b2b-leads');
            Route::post('/companies/{slug}/reviews', [B2bCompanyReviewController::class, 'store']);
            Route::get('/leads', [B2bLeadController::class, 'index']);
            Route::get('/leads/{lead}', [B2bLeadController::class, 'show']);
        });

        Route::prefix('loyalty')->group(function () {
            Route::get('/', [LoyaltyController::class, 'show']);
            Route::get('/transactions', [LoyaltyController::class, 'transactions']);
            Route::get('/rewards', [LoyaltyController::class, 'rewards']);
        });

        Route::post('/products/{id}/preorder', [ProductPreorderController::class, 'store']);
        Route::get('/products/{id}/preorder', [ProductPreorderController::class, 'status']);

        Route::prefix('team-invites')->group(function () {
            Route::get('/{token}', [VendorTeamInviteController::class, 'show']);
            Route::post('/{token}/accept', [VendorTeamInviteController::class, 'accept']);
            Route::post('/{token}/reject', [VendorTeamInviteController::class, 'reject']);
        });

        Route::middleware('role:vendor')->prefix('dashboard/vendor')->group(function () {
            Route::get('/access', [VendorTeamController::class, 'access']);
            Route::get('/team', [VendorTeamController::class, 'index']);
            Route::post('/team/invite', [VendorTeamController::class, 'invite']);
            Route::patch('/team/{member}', [VendorTeamController::class, 'update']);
            Route::delete('/team/{member}', [VendorTeamController::class, 'destroy']);
            Route::get('/reviews/inbox', [VendorReviewInboxController::class, 'index']);
            Route::post('/reviews/inbox/{type}/{reviewId}/reply', [VendorReviewInboxController::class, 'reply']);
            Route::get('/overview', [VendorDashboardController::class, 'overview']);
            Route::get('/settings', [VendorSettingsController::class, 'show']);
            Route::patch('/settings', [VendorSettingsController::class, 'update']);
            Route::post('/settings/logo', [VendorSettingsController::class, 'uploadLogo']);
            Route::delete('/settings/logo', [VendorSettingsController::class, 'deleteLogo']);
            Route::post('/settings/cover', [VendorSettingsController::class, 'uploadCover']);
            Route::delete('/settings/cover', [VendorSettingsController::class, 'deleteCover']);
            Route::put('/settings/legal', [VendorSettingsController::class, 'updateLegal']);
            Route::put('/settings/bank-account', [VendorSettingsController::class, 'updateBankAccount']);
            Route::put('/settings/working-hours', [VendorSettingsController::class, 'updateWorkingHours']);
            Route::get('/b2b/categories', [PartnerB2bCompanyController::class, 'categoriesVendor']);
            Route::get('/b2b/tags', [PartnerB2bCompanyController::class, 'tagsVendor']);
            Route::get('/b2b/company', [PartnerB2bCompanyController::class, 'showVendor']);
            Route::post('/b2b/company', [PartnerB2bCompanyController::class, 'storeVendor']);
            Route::patch('/b2b/company', [PartnerB2bCompanyController::class, 'updateVendor']);
            Route::post('/b2b/company/media', [PartnerB2bCompanyController::class, 'uploadVendorImage']);
            Route::post('/b2b/company/portfolio', [PartnerB2bCompanyController::class, 'uploadVendorPortfolio']);
            Route::delete('/b2b/company/portfolio/{image}', [PartnerB2bCompanyController::class, 'deleteVendorPortfolio']);
            Route::get('/b2b/leads', [PartnerB2bLeadController::class, 'indexVendor']);
            Route::get('/b2b/leads/{lead}', [PartnerB2bLeadController::class, 'showVendor']);
            Route::patch('/b2b/leads/{lead}', [PartnerB2bLeadController::class, 'updateVendor']);
            Route::get('/b2b/reviews', [PartnerB2bReviewController::class, 'indexVendor']);
            Route::get('/shipping-settings', [VendorShippingSettingsController::class, 'show']);
            Route::put('/shipping-settings', [VendorShippingSettingsController::class, 'update']);
            Route::get('/return-policy', [VendorReturnPolicyController::class, 'show']);
            Route::put('/return-policy', [VendorReturnPolicyController::class, 'update']);
            Route::get('/returns', [VendorReturnController::class, 'index']);
            Route::get('/returns/{returnRequest}', [VendorReturnController::class, 'show']);
            Route::post('/returns/{returnRequest}/submit-review', [VendorReturnController::class, 'submitForReview']);
            Route::post('/returns/{returnRequest}/approve', [VendorReturnController::class, 'approve']);
            Route::post('/returns/{returnRequest}/reject', [VendorReturnController::class, 'reject']);
            Route::post('/returns/{returnRequest}/received', [VendorReturnController::class, 'received']);
            Route::post('/returns/{returnRequest}/inspect', [VendorReturnController::class, 'inspect']);
            Route::post('/returns/{returnRequest}/refund', [VendorReturnController::class, 'refund']);
            Route::get('/orders', [VendorOrderController::class, 'index']);
            Route::get('/preorders', [VendorPreorderController::class, 'index']);
            Route::post('/preorders/{preorder}/cancel', [VendorPreorderController::class, 'cancel']);
            Route::post('/orders', [VendorOrderController::class, 'store']);
            Route::get('/orders/{vendorOrder}', [VendorOrderController::class, 'show']);
            Route::get('/orders/{vendorOrder}/invoice', [VendorOrderController::class, 'invoice']);
            Route::post('/orders/{vendorOrder}/accept', [VendorOrderController::class, 'accept']);
            Route::post('/orders/{vendorOrder}/process', [VendorOrderController::class, 'process']);
            Route::post('/orders/{vendorOrder}/ship', [VendorOrderController::class, 'ship']);
            Route::post('/orders/{vendorOrder}/deliver', [VendorOrderController::class, 'deliver']);
            Route::post('/orders/{vendorOrder}/cancel', [VendorOrderController::class, 'cancel']);
            Route::get('/products', [VendorProductController::class, 'index']);
            Route::post('/products', [VendorProductController::class, 'store']);
            Route::get('/products/{product}', [VendorProductController::class, 'show']);
            Route::patch('/products/{product}', [VendorProductController::class, 'update']);
            Route::get('/products/{product}/affiliate', [VendorProductAffiliateController::class, 'show']);
            Route::patch('/products/{product}/affiliate', [VendorProductAffiliateController::class, 'update']);
            Route::delete('/products/{product}', [VendorProductController::class, 'destroy']);
            Route::post('/products/{product}/images', [VendorProductController::class, 'addImages']);
            Route::delete('/products/{product}/images/{image}', [VendorProductController::class, 'deleteImage']);
            Route::patch('/inventory/{product}', [VendorInventoryController::class, 'adjust']);
            Route::get('/coupons', [VendorCouponController::class, 'index']);
            Route::post('/coupons', [VendorCouponController::class, 'store']);
            Route::get('/coupons/{vendorCoupon}', [VendorCouponController::class, 'show']);
            Route::patch('/coupons/{vendorCoupon}', [VendorCouponController::class, 'update']);
            Route::post('/coupons/{vendorCoupon}/activate', [VendorCouponController::class, 'activate']);
            Route::post('/coupons/{vendorCoupon}/deactivate', [VendorCouponController::class, 'deactivate']);
            Route::get('/finance/summary', [VendorFinanceController::class, 'summary']);
            Route::get('/finance/analytics', [VendorFinanceController::class, 'analytics']);
            Route::get('/finance/report', [VendorFinanceController::class, 'exportReport']);
            Route::get('/finance/transactions', [VendorFinanceController::class, 'transactions']);
            Route::get('/finance/payouts', [VendorFinanceController::class, 'payouts']);
            Route::post('/finance/payouts', [VendorFinanceController::class, 'requestPayout']);
            Route::post('/finance/payouts/{payout}/cancel', [VendorFinanceController::class, 'cancelPayout']);
            Route::get('/analytics/overview', [VendorAnalyticsController::class, 'overview']);
            Route::get('/analytics/sales', [VendorAnalyticsController::class, 'sales']);
            Route::get('/analytics/products', [VendorAnalyticsController::class, 'products']);
            Route::get('/analytics/export', [VendorAnalyticsController::class, 'export'])
                ->middleware('throttle:analytics-export');
        });

        Route::middleware('role:marketer')->prefix('dashboard/affiliate')->group(function () {
            Route::get('/', [AffiliateDashboardController::class, 'overview']);
            Route::get('/products', [AffiliateProductController::class, 'index']);
            Route::get('/links', [AffiliateLinkController::class, 'index']);
            Route::post('/links', [AffiliateLinkController::class, 'store'])
                ->middleware('throttle:affiliate-link');
            Route::post('/links/{link}/deactivate', [AffiliateLinkController::class, 'deactivate']);
            Route::get('/reports', [AffiliateReportController::class, 'index']);
            Route::get('/payouts', [AffiliatePayoutController::class, 'index']);
            Route::post('/payouts', [AffiliatePayoutController::class, 'store']);
            Route::get('/finance/transactions', [AffiliatePayoutController::class, 'transactions']);
            Route::get('/settings', [AffiliateSettingsController::class, 'show']);
            Route::patch('/settings', [AffiliateSettingsController::class, 'update']);
            Route::get('/platform-config', [AffiliatePlatformConfigController::class, 'show']);
        });

        Route::middleware('role:provider')->prefix('dashboard/provider')->group(function () {
            Route::get('/service-requests', [ServiceOfferController::class, 'providerInbox']);
            Route::get('/service-requests/{serviceRequest}', [ServiceOfferController::class, 'providerShow']);
            Route::get('/services', [ServiceProviderController::class, 'ownServices']);
            Route::post('/services', [ServiceProviderController::class, 'storeService']);
            Route::patch('/services/{service}', [ServiceProviderController::class, 'updateService']);
            Route::delete('/services/{service}', [ServiceProviderController::class, 'destroyService']);
            Route::get('/bookings', [ServiceBookingController::class, 'providerIndex']);
            Route::post('/bookings/{serviceBooking}/start', [ServiceBookingController::class, 'start']);
            Route::post('/bookings/{serviceBooking}/complete', [ServiceBookingController::class, 'complete']);
            Route::post('/bookings/{serviceBooking}/confirm', [ServiceBookingController::class, 'confirm']);
            Route::post('/bookings/{serviceBooking}/propose-schedule', [ServiceBookingController::class, 'proposeSchedule']);
            Route::post('/bookings/{serviceBooking}/cancel', [ServiceBookingController::class, 'cancel']);
            Route::get('/finance/transactions', [ProviderFinanceController::class, 'transactions']);
            Route::get('/finance/summary', [ProviderFinanceController::class, 'summary']);
            Route::get('/finance/analytics', [ProviderFinanceController::class, 'analytics']);
            Route::get('/finance/export', [ProviderFinanceController::class, 'exportReport']);
            Route::post('/finance/payouts', [ProviderFinanceController::class, 'requestPayout']);
            Route::get('/analytics/overview', [ProviderAnalyticsController::class, 'overview']);
            Route::get('/analytics/bookings', [ProviderAnalyticsController::class, 'bookings']);
            Route::get('/analytics/services', [ProviderAnalyticsController::class, 'services']);
            Route::get('/analytics/export', [ProviderAnalyticsController::class, 'export'])
                ->middleware('throttle:analytics-export');
            Route::get('/settings', [ProviderSettingsController::class, 'show']);
            Route::patch('/settings/profile', [ProviderSettingsController::class, 'updateProfile']);
            Route::put('/settings/working-hours', [ProviderSettingsController::class, 'updateWorkingHours']);
            Route::patch('/settings/account', [ProviderSettingsController::class, 'updateAccount']);
            Route::patch('/settings/password', [ProviderSettingsController::class, 'updatePassword']);
            Route::patch('/settings/notifications', [ProviderSettingsController::class, 'updateNotifications']);
            Route::patch('/settings/bank-account', [ProviderSettingsController::class, 'updateBankAccount']);
            Route::post('/settings/avatar', [ProviderSettingsController::class, 'uploadAvatar']);
            Route::delete('/settings/avatar', [ProviderSettingsController::class, 'deleteAvatar']);
            Route::get('/settings/work-policy', [ProviderWorkPolicyController::class, 'show']);
            Route::put('/settings/work-policy', [ProviderWorkPolicyController::class, 'update']);
            Route::get('/reviews', [ProviderReviewController::class, 'providerInbox']);
            Route::get('/b2b/categories', [PartnerB2bCompanyController::class, 'categoriesProvider']);
            Route::get('/b2b/tags', [PartnerB2bCompanyController::class, 'tagsProvider']);
            Route::get('/b2b/company', [PartnerB2bCompanyController::class, 'showProvider']);
            Route::post('/b2b/company', [PartnerB2bCompanyController::class, 'storeProvider']);
            Route::patch('/b2b/company', [PartnerB2bCompanyController::class, 'updateProvider']);
            Route::post('/b2b/company/media', [PartnerB2bCompanyController::class, 'uploadProviderImage']);
            Route::post('/b2b/company/portfolio', [PartnerB2bCompanyController::class, 'uploadProviderPortfolio']);
            Route::delete('/b2b/company/portfolio/{image}', [PartnerB2bCompanyController::class, 'deleteProviderPortfolio']);
            Route::get('/b2b/leads', [PartnerB2bLeadController::class, 'indexProvider']);
            Route::get('/b2b/leads/{lead}', [PartnerB2bLeadController::class, 'showProvider']);
            Route::patch('/b2b/leads/{lead}', [PartnerB2bLeadController::class, 'updateProvider']);
            Route::get('/b2b/reviews', [PartnerB2bReviewController::class, 'indexProvider']);
        });
    });
});
