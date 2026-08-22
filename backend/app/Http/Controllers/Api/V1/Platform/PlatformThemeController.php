<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Services\Settings\EffectiveConfigService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class PlatformThemeController extends Controller
{
    public function show(EffectiveConfigService $config): JsonResponse
    {
        return ApiResponse::success([
            'theme' => $config->publicThemeTokens(),
        ]);
    }
}
