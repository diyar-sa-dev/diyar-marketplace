<?php

namespace App\Services\Admin;

use App\Models\ShippingCarrier;
use App\Models\ShippingMethod;
use App\Models\ShippingRateRule;
use App\Models\ShippingZone;
use App\Models\VendorShippingProfile;
use App\Services\Shipping\ShippingConfigCache;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

final class AdminShippingConfigurationService
{
    public function __construct(
        private readonly ShippingConfigCache $configCache,
    ) {}

    public function listCarriers(int $page, int $perPage, ?string $search = null): LengthAwarePaginator
    {
        return ShippingCarrier::query()
            ->when($this->hasSearch($search), fn (Builder $query) => $this->applySearch($query, $search, ['name', 'code']))
            ->orderBy('sort_order')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function listZones(int $page, int $perPage, ?string $carrierId = null, ?string $search = null): LengthAwarePaginator
    {
        return ShippingZone::query()
            ->when($carrierId !== null, fn ($query) => $query->where('carrier_id', $carrierId))
            ->when($this->hasSearch($search), fn (Builder $query) => $this->applySearch($query, $search, ['name', 'city', 'region', 'postal_prefix']))
            ->orderByDesc('priority')
            ->orderBy('name')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function listMethods(int $page, int $perPage, ?string $carrierId = null, ?string $search = null): LengthAwarePaginator
    {
        return ShippingMethod::query()
            ->when($carrierId !== null, fn ($query) => $query->where('carrier_id', $carrierId))
            ->when($this->hasSearch($search), fn (Builder $query) => $this->applySearch($query, $search, ['name', 'code']))
            ->orderBy('name')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function listRateRules(int $page, int $perPage, ?string $methodId = null, ?string $search = null): LengthAwarePaginator
    {
        return ShippingRateRule::query()
            ->when($methodId !== null, fn ($query) => $query->where('shipping_method_id', $methodId))
            ->when($this->hasSearch($search), fn (Builder $query) => $this->applySearch($query, $search, ['rate', 'min_weight_kg', 'max_weight_kg']))
            ->orderBy('sort_order')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function listVendorProfiles(int $page, int $perPage, ?string $vendorAccountId = null): LengthAwarePaginator
    {
        return VendorShippingProfile::query()
            ->when($vendorAccountId !== null, fn ($query) => $query->where('vendor_account_id', $vendorAccountId))
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->paginate($perPage, ['*'], 'page', $page);
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
        $this->bumpCache();

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
        $this->bumpCache();

        return $carrier->fresh();
    }

    public function deleteCarrier(ShippingCarrier $carrier): void
    {
        $carrier->delete();
        $this->bumpCache();
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
        $this->bumpCache();

        return $zone;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateZone(ShippingZone $zone, array $payload): ShippingZone
    {
        $zone->update(collect($payload)->only([
            'name', 'country_code', 'region', 'city', 'postal_prefix', 'priority', 'is_active',
        ])->filter(fn ($v) => $v !== null)->all());
        $this->bumpCache();

        return $zone->fresh();
    }

    public function deleteZone(ShippingZone $zone): void
    {
        $zone->delete();
        $this->bumpCache();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function createMethod(array $payload): ShippingMethod
    {
        $method = ShippingMethod::query()->create([
            'carrier_id' => $payload['carrier_id'],
            'code' => Str::slug((string) $payload['code']),
            'name' => $payload['name'],
            'method_type' => $payload['method_type'] ?? 'weight_tier',
            'is_active' => $payload['is_active'] ?? true,
        ]);
        $this->bumpCache();

        return $method;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateMethod(ShippingMethod $method, array $payload): ShippingMethod
    {
        $method->update(collect($payload)->only([
            'code', 'name', 'method_type', 'is_active',
        ])->filter(fn ($v) => $v !== null)->all());
        $this->bumpCache();

        return $method->fresh();
    }

    public function deleteMethod(ShippingMethod $method): void
    {
        $method->delete();
        $this->bumpCache();
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
        $this->bumpCache();

        return $rule;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateRateRule(ShippingRateRule $rule, array $payload): ShippingRateRule
    {
        $rule->update(collect($payload)->only([
            'zone_id', 'vendor_account_id', 'min_weight_kg', 'max_weight_kg', 'min_subtotal',
            'max_subtotal', 'rate', 'handling_fee', 'free_shipping_threshold', 'volumetric_divisor',
            'delivery_estimate_days', 'sort_order', 'is_active',
        ])->filter(fn ($v) => $v !== null)->all());
        $this->bumpCache();

        return $rule->fresh();
    }

    public function deleteRateRule(ShippingRateRule $rule): void
    {
        $rule->delete();
        $this->bumpCache();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function createVendorProfile(array $payload): VendorShippingProfile
    {
        $profile = VendorShippingProfile::query()->create([
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
        $this->bumpCache();

        return $profile;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateVendorProfile(VendorShippingProfile $profile, array $payload): VendorShippingProfile
    {
        $profile->update(collect($payload)->only([
            'shipping_method_id', 'name', 'is_default', 'is_active', 'volumetric_divisor',
            'handling_fee', 'free_shipping_threshold', 'delivery_estimate_days',
        ])->filter(fn ($v) => $v !== null)->all());
        $this->bumpCache();

        return $profile->fresh();
    }

    public function deleteVendorProfile(VendorShippingProfile $profile): void
    {
        $profile->delete();
        $this->bumpCache();
    }

    private function bumpCache(): void
    {
        $this->configCache->bump();
    }

    private function hasSearch(?string $search): bool
    {
        return $search !== null && trim($search) !== '';
    }

    /**
     * @param  list<string>  $columns
     */
    private function applySearch(Builder $query, ?string $search, array $columns): void
    {
        $term = '%'.trim((string) $search).'%';

        $query->where(function (Builder $inner) use ($columns, $term) {
            foreach ($columns as $index => $column) {
                if ($index === 0) {
                    $inner->where($column, 'like', $term);

                    continue;
                }

                $inner->orWhere($column, 'like', $term);
            }
        });
    }
}
