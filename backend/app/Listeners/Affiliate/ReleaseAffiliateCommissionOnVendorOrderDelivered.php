<?php

namespace App\Listeners\Affiliate;

use App\Domains\Affiliate\Services\AffiliateCommissionService;
use App\Events\Domain\OrderDelivered;

final class ReleaseAffiliateCommissionOnVendorOrderDelivered
{
    public function __construct(
        private readonly AffiliateCommissionService $commissions,
    ) {}

    public function handle(OrderDelivered $event): void
    {
        if (config('diyar.affiliate.commission_available_on') !== 'vendor_order_delivered') {
            return;
        }

        $this->commissions->markAvailableForVendorOrder($event->vendorOrder);
    }
}
