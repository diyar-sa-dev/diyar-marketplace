<?php

namespace Tests\Concerns;

use App\Enums\RoleName;
use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorShippingSettings;
use App\Services\Cart\CartService;
use Illuminate\Support\Str;

trait InteractsWithCheckout
{
    protected function createCustomerAddress(User $user, array $overrides = []): Address
    {
        return Address::factory()->create(array_merge([
            'user_id' => $user->id,
            'is_default' => true,
        ], $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function createVendorShippingSettings(VendorAccount $vendorAccount, array $overrides = []): VendorShippingSettings
    {
        return VendorShippingSettings::query()->create(array_merge([
            'vendor_account_id' => $vendorAccount->id,
            'carrier_enabled' => true,
            'carrier_flat_rate' => '28.00',
            'carrier_free_shipping_enabled' => false,
            'carrier_free_shipping_threshold' => null,
            'pickup_enabled' => true,
            'pickup_location_label' => 'Main Branch (Riyadh)',
        ], $overrides));
    }

    protected function addProductToUserCart(User $user, Product $product, int $quantity = 1): void
    {
        $cartService = app(CartService::class);
        $cart = $cartService->resolveForUser($user);
        $cartService->addItem($cart, $product->id, $quantity);
    }

    /**
     * @return array<string, mixed>
     */
    protected function checkoutPayload(Address $address, Product $product, string $method = 'carrier'): array
    {
        $product->loadMissing('vendorAccount');

        return [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [
                [
                    'vendor_account_id' => $product->vendor_account_id,
                    'method' => $method,
                ],
            ],
        ];
    }

    /**
     * @return array{0: User, 1: Order}
     */
    protected function createPayableOrderForVendor(User $vendorUser): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $vendorAccount = $vendorUser->vendorAccount;
        $this->createVendorShippingSettings($vendorAccount);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendorAccount->id,
            'sale_price' => '100.00',
        ]);

        $this->addProductToUserCart($customer, $product, 1);

        $response = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $order = Order::query()
            ->with('payment', 'vendorOrders')
            ->findOrFail($response->json('data.order.id'));

        return [$customer, $order];
    }

    protected function putStatefulJsonAsUser(string $uri, User $user, array $data = [])
    {
        $this->beginStatefulSession();

        $response = $this->actingAs($user)
            ->withHeaders($this->statefulJsonHeaders())
            ->putJson($uri, $data);
        $this->persistResponseCookies($response);

        return $response;
    }

    protected function postStatefulJsonAsUserWithHeaders(string $uri, User $user, array $data = [], array $headers = [])
    {
        $this->beginStatefulSession();

        $response = $this->actingAs($user)
            ->withHeaders(array_merge($this->statefulJsonHeaders(), $headers))
            ->postJson($uri, $data);
        $this->persistResponseCookies($response);

        return $response;
    }
}
