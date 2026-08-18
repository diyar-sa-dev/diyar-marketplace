<?php

namespace Tests\Concerns;

use App\Enums\ReturnReason;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\VendorOrder;
use App\Models\VendorReturnPolicy;
use App\Models\VendorShippingSettings;
use Illuminate\Support\Str;

trait InteractsWithDeliveredOrders
{
    /**
     * @return array{0: User, 1: User, 2: VendorOrder, 3: Product}
     */
    protected function deliverSingleItemOrder(): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 150.00,
            'return_requires_evidence' => false,
        ]);

        VendorReturnPolicy::query()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'returnable' => true,
            'return_window_days' => 14,
            'accepted_reasons' => [ReturnReason::ManufacturingDefect->value],
            'requires_unused' => false,
            'requires_evidence' => false,
            'return_shipping_paid_by' => 'customer',
            'shipping_refundable' => false,
        ]);

        $this->createVendorShippingSettings($vendor->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product, 1);

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) Str::uuid(),
        ])->assertCreated()->json('data.order.id');

        $order = Order::query()->with(['vendorOrders.shipment', 'payment'])->findOrFail($orderId);
        $this->payDeliveredOrder($customer, $order);
        $vendorOrder = $order->vendorOrders->first();

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'DEL-'.$vendorOrder->id,
        ])->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendor)->assertOk();

        $vendorOrder->refresh();

        return [$customer, $vendor, $vendorOrder, $product];
    }

    protected function payDeliveredOrder(User $customer, Order $order): void
    {
        $paymentInit = $this->postJsonAsUser("/api/v1/orders/{$order->id}/payment", $customer, [
            'idempotency_key' => (string) Str::uuid(),
        ])->assertOk();

        $this->postJsonAsUser("/api/v1/orders/{$order->id}/payment/simulate", $customer, [
            'attempt_id' => $paymentInit->json('data.attempt_id'),
            'outcome' => 'success',
        ])->assertOk();
    }

    protected function ensureVendorShipping(User $vendor): void
    {
        if (! VendorShippingSettings::query()->where('vendor_account_id', $vendor->vendorAccount->id)->exists()) {
            $this->createVendorShippingSettings($vendor->vendorAccount);
        }
    }
}
