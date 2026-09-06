<?php

namespace App\Services\Shipping;

use App\Models\Address;
use App\Models\ShippingZone;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

final class ZoneResolver
{
    public function __construct(
        private readonly ShippingConfigCache $configCache,
    ) {}

    /**
     * Resolve the single best-matching zone using deterministic precedence:
     * postal > district(region) > city > country > default, then priority DESC, then id ASC.
     */
    public function resolveBestZone(string $carrierId, Address $address): ?ShippingZone
    {
        $cacheKey = $this->cacheKey($carrierId, $address);

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($carrierId, $address) {
            return $this->resolveBestZoneUncached($carrierId, $address);
        });
    }

    public function resolveBestZoneUncached(string $carrierId, Address $address): ?ShippingZone
    {
        $zones = ShippingZone::query()
            ->where('carrier_id', $carrierId)
            ->where('is_active', true)
            ->get();

        /** @var Collection<int, ShippingZone> $matches */
        $matches = $zones->filter(fn (ShippingZone $zone) => $this->matches($zone, $address))->values();

        if ($matches->isEmpty()) {
            return null;
        }

        return $matches
            ->sort(function (ShippingZone $a, ShippingZone $b): int {
                $scoreCompare = $this->specificityScore($b) <=> $this->specificityScore($a);
                if ($scoreCompare !== 0) {
                    return $scoreCompare;
                }

                $priorityCompare = ((int) $b->priority) <=> ((int) $a->priority);
                if ($priorityCompare !== 0) {
                    return $priorityCompare;
                }

                return strcmp((string) $a->id, (string) $b->id);
            })
            ->first();
    }

    /**
     * @return Collection<int, ShippingZone>
     */
    public function resolveForAddress(string $carrierId, Address $address): Collection
    {
        $best = $this->resolveBestZone($carrierId, $address);

        return $best === null ? collect() : collect([$best]);
    }

    private function cacheKey(string $carrierId, Address $address): string
    {
        return sprintf(
            'shipping:v3:zones:%d:%s:%s:%s:%s:%s',
            $this->configCache->version(),
            $carrierId,
            $this->normalize($address->country_code ?? 'SA'),
            $this->normalize($address->city),
            $this->normalize($address->district),
            $this->normalize($address->postal_code),
        );
    }

    private function normalize(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        $normalized = mb_strtolower(trim($value));
        $normalized = preg_replace('/\s+/u', ' ', $normalized) ?? $normalized;

        return $normalized;
    }

    private function matches(ShippingZone $zone, Address $address): bool
    {
        $country = trim((string) ($address->country_code ?? 'SA'));

        if ($zone->country_code !== null && ! $this->equalsIgnoreCase($zone->country_code, $country)) {
            return false;
        }

        if ($zone->city !== null && ! $this->equalsIgnoreCase($zone->city, $address->city)) {
            return false;
        }

        if ($zone->region !== null && ! $this->equalsIgnoreCase($zone->region, $address->district)) {
            return false;
        }

        if ($zone->postal_prefix !== null) {
            $postal = trim((string) ($address->postal_code ?? ''));
            if ($postal === '' || ! str_starts_with(mb_strtolower($postal), mb_strtolower($zone->postal_prefix))) {
                return false;
            }
        }

        return true;
    }

    private function specificityScore(ShippingZone $zone): int
    {
        $score = 0;

        if ($zone->postal_prefix !== null) {
            $score += 100;
        }
        if ($zone->region !== null) {
            $score += 40;
        }
        if ($zone->city !== null) {
            $score += 30;
        }
        if ($zone->country_code !== null) {
            $score += 10;
        }

        return $score;
    }

    private function equalsIgnoreCase(?string $a, ?string $b): bool
    {
        if ($a === null || $b === null) {
            return false;
        }

        return mb_strtolower(trim($a)) === mb_strtolower(trim($b));
    }
}
