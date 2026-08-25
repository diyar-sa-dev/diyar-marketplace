<?php

namespace App\Enums;

enum LoyaltyTransactionType: string
{
    case Earn = 'earn';
    case Redeem = 'redeem';
    case Adjust = 'adjust';
    case Reversal = 'reversal';

    /** @return list<string> */
    public static function filterValues(): array
    {
        return array_column(self::cases(), 'value');
    }
}
