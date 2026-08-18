<?php

namespace App\Enums;

enum BusinessEntityType: string
{
    case SoleProprietorship = 'sole_proprietorship';
    case FreelancerDocument = 'freelancer_document';
    case Company = 'company';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $case) => $case->value, self::cases());
    }
}
