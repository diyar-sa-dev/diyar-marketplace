<?php

namespace App\Enums;

enum VendorTeamStatus: string
{
    case Invited = 'invited';
    case Active = 'active';
    case Rejected = 'rejected';
    case Removed = 'removed';
}
