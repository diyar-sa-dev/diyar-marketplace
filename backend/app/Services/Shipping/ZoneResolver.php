<?php

namespace App\Services\Shipping;

use App\Models\Address;
use App\Models\ShippingZone;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

final class ZoneResolver
{
    /**
     * @return Collection<int, ShippingZone>
     */
    public function resolveForAddress(string $carrierId, Address $address): Collection
    {
        $cacheKey = sprintf(
            'shipping:zones:%s:%s:%s:%s',
            $carrierId,
            $address->city ?? '',
            $address->district ?? '',
            sha1($address->id),
        );

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($carrierId, $address) {
            $zones = ShippingZone::query()
                ->where('carrier_id', $carrierId)
                ->where('is_active', true)
                ->orderByDesc('priority')
                ->get();

            return $zones->filter(fn (ShippingZone $zone) => $this->matches($zone, $address))->values();
        });
    }

    public function resolveBestZone(string $carrierId, Address $address): ?ShippingZone
    {
        return $this->resolveForAddress($carrierId, $address)->first();
    }

    private function matches(ShippingZone $zone, Address $address): bool
    {
        if ($zone->city !== null && ! $this->equalsIgnoreCase($zone->city, $address->city)) {
            return false;
        }

        if ($zone->region !== null && ! $this->equalsIgnoreCase($zone->region, $address->district)) {
            return false;
        }

        return true;
    }

    private function equalsIgnoreCase(?string $a, ?string $b): bool
    {
        if ($a === null || $b === null) {
            return false;
        }

        return mb_strtolower(trim($a)) === mb_strtolower(trim($b));
    }
}
