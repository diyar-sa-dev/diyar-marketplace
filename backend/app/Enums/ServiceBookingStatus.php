<?php

namespace App\Enums;

enum ServiceBookingStatus: string
{
    case PendingProviderConfirmation = 'pending_provider_confirmation';
    case PendingCustomerAcceptance = 'pending_customer_acceptance';
    case PendingPayment = 'pending_payment';
    case Confirmed = 'confirmed';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
