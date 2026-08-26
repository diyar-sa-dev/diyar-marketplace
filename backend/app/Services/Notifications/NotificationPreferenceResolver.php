<?php

namespace App\Services\Notifications;

use App\Enums\NotificationChannel;
use App\Enums\NotificationType;
use App\Models\User;
use App\Support\User\UserNotificationPreferences;

final class NotificationPreferenceResolver
{
    public function __construct(
        private readonly NotificationCatalog $catalog,
        private readonly NotificationCategoryRegistry $registry,
        private readonly NotificationPreferenceService $preferences,
    ) {}

    public function isChannelEnabled(
        User $user,
        NotificationType $type,
        NotificationChannel $channel,
    ): bool {
        if ($channel === NotificationChannel::Email && ! UserNotificationPreferences::emailEnabled($user)) {
            return false;
        }

        if ($channel === NotificationChannel::Push && ! $this->globalPushEnabled($user)) {
            return false;
        }

        if ($channel === NotificationChannel::Sms) {
            if (! config('diyar.notifications.sms.enabled', false)) {
                return false;
            }

            $phone = $user->phone ?? null;

            return is_string($phone) && trim($phone) !== '';
        }

        if ($this->catalog->overridesPreferences($type)) {
            return match ($channel) {
                NotificationChannel::Email => $type !== NotificationType::AuthOtp
                    || UserNotificationPreferences::emailEnabled($user),
                NotificationChannel::InApp => true,
                NotificationChannel::Push => $this->globalPushEnabled($user),
                NotificationChannel::Sms => config('diyar.notifications.sms.enabled', false),
            };
        }

        $category = $this->registry->categoryForType($type);
        $matrix = $this->preferences->matrixFor($user);
        $channelKey = $channel->value;

        if (isset($matrix[$category][$channelKey])) {
            if ($this->registry->isChannelLocked($category, $channelKey)) {
                return true;
            }

            return (bool) $matrix[$category][$channelKey];
        }

        return match ($channel) {
            NotificationChannel::InApp => true,
            NotificationChannel::Email => UserNotificationPreferences::emailEnabled($user),
            NotificationChannel::Push => $this->globalPushEnabled($user),
            NotificationChannel::Sms => config('diyar.notifications.sms.enabled', false),
        };
    }

    private function globalPushEnabled(User $user): bool
    {
        $preferences = is_array($user->preferences) ? $user->preferences : [];
        $notifications = is_array($preferences['notifications'] ?? null)
            ? $preferences['notifications']
            : [];

        if (! array_key_exists('push', $notifications)) {
            return false;
        }

        return (bool) $notifications['push'];
    }
}
