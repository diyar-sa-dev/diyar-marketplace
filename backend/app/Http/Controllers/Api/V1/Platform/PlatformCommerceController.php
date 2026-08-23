<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Services\Settings\EffectiveConfigService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class PlatformCommerceController extends Controller
{
    public function show(EffectiveConfigService $config): JsonResponse
    {
        $sarPerPoint = max(1, $config->integer('commerce.loyalty_sar_per_point', 50));

        return ApiResponse::success([
            'commerce' => [
                'loyalty_sar_per_point' => $sarPerPoint,
            ],
        ]);
    }
}
