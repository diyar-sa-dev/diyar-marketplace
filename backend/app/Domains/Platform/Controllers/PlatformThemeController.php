<?php

namespace App\Domains\Platform\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Platform\Services\EffectiveConfigService;
use App\Core\Support\Api\ApiResponse;
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
