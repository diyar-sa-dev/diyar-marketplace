<?php

namespace Tests\Feature\Api\V1\Checkout;

use App\Enums\RoleName;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\Cart\CartService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class SelfPurchaseTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
    }

    public function test_vendor_cannot_add_own_product_to_cart(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
        ]);

        $this->postJsonAsUser('/api/v1/cart/items', $vendor, [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertForbidden();
    }

    public function test_vendor_cannot_checkout_own_product(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $address = $this->createCustomerAddress($vendor);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
        ]);
        $this->createVendorShippingSettings($vendor->vendorAccount);

        $this->postJsonAsUser('/api/v1/cart/items', $vendor, [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertForbidden();

        $this->postJsonAsUser('/api/v1/orders', $vendor, [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [
                ['vendor_account_id' => $product->vendor_account_id, 'method' => 'carrier'],
            ],
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertStatus(422);
    }

    public function test_customer_can_purchase_vendor_product(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
        ]);
        $this->createVendorShippingSettings($vendor->vendorAccount);

        $this->postJsonAsUser('/api/v1/cart/items', $customer, [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertOk();

        $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) Str::uuid(),
        ])->assertCreated();
    }

    public function test_multi_vendor_cart_blocks_only_own_vendor_items(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        $ownProduct = Product::factory()->create([
            'vendor_account_id' => $vendorA->vendorAccount->id,
            'sale_price' => '80.00',
        ]);
        $otherProduct = Product::factory()->create([
            'vendor_account_id' => $vendorB->vendorAccount->id,
            'sale_price' => '90.00',
        ]);

        $this->createVendorShippingSettings($vendorA->vendorAccount);
        $this->createVendorShippingSettings($vendorB->vendorAccount);
        $address = $this->createCustomerAddress($vendorA);

        $this->postJsonAsUser('/api/v1/cart/items', $vendorA, [
            'product_id' => $otherProduct->id,
            'quantity' => 1,
        ])->assertOk();

        $this->postJsonAsUser('/api/v1/cart/items', $vendorA, [
            'product_id' => $ownProduct->id,
            'quantity' => 1,
        ])->assertForbidden();

        $cart = app(CartService::class)->resolveForUser($vendorA);
        CartItem::query()->create([
            'cart_id' => $cart->id,
            'product_id' => $ownProduct->id,
            'quantity' => 1,
            'unit_price_snapshot' => (string) $ownProduct->sale_price,
            'color_name' => '',
            'color_hex' => null,
        ]);

        $validation = $this->postJsonAsUser('/api/v1/cart/validate', $vendorA)->assertOk();
        $issues = collect($validation->json('data.validation.items'))
            ->flatMap(fn (array $item) => $item['issues'] ?? [])
            ->all();

        $this->assertContains('self_purchase', $issues);

        $this->postJsonAsUser('/api/v1/orders', $vendorA, [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [
                ['vendor_account_id' => $vendorA->vendorAccount->id, 'method' => 'carrier'],
                ['vendor_account_id' => $vendorB->vendorAccount->id, 'method' => 'carrier'],
            ],
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertForbidden();
    }

    public function test_cart_validation_marks_self_purchase_items_invalid(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
        ]);

        $cartService = app(CartService::class);
        $cart = $cartService->resolveForUser($vendor);

        try {
            $cartService->addItem($cart, $product->id, 1);
            $this->fail('Expected self-purchase to be blocked when adding to cart.');
        } catch (AccessDeniedHttpException) {
            $this->assertTrue(true);
        }
    }
}
