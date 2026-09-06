<?php

namespace Tests\Feature\Api\V1\Order;

use App\Enums\RoleName;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

/**
 * Stage 28.9 — order list query-count regression (N+1 audit).
 */
class OrderListQueryCountTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_customer_order_list_does_not_n_plus_one_vendor_orders(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $product = Product::factory()->create(['sale_price' => '100.00']);
        $this->createVendorShippingSettings($product->vendorAccount);

        for ($i = 0; $i < 3; $i++) {
            $this->addProductToUserCart($customer, $product, 1);
            $this->postJsonAsUser(
                '/api/v1/orders',
                $customer,
                $this->checkoutPayload($address, $product),
                ['Idempotency-Key' => (string) Str::uuid()],
            )->assertCreated();
        }

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->getJsonAsUser('/api/v1/orders', $customer)
            ->assertOk()
            ->assertJsonCount(3, 'data.orders');

        $vendorOrderSelects = collect(DB::getQueryLog())
            ->filter(function (array $entry): bool {
                $sql = strtolower($entry['query']);

                return str_contains($sql, 'vendor_orders') && str_starts_with(ltrim($sql), 'select');
            })
            ->count();

        DB::disableQueryLog();

        $this->assertLessThanOrEqual(
            4,
            $vendorOrderSelects,
            'Order list should eager-load vendor orders without per-order fallback queries.'
        );
    }
}
