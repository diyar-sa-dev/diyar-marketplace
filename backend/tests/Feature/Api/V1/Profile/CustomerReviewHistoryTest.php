<?php

namespace Tests\Feature\Api\V1\Profile;

use App\Enums\ReturnReason;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\VendorOrder;
use App\Models\VendorReturnPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class CustomerReviewHistoryTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
    }

    public function test_customer_can_list_published_and_pending_reviews(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $product = Product::query()->findOrFail($vendorOrder->items()->first()->product_id);
        $slug = $vendor->vendorAccount->slug;

        $this->getJsonAsUser('/api/v1/profile/reviews?status=pending', $customer)
            ->assertOk()
            ->assertJsonPath('data.summary.pending_count', 2)
            ->assertJsonPath('data.summary.pending_by_type.product', 1)
            ->assertJsonPath('data.summary.pending_by_type.store', 1);

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 5,
        ])->assertOk();

        $this->postJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer, [
            'rating' => 4,
            'comment' => 'Great product',
        ])->assertOk();

        $this->getJsonAsUser('/api/v1/profile/reviews?status=published', $customer)
            ->assertOk()
            ->assertJsonPath('data.summary.published_count', 2)
            ->assertJsonCount(2, 'data.items');

        $this->getJsonAsUser('/api/v1/profile/reviews?status=pending', $customer)
            ->assertOk()
            ->assertJsonPath('data.summary.pending_count', 0)
            ->assertJsonCount(0, 'data.items');
    }

    public function test_review_history_is_scoped_to_authenticated_user(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $other = $this->createUserWithRole(RoleName::Customer);

        $this->postJsonAsUser('/api/v1/vendors/'.$vendor->vendorAccount->slug.'/reviews', $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 5,
        ])->assertOk();

        $this->getJsonAsUser('/api/v1/profile/reviews?status=published', $other)
            ->assertOk()
            ->assertJsonPath('data.summary.published_count', 0);
    }

    public function test_review_history_requires_authentication(): void
    {
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/v1/profile/reviews')->assertUnauthorized();
    }

    public function test_type_filter_limits_results(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $product = Product::query()->findOrFail($vendorOrder->items()->first()->product_id);

        $this->postJsonAsUser('/api/v1/vendors/'.$vendor->vendorAccount->slug.'/reviews', $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 5,
        ])->assertOk();

        $this->postJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer, [
            'rating' => 4,
        ])->assertOk();

        $this->getJsonAsUser('/api/v1/profile/reviews?status=published&type=store', $customer)
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.type', 'store');

        $this->getJsonAsUser('/api/v1/profile/reviews?status=published&type=product', $customer)
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.type', 'product');

        $this->getJsonAsUser('/api/v1/profile/reviews?status=published&type=service', $customer)
            ->assertOk()
            ->assertJsonCount(0, 'data.items');
    }

    public function test_pending_store_review_excluded_after_submission(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();

        $this->getJsonAsUser('/api/v1/profile/reviews?status=pending&type=store', $customer)
            ->assertOk()
            ->assertJsonCount(1, 'data.items');

        $this->postJsonAsUser('/api/v1/vendors/'.$vendor->vendorAccount->slug.'/reviews', $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 5,
        ])->assertOk();

        $this->getJsonAsUser('/api/v1/profile/reviews?status=pending&type=store', $customer)
            ->assertOk()
            ->assertJsonCount(0, 'data.items');
    }

    /**
     * @return array{0: User, 1: User, 2: VendorOrder}
     */
    private function deliverSingleItemOrder(): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 150.00,
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

        $order = Order::query()->with(['vendorOrders.shipment'])->findOrFail($orderId);
        $this->payOrder($customer, $order);
        $vendorOrder = $order->vendorOrders->first();

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'CRH-'.$vendorOrder->id,
        ])->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendor)->assertOk();

        $vendorOrder->refresh();

        return [$customer, $vendor, $vendorOrder];
    }

    private function payOrder(User $customer, Order $order): void
    {
        $paymentInit = $this->postJsonAsUser("/api/v1/orders/{$order->id}/payment", $customer, [
            'idempotency_key' => (string) Str::uuid(),
        ])->assertOk();

        $this->postJsonAsUser("/api/v1/orders/{$order->id}/payment/simulate", $customer, [
            'attempt_id' => $paymentInit->json('data.attempt_id'),
            'outcome' => 'success',
        ])->assertOk();
    }
}
