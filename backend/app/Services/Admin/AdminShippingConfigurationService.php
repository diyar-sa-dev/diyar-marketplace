<?php

namespace App\Services\Admin;

use App\Models\ShippingCarrier;
use App\Models\ShippingMethod;
use App\Models\ShippingRateRule;
use App\Models\ShippingZone;
use App\Models\VendorShippingProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

final class AdminShippingConfigurationService
{
    public function listCarriers(int $page, int $perPage): LengthAwarePaginator
    {
        return ShippingCarrier::query()->orderBy('sort_order')->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function createCarrier(array $payload): ShippingCarrier
    {
        $carrier = ShippingCarrier::query()->create([
            'code' => Str::slug((string) $payload['code']),
            'name' => $payload['name'],
            'is_active' => $payload['is_active'] ?? true,
            'sort_order' => $payload['sort_order'] ?? 0,
        ]);
        $this->flushShippingCache();

        return $carrier;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateCarrier(ShippingCarrier $carrier, array $payload): ShippingCarrier
    {
        $carrier->update(collect($payload)->only([
            'code', 'name', 'is_active', 'sort_order',
        ])->filter(fn ($v) => $v !== null)->all());
        $this->flushShippingCache();

        return $carrier->fresh();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function createZone(array $payload): ShippingZone
    {
        $zone = ShippingZone::query()->create([
            'carrier_id' => $payload['carrier_id'],
            'name' => $payload['name'],
            'country_code' => $payload['country_code'] ?? null,
            'region' => $payload['region'] ?? null,
            'city' => $payload['city'] ?? null,
            'postal_prefix' => $payload['postal_prefix'] ?? null,
            'priority' => $payload['priority'] ?? 0,
            'is_active' => $payload['is_active'] ?? true,
        ]);
        $this->flushShippingCache();

        return $zone;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function createMethod(array $payload): ShippingMethod
    {
        return ShippingMethod::query()->create([
            'carrier_id' => $payload['carrier_id'],
            'code' => Str::slug((string) $payload['code']),
            'name' => $payload['name'],
            'method_type' => $payload['method_type'] ?? 'weight_tier',
            'is_active' => $payload['is_active'] ?? true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function createRateRule(array $payload): ShippingRateRule
    {
        $rule = ShippingRateRule::query()->create([
            'shipping_method_id' => $payload['shipping_method_id'],
            'zone_id' => $payload['zone_id'] ?? null,
            'vendor_account_id' => $payload['vendor_account_id'] ?? null,
            'min_weight_kg' => $payload['min_weight_kg'] ?? 0,
            'max_weight_kg' => $payload['max_weight_kg'] ?? null,
            'min_subtotal' => $payload['min_subtotal'] ?? 0,
            'max_subtotal' => $payload['max_subtotal'] ?? null,
            'rate' => $payload['rate'],
            'handling_fee' => $payload['handling_fee'] ?? 0,
            'free_shipping_threshold' => $payload['free_shipping_threshold'] ?? null,
            'volumetric_divisor' => $payload['volumetric_divisor'] ?? null,
            'delivery_estimate_days' => $payload['delivery_estimate_days'] ?? null,
            'sort_order' => $payload['sort_order'] ?? 0,
            'is_active' => $payload['is_active'] ?? true,
        ]);
        $this->flushShippingCache();

        return $rule;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function createVendorProfile(array $payload): VendorShippingProfile
    {
        return VendorShippingProfile::query()->create([
            'vendor_account_id' => $payload['vendor_account_id'],
            'shipping_method_id' => $payload['shipping_method_id'] ?? null,
            'name' => $payload['name'],
            'is_default' => $payload['is_default'] ?? false,
            'is_active' => $payload['is_active'] ?? true,
            'volumetric_divisor' => $payload['volumetric_divisor'] ?? null,
            'handling_fee' => $payload['handling_fee'] ?? 0,
            'free_shipping_threshold' => $payload['free_shipping_threshold'] ?? null,
            'delivery_estimate_days' => $payload['delivery_estimate_days'] ?? null,
        ]);
    }

    private function flushShippingCache(): void
    {
        Cache::flush();
    }
}
