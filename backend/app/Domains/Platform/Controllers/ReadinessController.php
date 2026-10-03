<?php

namespace App\Domains\Platform\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Platform\Services\PlatformHealthService;
use App\Core\Support\Api\ApiResponse;
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
