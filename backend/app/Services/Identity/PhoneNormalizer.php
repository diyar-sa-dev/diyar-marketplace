<?php

namespace App\Services\Identity;

final class PhoneNormalizer
{
    /**
     * Normalize Saudi phone numbers to E.164 digits without plus (9665xxxxxxxx).
     */
    public static function normalize(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        if (str_starts_with($digits, '966')) {
            $national = substr($digits, 3);
        } elseif (str_starts_with($digits, '0')) {
            $national = substr($digits, 1);
        } else {
            $national = $digits;
        }

        if (! preg_match('/^5\d{8}$/', $national)) {
            return null;
        }

        return '966'.$national;
    }

    /**
     * Convert stored E.164 digits (9665xxxxxxxx) to national format (5xxxxxxxx).
     */
    public static function toNational(?string $phone): ?string
    {
        $normalized = self::normalize($phone);

        if ($normalized === null && $phone !== null) {
            $digits = preg_replace('/\D+/', '', $phone) ?? '';
            if (preg_match('/^9665\d{8}$/', $digits)) {
                $normalized = $digits;
            }
        }

        if ($normalized === null || ! str_starts_with($normalized, '966')) {
            return null;
        }

        return substr($normalized, 3);
    }
}
