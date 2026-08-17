<?php

namespace App\Http\Resources;

use App\Services\Finance\DTO\VendorFinanceAnalyticsPoint;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorFinanceAnalyticsPoint */
class VendorFinanceAnalyticsPointResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'label' => $this->label,
            'net_earnings' => $this->netEarnings,
            'commission' => $this->commission,
            'gross_sales' => $this->grossSales,
        ];
    }
}
