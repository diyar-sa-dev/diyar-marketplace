<?php

namespace App\Enums;

enum BalanceBucket: string
{
    case PlatformCash = 'platform_cash';
    case PlatformCommission = 'platform_commission';
    case VendorEscrow = 'vendor_escrow';
    case VendorAvailable = 'vendor_available';
    case AffiliatePayable = 'affiliate_payable';
    case AffiliateAvailable = 'affiliate_available';
}
