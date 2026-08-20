<?php

namespace App\Services\Notifications;

use App\Models\User;
use App\Support\User\UserNotificationPreferences;

final class NotificationPreferenceService
{
    public function __construct(
        private readonly NotificationCategoryRegistry $registry,
    ) {}

    /**
     * @return array{
     *     channels: array{email: bool, push: bool, sms: array{available: bool, enabled: bool}},
     *     categories: list<array<string, mixed>>,
     *     preferences: array<string, array<string, bool>>,
     *     category_enabled: array<string, bool>
     * }
     */
    public function settingsFor(User $user): array
    {
        $matrix = $this->matrixFor($user);

        return [
            'channels' => $this->globalChannelsFor($user),
            'categories' => $this->registry->categoriesForUser($user),
            'preferences' => $matrix,
            'category_enabled' => $this->categoryEnabledMap($user, $matrix),
        ];
    }

    /**
     * @param  array<string, array<string, bool>>|null  $preferences
     * @param  array<string, bool>|null  $categoryEnabled
     * @param  array<string, bool>|null  $channels
     * @return array{
     *     channels: array{email: bool, push: bool, sms: array{available: bool, enabled: bool}},
     *     preferences: array<string, array<string, bool>>,
     *     category_enabled: array<string, bool>
     * }
     */
    public function update(
        User $user,
        ?array $preferences = null,
        ?array $categoryEnabled = null,
        ?array $channels = null,
    ): array {
        if (is_array($channels)) {
            $this->applyGlobalChannels($user, $channels);
            $user->refresh();
        }

        $matrix = $this->matrixFor($user);

        if (is_array($categoryEnabled)) {
            foreach ($categoryEnabled as $category => $enabled) {
                if (! is_string($category) || ! is_bool($enabled)) {
                    continue;
                }

                if (! array_key_exists($category, $this->allowedCategories($user))) {
                    continue;
                }

                foreach ($this->registry->channelsForCategory($category) as $channel) {
                    if ($this->registry->isChannelLocked($category, $channel)) {
                        $matrix[$category][$channel] = true;

                        continue;
                    }

                    $matrix[$category][$channel] = $enabled;
                }
            }
        }

        if (is_array($preferences)) {
            foreach ($preferences as $category => $channelPreferences) {
                if (! is_array($channelPreferences) || ! array_key_exists($category, $this->allowedCategories($user))) {
                    continue;
                }

                foreach ($channelPreferences as $channel => $enabled) {
                    if (! is_string($channel) || ! is_bool($enabled)) {
                        continue;
                    }

                    if ($this->registry->isChannelLocked($category, $channel)) {
                        $matrix[$category][$channel] = true;

                        continue;
                    }

                    if (! in_array($channel, $this->registry->channelsForCategory($category), true)) {
                        continue;
                    }

                    $matrix[$category][$channel] = $enabled;
                }
            }
        }

        $this->persistMatrix($user, $matrix);

        return [
            'channels' => $this->globalChannelsFor($user->fresh()),
            'preferences' => $matrix,
            'category_enabled' => $this->categoryEnabledMap($user->fresh(), $matrix),
        ];
    }

    /**
     * @return array{email: bool, push: bool, sms: array{available: bool, enabled: bool}}
     */
    public function globalChannelsFor(User $user): array
    {
        $preferences = is_array($user->preferences) ? $user->preferences : [];
        $notifications = is_array($preferences['notifications'] ?? null)
            ? $preferences['notifications']
            : [];

        return [
            'email' => UserNotificationPreferences::emailEnabled($user),
            'push' => array_key_exists('push', $notifications) ? (bool) $notifications['push'] : false,
            'sms' => [
                'available' => false,
                'enabled' => false,
            ],
        ];
    }

    /**
     * @return array<string, array<string, bool>>
     */
    public function matrixFor(User $user): array
    {
        $defaults = $this->registry->defaultMatrix();
        $preferences = is_array($user->preferences) ? $user->preferences : [];
        $notifications = is_array($preferences['notifications'] ?? null)
            ? $preferences['notifications']
            : [];
        $stored = is_array($notifications['matrix'] ?? null) ? $notifications['matrix'] : [];
        $allowed = $this->allowedCategories($user);

        $matrix = [];

        foreach ($allowed as $category => $definition) {
            $matrix[$category] = [];
            foreach ($this->registry->channelsForCategory($category) as $channel) {
                $value = $stored[$category][$channel] ?? $defaults[$category][$channel] ?? true;
                $matrix[$category][$channel] = $this->registry->isChannelLocked($category, $channel)
                    ? true
                    : (bool) $value;
            }
        }

        return $matrix;
    }

    /**
     * @param  array<string, bool>  $channels
     */
    private function applyGlobalChannels(User $user, array $channels): void
    {
        $preferences = is_array($user->preferences) ? $user->preferences : [];
        $notifications = is_array($preferences['notifications'] ?? null)
            ? $preferences['notifications']
            : [];

        if (array_key_exists('email', $channels) && is_bool($channels['email'])) {
            $notifications['email'] = $channels['email'];
        }

        if (array_key_exists('push', $channels) && is_bool($channels['push'])) {
            $notifications['push'] = $channels['push'];
        }

        $preferences['notifications'] = $notifications;
        $user->forceFill(['preferences' => $preferences])->save();
    }

    /**
     * @param  array<string, array<string, bool>>  $matrix
     */
    private function persistMatrix(User $user, array $matrix): void
    {
        $preferences = is_array($user->preferences) ? $user->preferences : [];
        $preferences['notifications'] = array_merge(
            is_array($preferences['notifications'] ?? null) ? $preferences['notifications'] : [],
            ['matrix' => $matrix],
        );

        $user->forceFill(['preferences' => $preferences])->save();
    }

    /**
     * @param  array<string, array<string, bool>>  $matrix
     * @return array<string, bool>
     */
    private function categoryEnabledMap(User $user, array $matrix): array
    {
        $enabled = [];

        foreach ($this->allowedCategories($user) as $category => $_definition) {
            $channels = $matrix[$category] ?? [];
            $enabled[$category] = collect($channels)->contains(fn ($value) => (bool) $value);
        }

        return $enabled;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function allowedCategories(User $user): array
    {
        $allowed = [];

        foreach ($this->registry->categoriesForUser($user) as $category) {
            $allowed[$category['key']] = $category;
        }

        return $allowed;
    }
}
