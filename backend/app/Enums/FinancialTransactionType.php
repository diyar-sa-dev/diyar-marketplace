<?php

namespace App\Enums;

enum FinancialTransactionType: string
{
    case Sale = 'sale';
    case PlatformCommission = 'platform_commission';
    case AffiliateCommission = 'affiliate_commission';
    case Refund = 'refund';
    case Payout = 'payout';
    case Escrow = 'escrow';
    case EscrowRelease = 'escrow_release';
    case Adjustment = 'adjustment';
}
