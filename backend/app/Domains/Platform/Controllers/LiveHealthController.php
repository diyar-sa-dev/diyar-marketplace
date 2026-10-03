<?php

namespace App\Domains\Platform\Controllers;

use App\Http\Controllers\Controller;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

/** Lightweight liveness probe — process is up; no dependency checks. */
final class LiveHealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return ApiResponse::success([
            'status' => 'live',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
