<?php

namespace App\Domains\Platform\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Platform\Services\EffectiveConfigService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformAnnouncementController extends Controller
{
    public function show(Request $request, EffectiveConfigService $config): JsonResponse
    {
        $locale = str_starts_with(strtolower((string) $request->getPreferredLanguage(['ar', 'en'])), 'ar')
            ? 'ar'
            : 'en';

        $enabled = $config->boolean('platform.announcement_enabled', false);
        $text = $config->string("platform.announcement_text_{$locale}", '');
        $cta = $config->string("platform.announcement_cta_{$locale}", '');
        $link = $config->string('platform.announcement_link', '');

        return ApiResponse::success(data: [
            'announcement' => [
                'enabled' => $enabled && $text !== '',
                'text' => $text,
                'cta' => $cta,
                'link' => $link,
            ],
        ]);
    }
}
