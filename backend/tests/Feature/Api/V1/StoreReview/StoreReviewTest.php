<?php

namespace Tests\Feature\Api\V1\StoreReview;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ReturnReason;
use App\Enums\RoleName;
use App\Enums\VendorOrderStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\StoreReview;
use App\Models\User;
use App\Models\VendorOrder;
use App\Models\VendorReturnPolicy;
use App\Models\VendorShippingSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class StoreReviewTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
    }

    public function test_customer_can_submit_store_review_after_delivery(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();

        $slug = $vendor->vendorAccount->slug;

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 5,
            'comment' => 'Excellent service and fast delivery.',
        ])->assertOk()
            ->assertJsonPath('data.review.rating', 5);

        $this->getJson("/api/v1/vendors/{$slug}/reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.summary.review_count', 1)
            ->assertJsonPath('data.summary.average_rating', 5);

        $this->getJson("/api/v1/vendors/{$slug}")
            ->assertOk()
            ->assertJsonPath('data.vendor.rating_avg', 5)
            ->assertJsonPath('data.vendor.reviews_count', 1);
    }

    public function test_customer_can_submit_rating_without_comment(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $slug = $vendor->vendorAccount->slug;

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 4,
        ])->assertOk()
            ->assertJsonPath('data.review.rating', 4)
            ->assertJsonPath('data.review.comment', null);
    }

    public function test_whitespace_only_comment_is_rejected(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $slug = $vendor->vendorAccount->slug;

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 5,
            'comment' => '   ',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['comment']);
    }

    public function test_invalid_rating_is_rejected(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $slug = $vendor->vendorAccount->slug;

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 6,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['rating']);
    }

    public function test_unauthorized_user_cannot_review(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $other = $this->createUserWithRole(RoleName::Customer);
        $slug = $vendor->vendorAccount->slug;

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $other, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 5,
        ])->assertUnprocessable()
            ->assertJsonPath('message', __('diyar.store_review.order_not_owned'));
    }

    public function test_cannot_review_before_delivery(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        [$customer, $order] = $this->createPayableOrderForVendor($vendor);
        $this->payOrder($customer, $order);
        $slug = $vendor->vendorAccount->slug;

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, [
            'order_id' => $order->id,
            'rating' => 5,
        ])->assertUnprocessable()
            ->assertJsonPath('message', __('diyar.store_review.not_eligible'));
    }

    public function test_cannot_review_store_not_in_order(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $otherVendor = $this->createUserWithRole(RoleName::Vendor);

        $this->postJsonAsUser("/api/v1/vendors/{$otherVendor->vendorAccount->slug}/reviews", $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 5,
        ])->assertUnprocessable()
            ->assertJsonPath('message', __('diyar.store_review.store_not_in_order'));
    }

    public function test_duplicate_review_is_rejected(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $slug = $vendor->vendorAccount->slug;
        $payload = [
            'order_id' => $vendorOrder->order_id,
            'rating' => 5,
        ];

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, $payload)->assertOk();

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, $payload)
            ->assertStatus(409)
            ->assertJsonPath('message', __('diyar.store_review.already_reviewed'));
    }

    public function test_order_eligibility_endpoint_returns_states(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $slug = $vendor->vendorAccount->slug;

        $this->getJsonAsUser("/api/v1/orders/{$vendorOrder->order_id}/store-review-eligibility", $customer)
            ->assertOk()
            ->assertJsonPath('data.items.0.status', 'eligible')
            ->assertJsonPath('data.items.0.vendor_slug', $slug);

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 5,
            'comment' => 'Great store',
        ])->assertOk();

        $this->getJsonAsUser("/api/v1/orders/{$vendorOrder->order_id}/store-review-eligibility", $customer)
            ->assertOk()
            ->assertJsonPath('data.items.0.status', 'already_reviewed')
            ->assertJsonPath('data.items.0.review.rating', 5);
    }

    public function test_multi_vendor_order_eligibility(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);
        $address = $this->createCustomerAddress($customer);

        $this->createVendorShippingSettings($vendorA->vendorAccount);
        $this->createVendorShippingSettings($vendorB->vendorAccount);

        $productA = Product::factory()->create(['vendor_account_id' => $vendorA->vendorAccount->id]);
        $productB = Product::factory()->create(['vendor_account_id' => $vendorB->vendorAccount->id]);

        $this->addProductToUserCart($customer, $productA, 1);
        $this->addProductToUserCart($customer, $productB, 1);

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [
                ['vendor_account_id' => $vendorA->vendorAccount->id, 'method' => 'carrier'],
                ['vendor_account_id' => $vendorB->vendorAccount->id, 'method' => 'carrier'],
            ],
        ], ['Idempotency-Key' => (string) Str::uuid()])->assertCreated()->json('data.order.id');

        $order = Order::query()->with('vendorOrders')->findOrFail($orderId);
        $this->payOrder($customer, $order);

        foreach ($order->vendorOrders as $vendorOrder) {
            $vendorUser = $vendorOrder->vendor_account_id === $vendorA->vendorAccount->id ? $vendorA : $vendorB;
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendorUser)->assertOk();
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendorUser)->assertOk();
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendorUser, [
                'tracking_number' => 'MV-'.$vendorOrder->id,
            ])->assertOk();
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendorUser)->assertOk();
        }

        $this->getJsonAsUser("/api/v1/orders/{$orderId}/store-review-eligibility", $customer)
            ->assertOk()
            ->assertJsonCount(2, 'data.items');

        $items = collect($this->getJsonAsUser("/api/v1/orders/{$orderId}/store-review-eligibility", $customer)->json('data.items'));
        $this->assertTrue($items->every(fn (array $item) => $item['status'] === 'eligible'));

        $this->postJsonAsUser('/api/v1/vendors/'.$vendorA->vendorAccount->slug.'/reviews', $customer, [
            'order_id' => $orderId,
            'rating' => 5,
        ])->assertOk();

        $this->postJsonAsUser('/api/v1/vendors/'.$vendorB->vendorAccount->slug.'/reviews', $customer, [
            'order_id' => $orderId,
            'rating' => 4,
        ])->assertOk();

        $this->assertSame(2, StoreReview::query()->where('order_id', $orderId)->count());
    }

    public function test_rating_summary_distribution_is_calculated_from_database(): void
    {
        [$customerA, $vendor, $vendorOrderA] = $this->deliverSingleItemOrder();
        $slug = $vendor->vendorAccount->slug;

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customerA, [
            'order_id' => $vendorOrderA->order_id,
            'rating' => 5,
        ])->assertOk();

        foreach ([5, 4] as $rating) {
            $customer = $this->createUserWithRole(RoleName::Customer);
            $order = $this->createDeliveredOrderForVendor($customer, $vendor);
            $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, [
                'order_id' => $order->id,
                'rating' => $rating,
            ])->assertOk();
        }

        $response = $this->getJson("/api/v1/vendors/{$slug}/reviews")->assertOk();
        $response->assertJsonPath('data.summary.review_count', 3);
        $response->assertJsonPath('data.summary.average_rating', 4.7);
        $response->assertJsonPath('data.summary.distribution.0.stars', 5);
        $response->assertJsonPath('data.summary.distribution.0.count', 2);
    }

    public function test_store_reviews_require_authentication_to_create(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->postJson('/api/v1/vendors/'.$vendor->vendorAccount->slug.'/reviews', [
            'order_id' => (string) Str::uuid(),
            'rating' => 5,
        ])->assertUnauthorized();
    }

    public function test_vendor_cannot_review_own_store(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $slug = $vendor->vendorAccount->slug;
        $order = $this->createDeliveredOwnStoreOrder($vendor);

        $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $vendor, [
            'order_id' => $order->id,
            'rating' => 5,
        ])->assertForbidden();
    }

    public function test_store_review_eligibility_marks_own_store_not_eligible(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $order = $this->createDeliveredOwnStoreOrder($vendor);

        $this->getJsonAsUser("/api/v1/orders/{$order->id}/store-review-eligibility", $vendor)
            ->assertOk()
            ->assertJsonPath('data.items.0.status', 'not_eligible');
    }

    public function test_owner_can_update_and_delete_store_review(): void
    {
        [$customer, $vendor, $vendorOrder] = $this->deliverSingleItemOrder();
        $slug = $vendor->vendorAccount->slug;

        $reviewId = $this->postJsonAsUser("/api/v1/vendors/{$slug}/reviews", $customer, [
            'order_id' => $vendorOrder->order_id,
            'rating' => 4,
            'comment' => 'Nice store',
        ])->assertOk()->json('data.review.id');

        $this->patchJsonAsUser("/api/v1/store-reviews/{$reviewId}", $customer, [
            'rating' => 5,
            'comment' => 'Updated store review',
        ])->assertOk()
            ->assertJsonPath('data.review.rating', 5);

        $other = $this->createUserWithRole(RoleName::Customer);
        $this->patchJsonAsUser("/api/v1/store-reviews/{$reviewId}", $other, [
            'rating' => 1,
        ])->assertForbidden();

        $this->deleteJsonAsUser("/api/v1/store-reviews/{$reviewId}", $customer)->assertOk();
        $this->assertDatabaseMissing('store_reviews', ['id' => $reviewId]);
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

        $order = Order::query()->with(['vendorOrders.shipment'])->findOrFail($orderId);
        $this->payOrder($customer, $order);
        $vendorOrder = $order->vendorOrders->first();

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'SR-'.$vendorOrder->id,
        ])->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendor)->assertOk();

        $vendorOrder->refresh();

        return [$customer, $vendor, $vendorOrder];
    }

    private function createDeliveredOrderForVendor(User $customer, User $vendor): Order
    {
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 120.00,
        ]);

        if (! VendorShippingSettings::query()->where('vendor_account_id', $vendor->vendorAccount->id)->exists()) {
            $this->createVendorShippingSettings($vendor->vendorAccount);
        }
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product, 1);

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) Str::uuid(),
        ])->assertCreated()->json('data.order.id');

        $order = Order::query()->with('vendorOrders')->findOrFail($orderId);
        $this->payOrder($customer, $order);
        $vendorOrder = $order->vendorOrders->first();

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'SR2-'.$vendorOrder->id,
        ])->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendor)->assertOk();

        return $order->fresh();
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

    private function createDeliveredOwnStoreOrder(User $vendor): Order
    {
        $address = $this->createCustomerAddress($vendor);

        $order = Order::query()->create([
            'user_id' => $vendor->id,
            'order_number' => 'OWN-'.Str::upper(Str::random(8)),
            'status' => OrderStatus::Pending,
            'shipping_address_id' => $address->id,
            'shipping_recipient_name' => $address->recipient_name,
            'shipping_phone' => $address->phone,
            'shipping_city' => $address->city,
            'shipping_district' => $address->district,
            'shipping_street' => $address->street,
            'shipping_building' => $address->building,
            'shipping_apartment' => $address->apartment,
            'subtotal' => '100.00',
            'shipping_total' => '0.00',
            'assembly_total' => '0.00',
            'discount_total' => '0.00',
            'vat_amount' => '0.00',
            'grand_total' => '100.00',
        ]);

        Payment::query()->create([
            'order_id' => $order->id,
            'status' => PaymentStatus::Paid,
            'amount' => '100.00',
            'currency' => 'SAR',
            'gateway' => 'test',
            'payment_method' => 'manual',
            'paid_at' => now(),
        ]);

        VendorOrder::query()->create([
            'order_id' => $order->id,
            'vendor_account_id' => $vendor->vendorAccount->id,
            'status' => VendorOrderStatus::Delivered,
            'subtotal' => '100.00',
            'shipping_method' => 'carrier',
            'shipping_cost' => '0.00',
            'assembly_cost' => '0.00',
            'discount_amount' => '0.00',
            'vat_amount' => '0.00',
            'vendor_total' => '100.00',
        ]);

        return $order->fresh(['payment', 'vendorOrders']);
    }
}
