<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Services\Settings\EffectiveConfigService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class PlatformSearchController extends Controller
{
    public function show(EffectiveConfigService $config): JsonResponse
    {
        $default = (float) config('diyar.visual_search.min_similarity', 0.90);
        $minSimilarity = max(0.1, min(1.0, $config->decimal('feature.visual_search_min_similarity', $default)));

        return ApiResponse::success([
            'search' => [
                'visual_search_min_similarity' => $minSimilarity,
            ],
        ]);
    }
}
