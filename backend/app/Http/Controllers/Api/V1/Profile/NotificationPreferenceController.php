<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateNotificationPreferencesRequest;
use App\Services\Notifications\NotificationPreferenceService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function __construct(
        private readonly NotificationPreferenceService $preferences,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $settings = $this->preferences->settingsFor($request->user());

        return ApiResponse::success(data: [
            'channels' => $settings['channels'],
            'categories' => collect($settings['categories'])->map(fn (array $category) => [
                'key' => $category['key'],
                'label' => __($category['label']),
                'policy' => $category['policy'],
                'channels' => $category['channels'],
                'channel_policies' => $category['channel_policies'],
                'filterable' => (bool) ($category['filterable'] ?? false),
            ])->values()->all(),
            'preferences' => $settings['preferences'],
            'category_enabled' => $settings['category_enabled'],
        ]);
    }

    public function update(UpdateNotificationPreferencesRequest $request): JsonResponse
    {
        $result = $this->preferences->update(
            $request->user(),
            $request->validated('preferences'),
            $request->validated('category_enabled'),
            $request->validated('channels'),
        );

        return ApiResponse::success(
            message: __('diyar.profile.notifications_saved'),
            data: $result,
        );
    }
}
