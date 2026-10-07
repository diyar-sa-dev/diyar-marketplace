<?php

namespace App\Listeners\Affiliate;

use App\Domains\Affiliate\Services\AffiliateCommissionService;
use App\Enums\ReturnRequestStatus;
use App\Events\Domain\ReturnUpdated;

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
