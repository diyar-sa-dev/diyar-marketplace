<?php

namespace App\Enums;

enum ServiceOfferStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';
    case Expired = 'expired';
}
