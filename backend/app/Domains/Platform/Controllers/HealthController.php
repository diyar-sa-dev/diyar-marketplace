<?php

namespace App\Domains\Platform\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Platform\Services\PlatformHealthService;
use App\Http\Controllers\Controller;
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
