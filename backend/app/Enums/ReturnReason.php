<?php

namespace App\Enums;

enum ReturnReason: string
{
    case ManufacturingDefect = 'manufacturing_defect';
    case Damaged = 'damaged';
    case WrongItem = 'wrong_item';
    case NotAsDescribed = 'not_as_described';
    case Other = 'other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
