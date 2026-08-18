<?php

namespace App\Enums;

enum VendorTeamRole: string
{
    case Owner = 'owner';
    case Manager = 'manager';
    case CustomerService = 'customer_service';

    /** @return list<string> */
    public static function invitable(): array
    {
        return [
            self::Manager->value,
            self::CustomerService->value,
        ];
    }
}
