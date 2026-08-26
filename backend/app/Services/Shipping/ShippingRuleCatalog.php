<?php

namespace App\Services\Shipping;

use App\Models\ShippingRateRule;
use Illuminate\Support\Collection;

final class ShippingRuleCatalog
{
    /**
     * @param  list<string>  $methodIds
     * @return Collection<string, Collection<int, ShippingRateRule>>
     */
    public function rulesForMethods(array $methodIds): Collection
    {
        if ($methodIds === []) {
            return collect();
        }

        return ShippingRateRule::query()
            ->whereIn('shipping_method_id', $methodIds)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->groupBy('shipping_method_id');
    }
}
