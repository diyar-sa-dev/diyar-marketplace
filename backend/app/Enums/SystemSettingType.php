<?php

namespace App\Enums;

enum SystemSettingType: string
{
    case String = 'string';
    case Integer = 'integer';
    case Decimal = 'decimal';
    case Boolean = 'boolean';
    case Json = 'json';
    case Color = 'color';

    /** @return list<self> */
    public static function all(): array
    {
        return self::cases();
    }
}
