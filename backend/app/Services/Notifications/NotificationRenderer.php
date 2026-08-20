<?php

namespace App\Services\Notifications;

use App\Enums\NotificationType;
use App\Models\User;
use App\Support\User\UserNotificationPreferences;

final class NotificationRenderer
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array{title: string, body: string}
     */
    public function render(User $user, NotificationType $type, array $payload): array
    {
        $locale = UserNotificationPreferences::mailLocale($user);
        $previous = app()->getLocale();
        app()->setLocale($locale);

        try {
            $key = str_replace('.', '_', $type->value);
            $translationPayload = $this->translationPayload($payload, $locale);

            return [
                'title' => (string) __("diyar.notifications.{$key}.title", $translationPayload),
                'body' => (string) __("diyar.notifications.{$key}.body", $translationPayload),
            ];
        } finally {
            app()->setLocale($previous);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function translationPayload(array $payload, string $locale): array
    {
        $products = trim((string) ($payload['products'] ?? ''));
        $payload['products_line'] = $products !== ''
            ? ($locale === 'ar' ? " المنتجات: {$products}." : " Items: {$products}.")
            : '';

        $fallback = '—';

        return array_map(
            static function ($value) use ($fallback) {
                if (! is_scalar($value) && $value !== null) {
                    return $value;
                }

                if ($value === null || $value === '') {
                    return $fallback;
                }

                return $value;
            },
            array_filter(
                $payload,
                fn ($value) => is_scalar($value) || $value === null,
            ),
        );
    }
}
