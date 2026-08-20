<?php

namespace App\Enums;

enum AffiliateProfileStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
    case Pending = 'pending';
}
