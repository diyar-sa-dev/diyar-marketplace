<?php

namespace App\Enums;

enum FinancePeriod: string
{
    case Day = 'day';
    case Week = 'week';
    case Month = 'month';
    case ThreeMonths = '3m';
    case SixMonths = '6m';
    case TwelveMonths = '12m';
    case Year = 'year';

    public static function tryFromRequest(?string $value): self
    {
        return self::tryFrom((string) $value) ?? self::Month;
    }

    /**
     * @return 'hour'|'day'|'week'|'month'
     */
    public function analyticsGranularity(): string
    {
        return match ($this) {
            self::Day => 'hour',
            self::Week, self::Month => 'day',
            self::ThreeMonths, self::SixMonths => 'week',
            self::TwelveMonths, self::Year => 'month',
        };
    }
}
