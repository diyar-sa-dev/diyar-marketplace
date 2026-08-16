<?php

namespace App\Enums;

enum RoleName: string
{
    case Customer = 'customer';
    case Vendor = 'vendor';
    case Provider = 'provider';
    case Marketer = 'marketer';
    case Admin = 'admin';

    /** @return list<string> */
    public static function registrable(): array
    {
        return [
            self::Customer->value,
            self::Vendor->value,
            self::Provider->value,
            self::Marketer->value,
        ];
    }

    public static function fromRegistrationKey(string $key): ?self
    {
        return match ($key) {
            'customer' => self::Customer,
            'merchant', 'vendor' => self::Vendor,
            'service_provider', 'provider' => self::Provider,
            'marketer' => self::Marketer,
            default => null,
        };
    }
}
