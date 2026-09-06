<?php

namespace Tests\Feature\Api\V1\Coupon;

use App\Enums\OrderStatus;
use App\Enums\RoleName;
use App\Enums\VendorCouponType;
use App\Enums\VendorOrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\VendorCoupon;
use App\Models\VendorCouponUsage;
use App\Models\VendorOrder;
use App\Services\Coupon\VendorCouponUsageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class CouponConcurrencyTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_global_usage_limit_cannot_be_exceeded_with_locked_redemption(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);

        $coupon = VendorCoupon::query()->create([
            'vendor_account_id' => $product->vendor_account_id,
            'code' => 'LIMIT1',
            'type' => VendorCouponType::Percentage,
            'value' => 10,
            'usage_limit' => 1,
            'used_count' => 0,
            'minimum_order' => 0,
            'is_active' => true,
        ]);

        $orderA = $this->createPaidOrderWithCoupon($customer, $product, $coupon, 'DYR-A');
        $orderB = $this->createPaidOrderWithCoupon($customer, $product, $coupon, 'DYR-B');

        app(VendorCouponUsageService::class)->recordForPaidOrder($orderA);
        app(VendorCouponUsageService::class)->recordForPaidOrder($orderB);

        $coupon->refresh();
        $this->assertSame(1, $coupon->used_count);
        $this->assertSame(1, VendorCouponUsage::query()->where('vendor_coupon_id', $coupon->id)->count());
    }

    public function test_duplicate_usage_row_is_idempotent(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 80.00]);

        $coupon = VendorCoupon::query()->create([
            'vendor_account_id' => $product->vendor_account_id,
            'code' => 'ONCE2',
            'type' => VendorCouponType::Percentage,
            'value' => 10,
            'usage_limit' => 5,
            'minimum_order' => 0,
            'is_active' => true,
        ]);

        $order = $this->createPaidOrderWithCoupon($customer, $product, $coupon, 'DYR-C');

        $service = app(VendorCouponUsageService::class);
        $service->recordForPaidOrder($order);
        $service->recordForPaidOrder($order);

        $coupon->refresh();
        $this->assertSame(1, $coupon->used_count);
        $this->assertSame(1, VendorCouponUsage::query()->where('order_id', $order->id)->count());
    }

    private function createPaidOrderWithCoupon($customer, Product $product, VendorCoupon $coupon, string $orderNumber): Order
    {
        $address = $this->createCustomerAddress($customer);

        $order = Order::query()->create([
            'user_id' => $customer->id,
            'order_number' => $orderNumber,
            'status' => OrderStatus::Completed,
            'shipping_address_id' => $address->id,
            'shipping_recipient_name' => $address->recipient_name,
            'shipping_phone' => $address->phone,
            'shipping_city' => $address->city,
            'shipping_district' => $address->district,
            'shipping_street' => $address->street,
            'subtotal' => '100.00',
            'shipping_total' => '0.00',
            'assembly_total' => '0.00',
            'discount_total' => '10.00',
            'vat_amount' => '0.00',
            'grand_total' => '90.00',
        ]);

        VendorOrder::query()->create([
            'order_id' => $order->id,
            'vendor_account_id' => $product->vendor_account_id,
            'vendor_coupon_id' => $coupon->id,
            'coupon_code' => $coupon->code,
            'coupon_percent_snapshot' => $coupon->value,
            'coupon_discount_snapshot' => '10.00',
            'coupon_type_snapshot' => $coupon->type->value,
            'status' => VendorOrderStatus::Pending,
            'subtotal' => '100.00',
            'shipping_method' => 'pickup',
            'shipping_cost' => '0.00',
            'shipping_discount_amount' => '0.00',
            'assembly_cost' => '0.00',
            'discount_amount' => '10.00',
            'vat_amount' => '0.00',
            'vendor_total' => '90.00',
        ]);

        return $order->fresh(['vendorOrders']);
    }
}
