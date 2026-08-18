<?php

namespace App\Support\Finance;

final class IbanValidator
{
    public static function normalize(string $iban): string
    {
        return strtoupper(preg_replace('/\s+/', '', $iban) ?? $iban);
    }

    public static function isValidSaudiIban(string $iban): bool
    {
        $normalized = self::normalize($iban);

        if (! preg_match('/^SA\d{22}$/', $normalized)) {
            return false;
        }

        return self::passesMod97($normalized);
    }

    public static function last4(string $iban): string
    {
        $normalized = self::normalize($iban);

        return substr($normalized, -4);
    }

    private static function passesMod97(string $iban): bool
    {
        $rearranged = substr($iban, 4).substr($iban, 0, 4);
        $numeric = '';

        foreach (str_split($rearranged) as $char) {
            $numeric .= ctype_alpha($char) ? (string) (ord($char) - 55) : $char;
        }

        $checksum = 0;
        foreach (str_split($numeric) as $digit) {
            $checksum = ($checksum * 10 + (int) $digit) % 97;
        }

        return $checksum === 1;
    }
}
