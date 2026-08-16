<?php

namespace App\Enums;

enum AddressType: string
{
    case Home = 'home';
    case Work = 'work';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
