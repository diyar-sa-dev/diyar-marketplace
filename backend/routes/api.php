<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\Identity\OwnershipController;
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

Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:otp');
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:otp');
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
});
