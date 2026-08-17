<?php

namespace Tests\Feature\Api\V1\Shipping;

use App\Enums\RoleName;
use App\Enums\ShippingMethod;
use App\Models\Product;
use App\Models\VendorAccount;
use App\Models\VendorShippingSettings;
use App\Services\Shipping\ShippingQuoteService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class VendorShippingSettingsTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_vendor_can_save_and_load_shipping_settings(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->putStatefulJsonAsUser('/api/v1/dashboard/vendor/shipping-settings', $vendor, [
            'carrier_enabled' => true,
            'carrier_flat_rate' => '35.00',
            'carrier_free_shipping_enabled' => true,
            'carrier_free_shipping_threshold' => '500.00',
            'pickup_enabled' => true,
            'pickup_location_label' => 'Riyadh Branch',
        ])->assertOk()
            ->assertJsonPath('data.shipping_settings.carrier_flat_rate', '35.00');

        $this->actingAs($vendor)->getJson('/api/v1/dashboard/vendor/shipping-settings')
            ->assertOk()
            ->assertJsonPath('data.shipping_settings.pickup_location_label', 'Riyadh Branch');
    }

    public function test_customer_cannot_access_vendor_shipping_settings(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        $this->actingAs($customer)->getJson('/api/v1/dashboard/vendor/shipping-settings')
            ->assertForbidden();
    }

    public function test_carrier_enabled_requires_rate(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->putStatefulJsonAsUser('/api/v1/dashboard/vendor/shipping-settings', $vendor, [
            'carrier_enabled' => true,
            'carrier_flat_rate' => null,
            'carrier_free_shipping_enabled' => false,
            'carrier_free_shipping_threshold' => null,
            'pickup_enabled' => false,
            'pickup_location_label' => null,
        ])->assertUnprocessable();
    }

    public function test_at_least_one_method_must_be_enabled(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->putStatefulJsonAsUser('/api/v1/dashboard/vendor/shipping-settings', $vendor, [
            'carrier_enabled' => false,
            'carrier_flat_rate' => null,
            'carrier_free_shipping_enabled' => false,
            'carrier_free_shipping_threshold' => null,
            'pickup_enabled' => false,
            'pickup_location_label' => null,
        ])->assertUnprocessable();
    }

    public function test_shipping_quote_service_applies_free_shipping_at_threshold(): void
    {
        $product = Product::factory()->create(['sale_price' => 500.00]);
        $vendorAccount = VendorAccount::query()->findOrFail($product->vendor_account_id);

        VendorShippingSettings::query()->create([
            'vendor_account_id' => $vendorAccount->id,
            'carrier_enabled' => true,
            'carrier_flat_rate' => '28.00',
            'carrier_free_shipping_enabled' => true,
            'carrier_free_shipping_threshold' => '500.00',
            'pickup_enabled' => false,
        ]);

        $quoteService = app(ShippingQuoteService::class);
        $settings = VendorShippingSettings::query()->where('vendor_account_id', $vendorAccount->id)->firstOrFail();
        $quote = $quoteService->quoteVendorGroup($settings, ShippingMethod::Carrier, '500.00');

        $this->assertSame('0.00', $quote->shippingCost);
        $this->assertTrue($quote->freeShippingApplied);
    }
}
