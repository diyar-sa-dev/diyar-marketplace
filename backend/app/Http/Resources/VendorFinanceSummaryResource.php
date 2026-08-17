<?php

namespace App\Http\Resources;

use App\Services\Finance\DTO\VendorBalanceSummary;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorBalanceSummary */
class VendorFinanceSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'currency' => $this->currency,
            'total_revenue' => $this->totalRevenue,
            'pending_escrow' => $this->pendingEscrow,
            'available_balance' => $this->availableBalance,
            'paid_out' => $this->paidOut,
        ];
    }
}
