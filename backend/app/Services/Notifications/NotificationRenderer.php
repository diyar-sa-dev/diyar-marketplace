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
            $translationPayload = $this->translationPayload($type, $payload, $locale);

            $title = isset($payload['title']) && is_string($payload['title']) && trim($payload['title']) !== ''
                ? trim($payload['title'])
                : (string) __("diyar.notifications.{$key}.title", $translationPayload);

            $body = isset($payload['body']) && is_string($payload['body']) && trim($payload['body']) !== ''
                ? trim($payload['body'])
                : (string) __("diyar.notifications.{$key}.body", $translationPayload);

            return [
                'title' => $title,
                'body' => $body,
            ];
        } finally {
            app()->setLocale($previous);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function translationPayload(NotificationType $type, array $payload, string $locale): array
    {
        $payload = $this->hydrateMissingFields($payload);
        $payload = $this->localizeEnumFields($type, $payload);

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

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function hydrateMissingFields(array $payload): array
    {
        $fromLines = [];
        if (isset($payload['detail_lines']) && is_array($payload['detail_lines'])) {
            foreach ($payload['detail_lines'] as $line) {
                if (! is_array($line)) {
                    continue;
                }

                $label = $line['label'] ?? null;
                $value = $line['value'] ?? null;
                if (! is_string($label) || ! is_string($value) || trim($label) === '' || trim($value) === '') {
                    continue;
                }

                $fromLines[trim($label)] = trim($value);
            }
        }

        $aliases = [
            'service_title' => ['service_title_snapshot', 'service_name', 'service'],
            'product_name' => ['product'],
            'provider_name' => ['provider'],
            'customer_name' => ['customer'],
            'store_name' => ['store'],
            'reviewer_name' => ['reviewer'],
            'sender_name' => ['sender'],
            'vendor_name' => ['store_name', 'store'],
            'status' => ['status_label'],
            'role' => ['role_label'],
        ];

        foreach ($aliases as $field => $alts) {
            $current = $payload[$field] ?? null;
            if (is_string($current) && trim($current) !== '') {
                continue;
            }

            foreach ([$field, ...$alts] as $alt) {
                foreach ([$payload[$alt] ?? null, $fromLines[$alt] ?? null] as $candidate) {
                    if (is_string($candidate) && trim($candidate) !== '') {
                        $payload[$field] = trim($candidate);

                        continue 3;
                    }
                }
            }
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function localizeEnumFields(NotificationType $type, array $payload): array
    {
        $eventKey = str_replace('.', '_', $type->value);

        foreach (['status', 'role'] as $field) {
            $value = $payload[$field] ?? null;
            if (! is_string($value) || $value === '') {
                continue;
            }

            $key = "diyar.notifications.{$eventKey}.{$field}.{$value}";
            $label = (string) __($key);
            if ($label !== $key) {
                $payload[$field] = $label;
            }
        }

        return $payload;
    }
}
