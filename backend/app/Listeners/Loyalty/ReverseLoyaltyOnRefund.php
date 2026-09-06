<?php

namespace App\Listeners\Loyalty;

use App\Enums\ReturnRequestStatus;
use App\Events\Domain\ReturnUpdated;
use App\Services\Loyalty\LoyaltyLedgerService;
use Illuminate\Support\Facades\Log;

final class ReverseLoyaltyOnRefund
{
    public function __construct(
        private readonly LoyaltyLedgerService $ledger,
    ) {}

    public function handle(ReturnUpdated $event): void
    {
        if ($event->returnRequest->status !== ReturnRequestStatus::Refunded) {
            return;
        }

        try {
            $this->ledger->reverseForRefund($event->returnRequest);
        } catch (\Throwable $exception) {
            Log::error('loyalty.reversal_failed', [
                'return_id' => $event->returnRequest->id,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
