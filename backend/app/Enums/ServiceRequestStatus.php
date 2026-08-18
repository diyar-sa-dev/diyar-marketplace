<?php

namespace App\Enums;

enum ServiceRequestStatus: string
{
    case Pending = 'pending';
    case OffersReceived = 'offers_received';
    case OfferAccepted = 'offer_accepted';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
