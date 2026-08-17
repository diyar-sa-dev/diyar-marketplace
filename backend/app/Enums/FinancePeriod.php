<?php

namespace App\Enums;

enum FinancePeriod: string
{
    case Day = 'day';
    case Week = 'week';
    case Month = 'month';
    case Year = 'year';

    public static function tryFromRequest(?string $value): self
    {
        return self::tryFrom((string) $value) ?? self::Month;
    }
}
