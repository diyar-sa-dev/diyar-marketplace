<?php

namespace Tests\Feature\Api\V1\Checkout;

use App\Enums\CartStatus;
use App\Enums\PaymentStatus;
use App\Enums\RoleName;
use App\Models\CartItem;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductInventory;
use App\Services\Cart\CartService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class OrderCreationTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_order_creation_reserves_inventory_and_converts_cart(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 200.00]);
        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product, 2);

        $payload = $this->checkoutPayload($address, $product);
        $key = (string) Str::uuid();

        $this->postStatefulJsonAsUserWithHeaders('/api/v1/orders', $customer, $payload, [
            'Idempotency-Key' => $key,
        ])->assertCreated()
            ->assertJsonPath('data.order.payment.status', PaymentStatus::Pending->value);

        $this->assertDatabaseHas('carts', [
            'user_id' => $customer->id,
            'status' => CartStatus::Converted->value,
        ]);
        $this->assertDatabaseHas('inventory_reservations', [
            'product_id' => $product->id,
            'user_id' => $customer->id,
            'quantity' => 2,
        ]);
        $product->inventory->refresh();
        $this->assertSame(2, $product->inventory->reserved_quantity);
    }

    public function test_idempotent_replay_returns_same_order_without_double_reserve(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);
        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);
        $payload = $this->checkoutPayload($address, $product);
        $key = (string) Str::uuid();

        $first = $this->postStatefulJsonAsUserWithHeaders('/api/v1/orders', $customer, $payload, [
            'Idempotency-Key' => $key,
        ])->assertCreated();

        $orderId = $first->json('data.order.id');

        $this->postStatefulJsonAsUserWithHeaders('/api/v1/orders', $customer, $payload, [
            'Idempotency-Key' => $key,
        ])->assertOk()
            ->assertJsonPath('data.order.id', $orderId);

        $this->assertSame(1, Order::query()->where('user_id', $customer->id)->count());
        $this->assertSame(1, InventoryReservation::query()
            ->where('product_id', $product->id)
            ->where('user_id', $customer->id)
            ->count());
    }

    public function test_order_creation_rolls_back_when_insufficient_stock(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);
        ProductInventory::query()->where('product_id', $product->id)->update([
            'stock_quantity' => 1,
            'available_quantity' => 1,
            'reserved_quantity' => 0,
        ]);
        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($customer);

        $cartService = app(CartService::class);
        $cart = $cartService->resolveForUser($customer);
        CartItem::query()->create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 3,
            'unit_price_snapshot' => '100.00',
            'color_name' => '',
        ]);

        $this->postStatefulJsonAsUserWithHeaders('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) Str::uuid(),
        ])->assertUnprocessable();

        $this->assertDatabaseHas('carts', [
            'user_id' => $customer->id,
            'status' => CartStatus::Active->value,
        ]);
        $this->assertSame(0, Order::query()->count());
    }
}
