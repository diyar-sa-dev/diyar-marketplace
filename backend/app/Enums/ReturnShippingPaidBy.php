<?php

namespace App\Enums;

enum ReturnShippingPaidBy: string
{
    case Customer = 'customer';
    case Vendor = 'vendor';
    case Platform = 'platform';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
