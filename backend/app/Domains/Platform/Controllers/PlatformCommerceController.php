<?php

namespace App\Domains\Platform\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Platform\Services\EffectiveConfigService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class PlatformCommerceController extends Controller
{
    public function show(EffectiveConfigService $config): JsonResponse
    {
        $sarPerPoint = max(1, $config->integer('commerce.loyalty_sar_per_point', 50));
        $pointsPerUnit = max(1, $config->integer('commerce.loyalty_points_per_unit', 1));
        $enabled = $config->boolean('commerce.loyalty_enabled', true);

        return ApiResponse::success([
            'commerce' => [
                'loyalty_sar_per_point' => $sarPerPoint,
                'loyalty_points_per_unit' => $pointsPerUnit,
                'loyalty_enabled' => $enabled,
            ],
        ]);
    }
}
