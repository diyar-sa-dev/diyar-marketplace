<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\SystemSettingGroup;
use App\Enums\SystemSettingType;
use App\Http\Controllers\Controller;
use App\Services\Settings\EffectiveConfigService;
use App\Services\Settings\SystemSettingService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAnnouncementController extends Controller
{
    /** Content keys managed here and in Admin → Feedback (not the generic settings UI). */
    private const CONTENT_KEYS = [
        'text_ar' => ['key' => 'announcement_text_ar', 'max' => 240],
        'text_en' => ['key' => 'announcement_text_en', 'max' => 240],
        'cta_ar' => ['key' => 'announcement_cta_ar', 'max' => 48],
        'cta_en' => ['key' => 'announcement_cta_en', 'max' => 48],
        'link' => ['key' => 'announcement_link', 'max' => 255],
    ];

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

        /** @var SystemSettingService $settings */
        $settings = app(SystemSettingService::class);
        $actor = $request->user('admin');

        $settings->set(
            group: SystemSettingGroup::Platform,
            key: 'announcement_enabled',
            value: $validated['enabled'],
            type: SystemSettingType::Boolean,
            actor: $actor,
            isPublic: true,
            rules: ['required', 'boolean'],
        );

        foreach (self::CONTENT_KEYS as $field => $meta) {
            $settings->set(
                group: SystemSettingGroup::Platform,
                key: $meta['key'],
                value: $validated[$field],
                type: SystemSettingType::String,
                actor: $actor,
                isPublic: true,
                rules: ['required', 'string', 'max:'.$meta['max']],
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
