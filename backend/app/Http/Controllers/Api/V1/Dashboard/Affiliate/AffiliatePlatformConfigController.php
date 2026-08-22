<?php

namespace App\Http\Controllers\Api\V1\Dashboard\Affiliate;

use App\Http\Controllers\Controller;
use App\Services\Affiliate\AffiliatePlatformConfigService;
use App\Support\Api\ApiResponse;
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
