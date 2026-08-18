<?php

namespace App\Enums;

enum ServicePaymentStrategy: string
{
    case Full = 'full';
    case Deposit = 'deposit';
    case Escrow = 'escrow';
}
