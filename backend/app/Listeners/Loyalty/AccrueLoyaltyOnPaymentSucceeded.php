<?php

namespace App\Listeners\Loyalty;

use App\Events\Domain\PaymentSucceeded;
use App\Services\Loyalty\LoyaltyLedgerService;
use Illuminate\Support\Facades\Log;

final class AccrueLoyaltyOnPaymentSucceeded
{
    public function __construct(
        private readonly LoyaltyLedgerService $ledger,
    ) {}

    public function handle(PaymentSucceeded $event): void
    {
        $event->payment->loadMissing('order');

        $order = $event->payment->order;

        if ($order === null) {
            return;
        }

        try {
            $this->ledger->accrueForPaidOrder($order);
        } catch (\Throwable $exception) {
            Log::error('loyalty.accrual_failed', [
                'order_id' => $order->id,
                'payment_id' => $event->payment->id,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
