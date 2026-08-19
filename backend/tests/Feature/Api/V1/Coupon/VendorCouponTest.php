<?php

namespace Tests\Feature\Api\V1\Coupon;

use App\Enums\RoleName;
use App\Models\Order;
use App\Models\Product;
use App\Models\VendorCoupon;
use App\Models\VendorCouponUsage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class VendorCouponTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
    }

    public function test_vendor_can_create_and_manage_coupon(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->postJsonAsUser('/api/v1/dashboard/vendor/coupons', $vendor, [
            'code' => ' summer20 ',
            'value' => 20,
            'minimum_order' => 100,
            'maximum_discount' => 50,
            'usage_limit' => 10,
        ])
            ->assertCreated()
            ->assertJsonPath('data.coupon.code', 'SUMMER20')
            ->assertJsonPath('data.coupon.value', 20);

        $couponId = VendorCoupon::query()->firstOrFail()->id;

        $this->getJsonAsUser('/api/v1/dashboard/vendor/coupons', $vendor)
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1);

        $this->postJsonAsUser("/api/v1/dashboard/vendor/coupons/{$couponId}/deactivate", $vendor)
            ->assertOk()
            ->assertJsonPath('data.coupon.is_active', false);

        $this->postJsonAsUser("/api/v1/dashboard/vendor/coupons/{$couponId}/activate", $vendor)
            ->assertOk()
            ->assertJsonPath('data.coupon.is_active', true);
    }

    public function test_customer_cannot_create_vendor_coupon(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        $this->postJsonAsUser('/api/v1/dashboard/vendor/coupons', $customer, [
            'code' => 'NOPE',
            'value' => 10,
        ])->assertForbidden();
    }

    public function test_invalid_percentage_is_rejected(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->postJsonAsUser('/api/v1/dashboard/vendor/coupons', $vendor, [
            'code' => 'LOW',
            'value' => 4,
        ])->assertUnprocessable();

        $this->postJsonAsUser('/api/v1/dashboard/vendor/coupons', $vendor, [
            'code' => 'HIGH',
            'value' => 91,
        ])->assertUnprocessable();
    }

    public function test_duplicate_code_within_store_is_rejected(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->postJsonAsUser('/api/v1/dashboard/vendor/coupons', $vendor, [
            'code' => 'WELCOME10',
            'value' => 10,
        ])->assertCreated();

        $this->postJsonAsUser('/api/v1/dashboard/vendor/coupons', $vendor, [
            'code' => 'welcome10',
            'value' => 15,
        ])->assertStatus(409);
    }

    public function test_checkout_preview_applies_store_scoped_coupon_without_consuming_usage(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 1000.00,
        ]);

        VendorCoupon::query()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'code' => 'SAVE20',
            'type' => 'percentage',
            'value' => 20,
            'minimum_order' => 500,
            'maximum_discount' => 150,
            'is_active' => true,
            'usage_limit' => 1,
            'used_count' => 0,
        ]);

        $this->createVendorShippingSettings($vendor->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product, 1);

        $payload = array_merge($this->checkoutPayload($address, $product), [
            'vendor_coupons' => [
                [
                    'vendor_account_id' => $vendor->vendorAccount->id,
                    'code' => 'save20',
                ],
            ],
        ]);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $payload)
            ->assertOk()
            ->assertJsonPath('data.preview.vendor_groups.0.discount', '150.00')
            ->assertJsonPath('data.preview.vendor_groups.0.coupon.code', 'SAVE20')
            ->assertJsonPath('data.preview.totals.discount', '150.00')
            ->assertJsonPath('data.preview.totals.vat', '131.70')
            ->assertJsonPath('data.preview.totals.total', '1009.70');

        $this->assertSame(0, VendorCoupon::query()->firstOrFail()->used_count);
    }

    public function test_checkout_preview_recalculates_vat_after_percentage_coupon(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 1520.00,
        ]);

        VendorCoupon::query()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'code' => 'HALF50',
            'type' => 'percentage',
            'value' => 50,
            'minimum_order' => 0,
            'maximum_discount' => null,
            'is_active' => true,
        ]);

        $this->createVendorShippingSettings($vendor->vendorAccount, [
            'carrier_flat_rate' => '30.00',
        ]);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product, 3);

        $payload = array_merge($this->checkoutPayload($address, $product), [
            'vendor_coupons' => [
                [
                    'vendor_account_id' => $vendor->vendorAccount->id,
                    'code' => 'HALF50',
                ],
            ],
        ]);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $payload)
            ->assertOk()
            ->assertJsonPath('data.preview.totals.subtotal', '4560.00')
            ->assertJsonPath('data.preview.totals.shipping', '30.00')
            ->assertJsonPath('data.preview.totals.discount', '2280.00')
            ->assertJsonPath('data.preview.totals.vat', '346.50')
            ->assertJsonPath('data.preview.totals.total', '2656.50');
    }

    public function test_coupon_usage_is_recorded_after_successful_payment(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 1000.00,
        ]);

        $coupon = VendorCoupon::query()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'code' => 'PAY20',
            'type' => 'percentage',
            'value' => 20,
            'minimum_order' => 0,
            'maximum_discount' => null,
            'is_active' => true,
            'usage_limit' => 5,
            'used_count' => 0,
        ]);

        $this->createVendorShippingSettings($vendor->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product, 1);

        $payload = array_merge($this->checkoutPayload($address, $product), [
            'vendor_coupons' => [
                [
                    'vendor_account_id' => $vendor->vendorAccount->id,
                    'code' => 'PAY20',
                ],
            ],
        ]);

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $payload, [
            'Idempotency-Key' => (string) Str::uuid(),
        ])->assertCreated()->json('data.order.id');

        $order = Order::query()->with('vendorOrders')->findOrFail($orderId);
        $vendorOrder = $order->vendorOrders->first();
        $this->assertSame($coupon->id, $vendorOrder->vendor_coupon_id);
        $this->assertSame('PAY20', $vendorOrder->coupon_code);
        $this->assertSame(20, $vendorOrder->coupon_percent_snapshot);

        $paymentInit = $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment", $customer, [
            'idempotency_key' => (string) Str::uuid(),
        ])->assertOk();

        $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment/simulate", $customer, [
            'attempt_id' => $paymentInit->json('data.attempt_id'),
            'outcome' => 'success',
        ])->assertOk();

        $this->assertSame(1, $coupon->fresh()->used_count);
        $this->assertSame(1, VendorCouponUsage::query()->count());
    }

    public function test_store_mismatch_coupon_is_rejected(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendorB->vendorAccount->id,
            'sale_price' => 500.00,
        ]);

        VendorCoupon::query()->create([
            'vendor_account_id' => $vendorA->vendorAccount->id,
            'code' => 'VENDORA',
            'type' => 'percentage',
            'value' => 10,
            'is_active' => true,
        ]);

        $this->createVendorShippingSettings($vendorB->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product, 1);

        $payload = array_merge($this->checkoutPayload($address, $product), [
            'vendor_coupons' => [
                [
                    'vendor_account_id' => $vendorB->vendorAccount->id,
                    'code' => 'VENDORA',
                ],
            ],
        ]);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $payload)
            ->assertUnprocessable();
    }

    public function test_vendor_cannot_access_other_vendor_coupon(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        $coupon = VendorCoupon::query()->create([
            'vendor_account_id' => $vendorA->vendorAccount->id,
            'code' => 'PRIVATE',
            'type' => 'percentage',
            'value' => 10,
            'is_active' => true,
        ]);

        $this->getJsonAsUser("/api/v1/dashboard/vendor/coupons/{$coupon->id}", $vendorB)
            ->assertNotFound();
    }
}
