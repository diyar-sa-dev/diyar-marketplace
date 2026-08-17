<?php

namespace App\Http\Resources;

use App\Services\Finance\DTO\VendorFinancePeriodReport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorFinancePeriodReport */
class VendorFinancePeriodReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'period' => [
                'type' => $this->periodType->value,
                'from' => $this->from->toIso8601String(),
                'to' => $this->to->toIso8601String(),
            ],
            'summary' => [
                'currency' => $this->currency,
                'gross_sales' => $this->grossSales,
                'commission' => $this->commission,
                'commission_base' => $this->commissionBase,
                'commission_rate_percent' => $this->commissionRatePercent,
                'refunds' => $this->refunds,
                'adjustments' => $this->adjustments,
                'net_earnings' => $this->netEarnings,
                'pending_escrow' => $this->pendingEscrow,
                'available_balance' => $this->availableBalance,
                'paid_out' => $this->paidOut,
                'total_revenue' => $this->grossSales,
            ],
            'orders' => [
                'completed' => $this->completedOrders,
                'average_order_value' => $this->averageOrderValue,
            ],
            'upcoming_payout' => [
                'amount' => $this->upcomingPayoutAmount,
                'due_at' => $this->upcomingPayoutDueAt,
                'note' => $this->upcomingPayoutNote,
            ],
        ];
    }
}
