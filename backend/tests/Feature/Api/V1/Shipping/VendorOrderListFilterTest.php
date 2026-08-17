<?php

namespace Tests\Feature\Api\V1\Shipping;

use App\Enums\PaymentStatus;
use App\Enums\RoleName;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class VendorOrderListFilterTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['diyar.manual_orders.api_enabled' => true]);
    }

    public function test_processing_tab_includes_accepted_orders(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $pendingId = $this->createManualOrder($vendor, 'pending')['id'];
        $acceptedId = $this->createManualOrder($vendor, 'accepted')['id'];
        $processingId = $this->createManualOrder($vendor, 'processing')['id'];

        $response = $this->getJsonAsUser('/api/v1/dashboard/vendor/orders?status=processing', $vendor)
            ->assertOk();

        $ids = collect($response->json('data.vendor_orders'))->pluck('id')->all();

        $this->assertContains($acceptedId, $ids);
        $this->assertContains($processingId, $ids);
        $this->assertNotContains($pendingId, $ids);
    }

    public function test_search_by_arabic_accepted_status_finds_accepted_orders(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $acceptedId = $this->createManualOrder($vendor, 'accepted')['id'];
        $this->createManualOrder($vendor, 'pending');

        $response = $this->getJsonAsUser('/api/v1/dashboard/vendor/orders?q='.urlencode('مقبول'), $vendor)
            ->assertOk();

        $ids = collect($response->json('data.vendor_orders'))->pluck('id')->all();

        $this->assertContains($acceptedId, $ids);
    }

    /**
     * @return array{id: string}
     */
    private function createManualOrder(User $vendor, string $status): array
    {
        $response = $this->postJsonAsUser('/api/v1/dashboard/vendor/orders', $vendor, [
            'customer_name' => 'Customer '.$status,
            'vendor_total' => '100.00',
            'items_count' => 1,
            'status' => $status,
            'payment_status' => PaymentStatus::Paid->value,
        ])->assertCreated();

        return [
            'id' => (string) $response->json('data.vendor_order.id'),
        ];
    }
}
