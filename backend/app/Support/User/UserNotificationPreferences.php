<?php

namespace App\Support\User;

use App\Models\User;

final class UserNotificationPreferences
{
    public static function emailEnabled(User $user): bool
    {
        $preferences = is_array($user->preferences) ? $user->preferences : [];
        $notifications = is_array($preferences['notifications'] ?? null)
            ? $preferences['notifications']
            : [];

        if (! array_key_exists('email', $notifications)) {
            return true;
        }

        return (bool) $notifications['email'];
    }

    public static function mailLocale(User $user, ?string $fallback = null): string
    {
        $preferences = is_array($user->preferences) ? $user->preferences : [];
        $locale = $preferences['locale'] ?? $fallback ?? app()->getLocale();

        return in_array($locale, ['ar', 'en'], true) ? $locale : 'ar';
    }
}
