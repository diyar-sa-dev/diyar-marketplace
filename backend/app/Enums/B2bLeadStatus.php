<?php

namespace App\Enums;

enum B2bLeadStatus: string
{
    case New = 'new';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
}
