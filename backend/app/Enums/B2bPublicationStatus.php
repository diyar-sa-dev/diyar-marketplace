<?php

namespace App\Enums;

enum B2bPublicationStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';

    /** @return list<string> */
    public static function publicVisible(): array
    {
        return [self::Published->value];
    }
}
