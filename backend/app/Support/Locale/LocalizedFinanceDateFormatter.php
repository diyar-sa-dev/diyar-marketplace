<?php

namespace App\Support\Locale;

use Carbon\CarbonInterface;
use IntlDateFormatter;

final class LocalizedFinanceDateFormatter
{
    public static function format(?CarbonInterface $date): string
    {
        if ($date === null) {
            return '';
        }

        if (extension_loaded('intl') && class_exists(IntlDateFormatter::class)) {
            $locale = app()->getLocale() === 'ar'
                ? 'ar_SA@calendar=gregorian;numbers=latn'
                : 'en_GB';

            $formatter = new IntlDateFormatter(
                $locale,
                IntlDateFormatter::NONE,
                IntlDateFormatter::NONE,
                $date->getTimezone()->getName(),
                IntlDateFormatter::GREGORIAN,
                app()->getLocale() === 'ar' ? 'd MMMM y، HH:mm' : 'd MMMM y, HH:mm',
            );

            $formatted = $formatter->format($date->toDateTime());

            if (is_string($formatted)) {
                return $formatted;
            }
        }

        $localized = $date->copy()->locale(app()->getLocale());

        if (app()->getLocale() === 'ar') {
            return $localized->translatedFormat('j F Y').'، '.$localized->format('H:i');
        }

        return $localized->translatedFormat('j F Y, H:i');
    }
}
