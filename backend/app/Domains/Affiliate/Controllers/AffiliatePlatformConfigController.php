<?php

namespace App\Domains\Affiliate\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Affiliate\Services\AffiliatePlatformConfigService;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class AffiliatePlatformConfigController extends Controller
{
    public function __construct(
        private readonly AffiliatePlatformConfigService $platform,
    ) {}

    public function show(): JsonResponse
    {
        return ApiResponse::success(data: [
            'platform' => $this->platform->snapshot(),
        ]);
    }
}
