<?php

namespace App\Listeners\Affiliate;

use App\Domains\Affiliate\Services\AffiliateCommissionService;
use App\Events\Domain\PaymentSucceeded;

final class ProcessAffiliateCommissionOnPaymentSucceeded
{
    public function __construct(
        private readonly AffiliateCommissionService $commissions,
    ) {}

    public function handle(PaymentSucceeded $event): void
    {
        $event->payment->loadMissing('order.vendorOrders.items');

        $order = $event->payment->order;

        if ($order === null) {
            return;
        }

        foreach ($order->vendorOrders as $vendorOrder) {
            foreach ($vendorOrder->items as $orderItem) {
                $this->commissions->createPendingFromOrderItem($orderItem);
            }
        }
    }
}
