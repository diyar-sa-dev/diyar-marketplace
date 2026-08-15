<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Version 1
|--------------------------------------------------------------------------
|
| All V1 endpoints are prefixed with /api/v1 (see bootstrap/app.php).
| Business domain routes are added in Stage 2+.
|
*/

Route::get('/health', HealthController::class)->name('api.v1.health');

// Authenticated routes (Stage 2+) will use auth:sanctum middleware here.
