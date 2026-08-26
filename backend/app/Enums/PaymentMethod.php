<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Mada = 'mada';
    case Card = 'card';
    case ApplePay = 'apple_pay';
    case Tabby = 'tabby';

    /**
     * @return list<self>
     */
    public static function checkoutMethods(): array
    {
        return [
            self::Mada,
            self::Card,
            self::ApplePay,
            self::Tabby,
        ];
    }

    /**
     * Gateway / provider codes that satisfy this checkout method.
     *
     * @return list<string>
     */
    public function gatewayCodes(): array
    {
        return match ($this) {
            self::Mada => ['mada', 'md'],
            self::Card => ['card', 'visa_master', 'vm', 'visa', 'master', 'creditcard'],
            self::ApplePay => ['apple_pay', 'ap'],
            self::Tabby => ['tabby'],
        };
    }

    public static function tryFromLegacy(?string $value): ?self
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalized = strtolower(trim($value));

        $resolved = self::tryFrom($normalized);
        if ($resolved !== null) {
            return $resolved;
        }

        return match ($normalized) {
            'md' => self::Mada,
            'visa', 'visa_master', 'vm', 'master', 'creditcard' => self::Card,
            'apple', 'ap' => self::ApplePay,
            default => null,
        };
    }
}
