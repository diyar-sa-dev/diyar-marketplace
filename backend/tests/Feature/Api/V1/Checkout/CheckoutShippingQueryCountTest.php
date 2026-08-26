<?php

namespace Tests\Feature\Api\V1\Checkout;

use App\Enums\RoleName;
use App\Enums\ShippingRateMethodType;
use App\Models\Product;
use App\Models\ShippingCarrier;
use App\Models\ShippingMethod as ShippingMethodModel;
use App\Models\ShippingRateRule;
use App\Models\ShippingZone;
use App\Models\VendorShippingProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\AssertsQueryCount;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class CheckoutShippingQueryCountTest extends TestCase
{
    use AssertsQueryCount, InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_checkout_preview_query_count_does_not_scale_linearly_with_cart_items(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create([
            'sale_price' => 50.00,
            'weight_kg' => 1.0,
        ]);

        $this->seedAdvancedShipping($product);

        $address = $this->createCustomerAddress($customer, ['city' => 'Riyadh']);

        $oneItemCount = $this->countQueries(function () use ($customer, $address, $product) {
            $this->addProductToUserCart($customer, $product, 1);
            $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $this->checkoutPayload($address, $product))
                ->assertOk();
        });

        $customer->cart?->items()->delete();
        $customer->refresh();

        $tenItemsCount = $this->countQueries(function () use ($customer, $address, $product) {
            $this->addProductToUserCart($customer, $product, 10);
            $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $this->checkoutPayload($address, $product))
                ->assertOk();
        });

        $this->assertLessThanOrEqual(
            $oneItemCount + 5,
            $tenItemsCount,
            "Query count grew from {$oneItemCount} to {$tenItemsCount}; expected bounded growth.",
        );
    }

    private function seedAdvancedShipping(Product $product): void
    {
        $carrier = ShippingCarrier::query()->create(['code' => 'qc-carrier', 'name' => 'QC', 'is_active' => true]);
        $zone = ShippingZone::query()->create([
            'carrier_id' => $carrier->id,
            'name' => 'Riyadh',
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
        ShippingRateRule::query()->create([
            'shipping_method_id' => $method->id,
            'zone_id' => $zone->id,
            'min_weight_kg' => 0,
            'max_weight_kg' => 100,
            'rate' => '20.00',
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
    }
}
