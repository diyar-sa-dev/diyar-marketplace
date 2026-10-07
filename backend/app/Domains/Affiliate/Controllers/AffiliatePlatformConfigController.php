<?php

namespace App\Domains\Affiliate\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Affiliate\Services\AffiliatePlatformConfigService;
use App\Http\Controllers\Controller;
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
