<?php

namespace App\Listeners\Affiliate;

use App\Enums\ReturnRequestStatus;
use App\Events\Domain\ReturnUpdated;
use App\Services\Affiliate\AffiliateCommissionService;

final class ReverseAffiliateCommissionOnRefund
{
    public function __construct(
        private readonly AffiliateCommissionService $commissions,
    ) {}

    public function handle(ReturnUpdated $event): void
    {
        if ($event->returnRequest->status !== ReturnRequestStatus::Refunded) {
            return;
        }

        $this->commissions->reverseForReturn($event->returnRequest);
    }
}
