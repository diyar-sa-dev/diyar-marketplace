<?php

namespace Tests\Unit\Services\Shipping;

use App\Models\Address;
use App\Models\ShippingCarrier;
use App\Models\ShippingZone;
use App\Services\Shipping\ZoneResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ZoneResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_prefers_more_specific_zone_over_broader_zone(): void
    {
        $carrier = ShippingCarrier::query()->create([
            'code' => 'z-test',
            'name' => 'Zone Test',
            'is_active' => true,
        ]);

        ShippingZone::query()->create([
            'carrier_id' => $carrier->id,
            'name' => 'Saudi default',
            'country_code' => 'SA',
            'priority' => 1,
            'is_active' => true,
        ]);

        $cityZone = ShippingZone::query()->create([
            'carrier_id' => $carrier->id,
            'name' => 'Riyadh city',
            'country_code' => 'SA',
            'city' => 'Riyadh',
            'priority' => 1,
            'is_active' => true,
        ]);

        $address = Address::factory()->make([
            'city' => 'Riyadh',
            'district' => 'Al Olaya',
        ]);

        $resolver = app(ZoneResolver::class);
        $resolved = $resolver->resolveBestZoneUncached($carrier->id, $address);

        $this->assertNotNull($resolved);
        $this->assertSame($cityZone->id, $resolved->id);
    }

    public function test_default_zone_matches_when_no_city_specific_zone(): void
    {
        $carrier = ShippingCarrier::query()->create([
            'code' => 'z-default',
            'name' => 'Default Zone Test',
            'is_active' => true,
        ]);

        $defaultZone = ShippingZone::query()->create([
            'carrier_id' => $carrier->id,
            'name' => 'Fallback',
            'is_active' => true,
        ]);

        $address = Address::factory()->make([
            'city' => 'Dammam',
            'district' => 'Central',
        ]);

        $resolver = app(ZoneResolver::class);
        $resolved = $resolver->resolveBestZoneUncached($carrier->id, $address);

        $this->assertNotNull($resolved);
        $this->assertSame($defaultZone->id, $resolved->id);
    }
}
