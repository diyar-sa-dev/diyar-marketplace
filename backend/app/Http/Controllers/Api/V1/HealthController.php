<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Infrastructure\PlatformHealthService;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __invoke(PlatformHealthService $health): JsonResponse
    {
        $includeEnvironment = ! app()->environment('production');
        $payload = $health->buildPayload($includeEnvironment);
        $statusCode = ($payload['status'] ?? '') === 'ok' ? 200 : 503;

        return ApiResponse::success($payload, null, $statusCode);
    }
}
