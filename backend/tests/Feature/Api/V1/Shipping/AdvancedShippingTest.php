<?php

namespace Tests\Feature\Api\V1\Shipping;

use App\Enums\RoleName;
use App\Enums\ShippingMethod as ShippingMethodEnum;
use App\Enums\ShippingRateMethodType;
use App\Models\Product;
use App\Models\ShippingCarrier;
use App\Models\ShippingMethod as ShippingMethodModel;
use App\Models\ShippingRateRule;
use App\Models\ShippingZone;
use App\Models\VendorShippingProfile;
use App\Services\Shipping\ShippingWeightCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdvancedShippingTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_weight_calculator_uses_greater_of_actual_and_volumetric_weight(): void
    {
        $product = Product::factory()->create([
            'weight_kg' => 1.0,
            'width' => 50,
            'height' => 50,
            'depth' => 50,
        ]);

        $calculator = app(ShippingWeightCalculator::class);
        $weight = $calculator->calculateBillableWeight(collect([(object) [
            'product' => $product,
            'quantity' => 1,
        ]]), 5000);

        $this->assertSame('25.000', $weight);
    }

    public function test_advanced_shipping_quote_uses_weight_tier_rules(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create([
            'sale_price' => 200.00,
            'weight_kg' => 2.5,
        ]);

        $carrier = ShippingCarrier::query()->create([
            'code' => 'diyar-carrier',
            'name' => 'DIYAR Carrier',
            'is_active' => true,
        ]);

        $zone = ShippingZone::query()->create([
            'carrier_id' => $carrier->id,
            'name' => 'Riyadh',
            'city' => 'Riyadh',
            'priority' => 10,
            'is_active' => true,
        ]);

        $method = ShippingMethodModel::query()->create([
            'carrier_id' => $carrier->id,
            'code' => 'standard',
            'name' => 'Standard',
            'method_type' => ShippingRateMethodType::WeightTier,
            'is_active' => true,
        ]);

        ShippingRateRule::query()->create([
            'shipping_method_id' => $method->id,
            'zone_id' => $zone->id,
            'min_weight_kg' => 0,
            'max_weight_kg' => 5,
            'rate' => '45.00',
            'delivery_estimate_days' => 3,
            'is_active' => true,
        ]);

        $profile = VendorShippingProfile::query()->create([
            'vendor_account_id' => $product->vendor_account_id,
            'shipping_method_id' => $method->id,
            'name' => 'Default',
            'is_default' => true,
            'is_active' => true,
        ]);

        $settings = $this->createVendorShippingSettings($product->vendorAccount, [
            'carrier_flat_rate' => '99.00',
            'pickup_enabled' => false,
            'use_advanced_rules' => true,
            'shipping_profile_id' => $profile->id,
        ]);

        $address = $this->createCustomerAddress($customer, ['city' => 'Riyadh']);
        $this->addProductToUserCart($customer, $product);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [[
                'vendor_account_id' => $product->vendor_account_id,
                'method' => ShippingMethodEnum::Carrier->value,
            ]],
        ])
            ->assertOk()
            ->assertJsonPath('data.preview.totals.shipping', '45.00')
            ->assertJsonPath('data.preview.vendor_groups.0.shipping.delivery_estimate_days', 3);

        $this->assertTrue($settings->use_advanced_rules);
    }

    public function test_flat_rate_fallback_when_advanced_rules_disabled(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);

        $this->createVendorShippingSettings($product->vendorAccount, [
            'carrier_flat_rate' => '22.00',
            'pickup_enabled' => false,
            'use_advanced_rules' => false,
        ]);

        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $this->checkoutPayload($address, $product))
            ->assertOk()
            ->assertJsonPath('data.preview.totals.shipping', '22.00');
    }

    public function test_unsupported_zone_fails_safely(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['weight_kg' => 1]);

        $carrier = ShippingCarrier::query()->create(['code' => 'c1', 'name' => 'C1', 'is_active' => true]);
        $method = ShippingMethodModel::query()->create([
            'carrier_id' => $carrier->id,
            'code' => 'std',
            'name' => 'Std',
            'method_type' => ShippingRateMethodType::WeightTier,
            'is_active' => true,
        ]);
        ShippingZone::query()->create([
            'carrier_id' => $carrier->id,
            'name' => 'Jeddah only',
            'city' => 'Jeddah',
            'is_active' => true,
        ]);
        $profile = VendorShippingProfile::query()->create([
            'vendor_account_id' => $product->vendor_account_id,
            'shipping_method_id' => $method->id,
            'name' => 'Default',
            'is_default' => true,
            'is_active' => true,
        ]);

        $this->createVendorShippingSettings($product->vendorAccount, [
            'use_advanced_rules' => true,
            'shipping_profile_id' => $profile->id,
            'pickup_enabled' => false,
        ]);

        $address = $this->createCustomerAddress($customer, ['city' => 'Riyadh']);
        $this->addProductToUserCart($customer, $product);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $this->checkoutPayload($address, $product))
            ->assertStatus(422);
    }
}
