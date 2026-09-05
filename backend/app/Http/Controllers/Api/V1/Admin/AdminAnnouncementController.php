<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Settings\EffectiveConfigService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAnnouncementController extends Controller
{
    public function show(EffectiveConfigService $config): JsonResponse
    {
        return ApiResponse::success(data: [
            'announcement' => $this->payload($config),
        ]);
    }

    public function update(Request $request, EffectiveConfigService $config): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'text_ar' => ['required', 'string', 'max:240'],
            'text_en' => ['required', 'string', 'max:240'],
            'cta_ar' => ['required', 'string', 'max:48'],
            'cta_en' => ['required', 'string', 'max:48'],
            'link' => ['required', 'string', 'max:255'],
        ]);

        /** @var \App\Services\Settings\SystemSettingService $settings */
        $settings = app(\App\Services\Settings\SystemSettingService::class);
        $actor = $request->user('admin');

        $map = [
            'platform.announcement_enabled' => $validated['enabled'],
            'platform.announcement_text_ar' => $validated['text_ar'],
            'platform.announcement_text_en' => $validated['text_en'],
            'platform.announcement_cta_ar' => $validated['cta_ar'],
            'platform.announcement_cta_en' => $validated['cta_en'],
            'platform.announcement_link' => $validated['link'],
        ];

        foreach ($map as $fullKey => $value) {
            /** @var array<string, array<string, mixed>> $definitions */
            $definitions = config('system_settings.definitions', []);
            $definition = $definitions[$fullKey] ?? null;
            if ($definition === null) {
                continue;
            }

            $settings->set(
                group: \App\Enums\SystemSettingGroup::from((string) $definition['group']),
                key: (string) $definition['key'],
                value: $value,
                type: \App\Enums\SystemSettingType::from((string) $definition['type']),
                actor: $actor,
                isPublic: (bool) ($definition['is_public'] ?? false),
                description: isset($definition['description']) ? (string) $definition['description'] : null,
                rules: is_array($definition['validation'] ?? null) ? $definition['validation'] : [],
            );
        }

        return ApiResponse::success(data: [
            'announcement' => $this->payload($config),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(EffectiveConfigService $config): array
    {
        return [
            'enabled' => $config->boolean('platform.announcement_enabled', false),
            'text_ar' => $config->string('platform.announcement_text_ar', ''),
            'text_en' => $config->string('platform.announcement_text_en', ''),
            'cta_ar' => $config->string('platform.announcement_cta_ar', ''),
            'cta_en' => $config->string('platform.announcement_cta_en', ''),
            'link' => $config->string('platform.announcement_link', '/'),
        ];
    }
}
