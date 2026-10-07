<?php

namespace App\Domains\Platform\Services;

use App\Domains\Notifications\Services\NotificationCategoryRegistry;
use App\Domains\Notifications\Services\NotificationPreferenceService;
use App\Models\User;

final class PlatformNewsletterService
{
    public function __construct(
        private readonly NotificationPreferenceService $preferences,
        private readonly NotificationCategoryRegistry $registry,
    ) {}

    /**
     * @return array{
     *     channels: array{email: bool, push: bool, sms: array{available: bool, enabled: bool}},
     *     preferences: array<string, array<string, bool>>,
     *     category_enabled: array<string, bool>
     * }
     */
    public function subscribe(User $user): array
    {
        $settings = $this->preferences->settingsFor($user);
        $preferences = [];
        $channels = [];

        if (! $settings['channels']['email']) {
            $channels['email'] = true;
        }

        foreach ($settings['preferences'] as $category => $channelPreferences) {
            if ($this->registry->policyForCategory($category) !== 'optional') {
                continue;
            }

            if (! is_array($channelPreferences)) {
                continue;
            }

            if (($channelPreferences['email'] ?? true) || $this->registry->isChannelLocked($category, 'email')) {
                continue;
            }

            $preferences[$category]['email'] = true;
        }

        if ($preferences === [] && $channels === []) {
            return [
                'channels' => $settings['channels'],
                'preferences' => $settings['preferences'],
                'category_enabled' => $settings['category_enabled'],
            ];
        }

        return $this->preferences->update(
            $user,
            preferences: $preferences !== [] ? $preferences : null,
            categoryEnabled: null,
            channels: $channels !== [] ? $channels : null,
        );
    }
}
