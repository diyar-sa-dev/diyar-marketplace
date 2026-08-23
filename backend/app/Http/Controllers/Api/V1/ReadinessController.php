<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Infrastructure\PlatformHealthService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class ReadinessController extends Controller
{
    public function __invoke(PlatformHealthService $health): JsonResponse
    {
        $includeEnvironment = ! app()->environment('production');
        $payload = $health->buildPayload($includeEnvironment);

        $ready = ($payload['status'] ?? '') === 'ok';

        return ApiResponse::success($payload, null, $ready ? 200 : 503);
    }
}
