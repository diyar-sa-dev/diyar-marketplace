<?php

namespace Tests\Unit\Services\Shipping;

use App\Enums\ShippingRateMethodType;
use App\Models\Product;
use App\Models\ShippingCarrier;
use App\Models\ShippingMethod as ShippingMethodModel;
use App\Models\ShippingRateRule;
use App\Models\ShippingZone;
use App\Models\VendorShippingProfile;
use App\Models\VendorShippingSettings;
use App\Services\Shipping\ShippingRuleEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShippingRulePrecedenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_specific_rule_wins_over_platform_rule(): void
    {
        $carrier = ShippingCarrier::query()->create(['code' => 'c', 'name' => 'C', 'is_active' => true]);
        $zone = ShippingZone::query()->create([
            'carrier_id' => $carrier->id,
            'name' => 'City',
            'city' => 'Riyadh',
            'is_active' => true,
        ]);
        $method = ShippingMethodModel::query()->create([
            'carrier_id' => $carrier->id,
            'code' => 'std',
            'name' => 'Std',
            'method_type' => ShippingRateMethodType::WeightTier,
            'is_active' => true,
        ]);

        $product = Product::factory()->create(['weight_kg' => 1.0]);
        $settingsVendorId = $product->vendor_account_id;

        $platformRule = ShippingRateRule::query()->create([
            'shipping_method_id' => $method->id,
            'zone_id' => $zone->id,
            'rate' => '99.00',
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $vendorRule = ShippingRateRule::query()->create([
            'shipping_method_id' => $method->id,
            'zone_id' => $zone->id,
            'vendor_account_id' => $settingsVendorId,
            'rate' => '25.00',
            'sort_order' => 5,
            'is_active' => true,
        ]);

        $settings = VendorShippingSettings::query()->create([
            'vendor_account_id' => $settingsVendorId,
            'carrier_enabled' => true,
            'carrier_flat_rate' => '30.00',
            'pickup_enabled' => false,
            'use_advanced_rules' => true,
        ]);

        $profile = VendorShippingProfile::query()->create([
            'vendor_account_id' => $settingsVendorId,
            'shipping_method_id' => $method->id,
            'name' => 'Default',
            'is_default' => true,
            'is_active' => true,
        ]);

        $engine = app(ShippingRuleEngine::class);
        $resolved = $engine->resolveRate(
            $settings,
            '100.00',
            $zone,
            collect([(object) ['product' => $product, 'quantity' => 1]]),
            $profile,
        );

        $this->assertSame('25.00', $resolved['rate']);
        $this->assertNotSame($platformRule->rate, $resolved['rate']);
        $this->assertSame($vendorRule->rate, $resolved['rate']);
    }
}
