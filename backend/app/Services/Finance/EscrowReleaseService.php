<?php

namespace App\Services\Finance;

use App\Models\PaymentVendorAllocation;
use App\Models\VendorOrder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class EscrowReleaseService
{
    public function __construct(
        private readonly FinancialPostingService $posting,
    ) {}

    public function releaseForVendorOrder(VendorOrder $vendorOrder): void
    {
        $trigger = (string) config('diyar.finance.escrow_release_trigger', 'vendor_order_delivered');

        if ($trigger !== 'vendor_order_delivered') {
            return;
        }

        $allocation = PaymentVendorAllocation::query()
            ->where('vendor_order_id', $vendorOrder->id)
            ->with('payment')
            ->first();

        if ($allocation === null || $allocation->payment === null) {
            return;
        }

        if ($allocation->payment->status->value !== 'paid') {
            throw new InvalidArgumentException(__('diyar.finance.payment_not_paid'));
        }

        DB::transaction(fn () => $this->posting->postEscrowRelease($allocation));
    }
}
