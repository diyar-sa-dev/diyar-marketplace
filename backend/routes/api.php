<?php

use App\Http\Controllers\Api\V1\Admin\AdminPayoutController;
use App\Http\Controllers\Api\V1\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Cart\CartController;
use App\Http\Controllers\Api\V1\Catalog\CategoryController;
use App\Http\Controllers\Api\V1\Catalog\ProductController;
use App\Http\Controllers\Api\V1\Catalog\ProductEngagementController;
use App\Http\Controllers\Api\V1\Catalog\ProductPreorderController;
use App\Http\Controllers\Api\V1\Catalog\SearchController;
use App\Http\Controllers\Api\V1\Catalog\StoreReviewController;
use App\Http\Controllers\Api\V1\Catalog\VendorController;
use App\Http\Controllers\Api\V1\Catalog\VendorFollowController;
use App\Http\Controllers\Api\V1\Checkout\CheckoutController;
use App\Http\Controllers\Api\V1\Dashboard\VendorDashboardController;
use App\Http\Controllers\Api\V1\Dashboard\VendorFinanceController;
use App\Http\Controllers\Api\V1\Dashboard\VendorInventoryController;
use App\Http\Controllers\Api\V1\Dashboard\VendorOrderController;
use App\Http\Controllers\Api\V1\Dashboard\VendorPreorderController;
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
use App\Http\Controllers\Api\V1\Order\OrderController;
use App\Http\Controllers\Api\V1\Order\OrderStoreReviewController;
use App\Http\Controllers\Api\V1\Payment\PaymentController;
use App\Http\Controllers\Api\V1\Payment\PaymentWebhookController;
use App\Http\Controllers\Api\V1\Profile\AddressController;
use App\Http\Controllers\Api\V1\Profile\CustomerReviewController;
use App\Http\Controllers\Api\V1\Profile\ProfileController;
use App\Http\Controllers\Api\V1\Profile\WishlistController;
use App\Http\Controllers\Api\V1\Return\ReturnController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ProviderController as ServiceProviderController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ProviderFollowController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceBookingController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceBookingPaymentController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceCategoryController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceOfferController;
use App\Http\Controllers\Api\V1\ServiceMarketplace\ServiceRequestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Version 1
|--------------------------------------------------------------------------
|
| All V1 endpoints are prefixed with /api/v1 (see bootstrap/app.php).
|
*/

Route::get('/health', HealthController::class)->name('api.v1.health');

Route::post('/webhooks/payments/myfatoorah', [PaymentWebhookController::class, 'myfatoorah'])
    ->name('api.v1.webhooks.payments.myfatoorah');

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);
Route::get('/categories/{slug}/items', [CategoryController::class, 'items']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/products/{id}/reviews', [ProductEngagementController::class, 'reviews']);
Route::get('/search', SearchController::class);
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

Route::middleware(['auth:sanctum', 'account.active'])->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::get('/vendor/accounts/{vendorAccount}', [OwnershipController::class, 'showVendorAccount'])
        ->middleware('role:vendor,admin');

    Route::get('/provider/accounts/{providerAccount}', [OwnershipController::class, 'showProviderAccount'])
        ->middleware('role:provider,admin');

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
    Route::get('/service-bookings', [ServiceBookingController::class, 'index']);
    Route::get('/service-bookings/{serviceBooking}', [ServiceBookingController::class, 'show']);
    Route::get('/service-bookings/{serviceBooking}/payment', [ServiceBookingPaymentController::class, 'show']);
    Route::post('/service-bookings/{serviceBooking}/payment/simulate', [ServiceBookingPaymentController::class, 'simulate']);

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

        Route::get('/wishlist', [WishlistController::class, 'index']);
        Route::delete('/wishlist', [WishlistController::class, 'clear']);
        Route::get('/reviews', [CustomerReviewController::class, 'index']);
        Route::get('/reviews/{type}/{id}', [CustomerReviewController::class, 'show'])
            ->whereIn('type', ['product', 'store']);
    });

    Route::post('/products/{id}/reviews', [ProductEngagementController::class, 'storeReview']);
    Route::patch('/products/{id}/reviews', [ProductEngagementController::class, 'updateReview']);
    Route::delete('/products/{id}/reviews', [ProductEngagementController::class, 'destroyReview']);
    Route::post('/products/{id}/like', [ProductEngagementController::class, 'toggleLike']);
    Route::post('/products/{id}/wishlist', [ProductEngagementController::class, 'toggleWishlist']);
    Route::post('/products/{id}/preorder', [ProductPreorderController::class, 'store']);
    Route::get('/products/{id}/preorder', [ProductPreorderController::class, 'status']);

    Route::prefix('team-invites')->group(function () {
        Route::get('/{token}', [VendorTeamInviteController::class, 'show']);
        Route::post('/{token}/accept', [VendorTeamInviteController::class, 'accept']);
        Route::post('/{token}/reject', [VendorTeamInviteController::class, 'reject']);
    });

    Route::middleware('role:vendor,admin')->prefix('dashboard/vendor')->group(function () {
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
        Route::delete('/products/{product}', [VendorProductController::class, 'destroy']);
        Route::post('/products/{product}/images', [VendorProductController::class, 'addImages']);
        Route::delete('/products/{product}/images/{image}', [VendorProductController::class, 'deleteImage']);
        Route::patch('/inventory/{product}', [VendorInventoryController::class, 'adjust']);
        Route::get('/finance/summary', [VendorFinanceController::class, 'summary']);
        Route::get('/finance/analytics', [VendorFinanceController::class, 'analytics']);
        Route::get('/finance/report', [VendorFinanceController::class, 'exportReport']);
        Route::get('/finance/transactions', [VendorFinanceController::class, 'transactions']);
        Route::get('/finance/payouts', [VendorFinanceController::class, 'payouts']);
        Route::post('/finance/payouts', [VendorFinanceController::class, 'requestPayout']);
        Route::post('/finance/payouts/{payout}/cancel', [VendorFinanceController::class, 'cancelPayout']);
    });

    Route::middleware('role:provider,admin')->prefix('dashboard/provider')->group(function () {
        Route::get('/service-requests', [ServiceOfferController::class, 'providerInbox']);
        Route::get('/service-requests/{serviceRequest}', [ServiceOfferController::class, 'providerShow']);
        Route::get('/bookings', [ServiceBookingController::class, 'providerIndex']);
        Route::post('/bookings/{serviceBooking}/start', [ServiceBookingController::class, 'start']);
        Route::post('/bookings/{serviceBooking}/complete', [ServiceBookingController::class, 'complete']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/categories', [AdminCategoryController::class, 'index']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::get('/categories/{category}', [AdminCategoryController::class, 'show']);
        Route::patch('/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);
        Route::get('/payouts', [AdminPayoutController::class, 'index']);
        Route::post('/payouts/{payout}/approve', [AdminPayoutController::class, 'approve']);
        Route::post('/payouts/{payout}/reject', [AdminPayoutController::class, 'reject']);
        Route::post('/payouts/{payout}/mark-paid', [AdminPayoutController::class, 'markPaid']);
    });
});
