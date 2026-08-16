<?php

namespace App\Enums;

enum ReservationStatus: string
{
    case Pending = 'pending';
    case Finalized = 'finalized';
    case Released = 'released';
    case Expired = 'expired';
}
