<?php

namespace App\Http\Resources\Admin;

use App\Services\Finance\DTO\PlatformFinancePeriodReport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PlatformFinancePeriodReport */
class AdminPlatformFinancePeriodReportResource extends JsonResource
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
                'granularity' => $this->granularity,
            ],
            'summary' => [
                'currency' => $this->currency,
                'platform_earnings' => $this->platformEarnings,
                'gross_sales' => $this->grossSales,
                'platform_commission' => $this->platformCommission,
                'affiliate_commission' => $this->affiliateCommission,
                'refunds' => $this->refunds,
                'net_earnings' => $this->netEarnings,
                'pending_escrow' => $this->pendingEscrow,
                'pending_vendor_payouts' => $this->pendingVendorPayouts,
                'pending_provider_payouts' => $this->pendingProviderPayouts,
                'pending_affiliate_payouts' => $this->pendingAffiliatePayouts,
            ],
            'orders' => [
                'completed' => $this->completedOrders,
                'average_order_value' => $this->averageOrderValue,
            ],
            'series' => $this->series,
        ];
    }
}
