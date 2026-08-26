<?php

namespace Tests\Feature\Api\V1\Coupon;

use App\Enums\CouponScopeType;
use App\Enums\RoleName;
use App\Enums\ShippingMethod as ShippingMethodEnum;
use App\Enums\ShippingRateMethodType;
use App\Enums\VendorCouponType;
use App\Models\Product;
use App\Models\ShippingCarrier;
use App\Models\ShippingMethod as ShippingMethodModel;
use App\Models\ShippingRateRule;
use App\Models\ShippingZone;
use App\Models\VendorCoupon;
use App\Models\VendorShippingProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class FreeShippingCouponTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_free_shipping_coupon_zeros_carrier_shipping_at_checkout(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create([
            'sale_price' => 250.00,
            'weight_kg' => 1.0,
        ]);

        $carrier = ShippingCarrier::query()->create([
            'code' => 'fs-carrier',
            'name' => 'FS Carrier',
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
            'max_weight_kg' => 10,
            'rate' => '35.00',
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
            'pickup_enabled' => false,
            'use_advanced_rules' => true,
            'shipping_profile_id' => $profile->id,
        ]);

        VendorCoupon::query()->create([
            'vendor_account_id' => $product->vendor_account_id,
            'code' => 'FREESHIP',
            'type' => VendorCouponType::FreeShipping,
            'scope_type' => CouponScopeType::All,
            'value' => 0,
            'minimum_order' => 0,
            'is_active' => true,
        ]);

        $address = $this->createCustomerAddress($customer, ['city' => 'Riyadh']);
        $this->addProductToUserCart($customer, $product);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [[
                'vendor_account_id' => $product->vendor_account_id,
                'method' => ShippingMethodEnum::Carrier->value,
            ]],
            'vendor_coupons' => [[
                'vendor_account_id' => $product->vendor_account_id,
                'code' => 'FREESHIP',
            ]],
        ])
            ->assertOk()
            ->assertJsonPath('data.preview.totals.shipping', '0.00')
            ->assertJsonPath('data.preview.totals.shipping_discount', '35.00')
            ->assertJsonPath('data.preview.totals.discount', '0.00')
            ->assertJsonPath('data.preview.vendor_groups.0.shipping.free_shipping_applied', true)
            ->assertJsonPath('data.preview.vendor_groups.0.shipping.cost', '0.00');
    }

    public function test_free_shipping_coupon_rejected_for_pickup(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);

        VendorCoupon::query()->create([
            'vendor_account_id' => $product->vendor_account_id,
            'code' => 'FREESHIP',
            'type' => VendorCouponType::FreeShipping,
            'scope_type' => CouponScopeType::All,
            'value' => 0,
            'minimum_order' => 0,
            'is_active' => true,
        ]);

        $this->createVendorShippingSettings($product->vendorAccount, ['pickup_enabled' => true]);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [[
                'vendor_account_id' => $product->vendor_account_id,
                'method' => 'pickup',
            ]],
            'vendor_coupons' => [[
                'vendor_account_id' => $product->vendor_account_id,
                'code' => 'FREESHIP',
            ]],
        ])->assertStatus(422);
    }
}
