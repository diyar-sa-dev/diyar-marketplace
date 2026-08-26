<?php

namespace App\Support\Chat;

final class ChatReportCatalog
{
    /** @return list<string> */
    public static function reasonValues(): array
    {
        return [
            'spam',
            'harassment',
            'inappropriate',
            'scam',
            'hate_speech',
            'impersonation',
            'other',
        ];
    }

    /** @return list<array{value: string, label: string}> */
    public static function localizedReasons(?string $locale = null): array
    {
        $previous = app()->getLocale();
        if ($locale !== null) {
            app()->setLocale($locale);
        }

        try {
            return array_map(
                static fn (string $value) => [
                    'value' => $value,
                    'label' => (string) __("diyar.chat.report_reasons.{$value}"),
                ],
                self::reasonValues(),
            );
        } finally {
            app()->setLocale($previous);
        }
    }
}
