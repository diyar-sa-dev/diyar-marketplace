<?php

namespace App\Enums;

enum ProviderReviewStatus: string
{
    case Pending = 'pending';
    case Published = 'published';
    case Hidden = 'hidden';
    case Rejected = 'rejected';

    /**
     * @return list<string>
     */
    public static function publicValues(): array
    {
        return [self::Published->value];
    }
}
