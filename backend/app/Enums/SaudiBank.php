<?php

namespace App\Enums;

enum SaudiBank: string
{
    case Snb = 'snb';
    case AlRajhi = 'alrajhi';
    case Riyad = 'riyad';
    case Bsf = 'bsf';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $case) => $case->value, self::cases());
    }
}
