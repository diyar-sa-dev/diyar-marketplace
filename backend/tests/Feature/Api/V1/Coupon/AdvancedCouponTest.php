<?php

namespace Tests\Feature\Api\V1\Coupon;

use App\Enums\CouponScopeType;
use App\Enums\RoleName;
use App\Enums\VendorCouponType;
use App\Models\Order;
use App\Models\Product;
use App\Models\VendorCoupon;
use App\Models\VendorCouponExclusion;
use App\Models\VendorCouponScope;
use App\Models\VendorCouponUsage;
use App\Models\VendorOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdvancedCouponTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_category_scoped_coupon_discounts_only_eligible_items(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $eligible = Product::factory()->create(['sale_price' => 100.00]);
        $other = Product::factory()->create([
            'vendor_account_id' => $eligible->vendor_account_id,
            'sale_price' => 200.00,
        ]);

        $coupon = VendorCoupon::query()->create([
            'vendor_account_id' => $eligible->vendor_account_id,
            'code' => 'CAT10',
            'type' => VendorCouponType::Percentage,
            'scope_type' => CouponScopeType::Category,
            'value' => 10,
            'minimum_order' => 0,
            'is_active' => true,
        ]);

        VendorCouponScope::query()->create([
            'vendor_coupon_id' => $coupon->id,
            'scope_type' => 'category',
            'scope_id' => $eligible->category_id,
        ]);

        $this->createVendorShippingSettings($eligible->vendorAccount, ['pickup_enabled' => true]);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $eligible);
        $this->addProductToUserCart($customer, $other);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [[
                'vendor_account_id' => $eligible->vendor_account_id,
                'method' => 'pickup',
            ]],
            'vendor_coupons' => [[
                'vendor_account_id' => $eligible->vendor_account_id,
                'code' => 'CAT10',
            ]],
        ])
            ->assertOk()
            ->assertJsonPath('data.preview.totals.subtotal', '300.00')
            ->assertJsonPath('data.preview.totals.discount', '10.00');
    }

    public function test_excluded_product_receives_no_discount(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 150.00]);

        $coupon = VendorCoupon::query()->create([
            'vendor_account_id' => $product->vendor_account_id,
            'code' => 'SAVE15',
            'type' => VendorCouponType::Percentage,
            'scope_type' => CouponScopeType::All,
            'value' => 15,
            'minimum_order' => 0,
            'is_active' => true,
        ]);

        VendorCouponExclusion::query()->create([
            'vendor_coupon_id' => $coupon->id,
            'exclusion_type' => 'product',
            'exclusion_id' => $product->id,
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
                'code' => 'SAVE15',
            ]],
        ])->assertStatus(422);
    }

    public function test_fixed_amount_coupon_respects_subtotal_cap(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 80.00]);

        VendorCoupon::query()->create([
            'vendor_account_id' => $product->vendor_account_id,
            'code' => 'FIX50',
            'type' => VendorCouponType::Fixed,
            'scope_type' => CouponScopeType::All,
            'value' => 0,
            'fixed_amount' => 50,
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
                'code' => 'FIX50',
            ]],
        ])
            ->assertOk()
            ->assertJsonPath('data.preview.totals.discount', '50.00');
    }

    public function test_per_user_limit_is_enforced_at_preview(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 120.00]);

        $coupon = VendorCoupon::query()->create([
            'vendor_account_id' => $product->vendor_account_id,
            'code' => 'ONCE',
            'type' => VendorCouponType::Percentage,
            'value' => 10,
            'usage_limit_per_user' => 1,
            'minimum_order' => 0,
            'is_active' => true,
        ]);

        $this->createVendorShippingSettings($product->vendorAccount, ['pickup_enabled' => true]);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $payload = [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [[
                'vendor_account_id' => $product->vendor_account_id,
                'method' => 'pickup',
            ]],
            'vendor_coupons' => [[
                'vendor_account_id' => $product->vendor_account_id,
                'code' => 'ONCE',
            ]],
        ];

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $payload)->assertOk();

        $order = Order::query()->create([
            'user_id' => $customer->id,
            'order_number' => 'T-'.random_int(1000, 9999),
            'status' => 'pending',
            'shipping_address_id' => $address->id,
            'shipping_recipient_name' => $address->recipient_name,
            'shipping_phone' => $address->phone,
            'shipping_city' => $address->city,
            'shipping_district' => $address->district,
            'shipping_street' => $address->street,
            'subtotal' => '120.00',
            'shipping_total' => '0.00',
            'assembly_total' => '0.00',
            'discount_total' => '12.00',
            'vat_amount' => '0.00',
            'grand_total' => '108.00',
        ]);

        $vendorOrder = VendorOrder::query()->create([
            'order_id' => $order->id,
            'vendor_account_id' => $product->vendor_account_id,
            'status' => 'pending',
            'subtotal' => '120.00',
            'shipping_method' => 'pickup',
            'shipping_cost' => '0.00',
            'assembly_cost' => '0.00',
            'discount_amount' => '12.00',
            'vat_amount' => '0.00',
            'vendor_total' => '108.00',
        ]);

        VendorCouponUsage::query()->create([
            'vendor_coupon_id' => $coupon->id,
            'user_id' => $customer->id,
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'discount_amount' => '12.00',
            'coupon_code' => 'ONCE',
            'coupon_percent' => 10,
            'used_at' => now(),
        ]);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $payload)->assertStatus(422);
    }
}
