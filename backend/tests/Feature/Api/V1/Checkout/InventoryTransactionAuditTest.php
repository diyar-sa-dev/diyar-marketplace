<?php

namespace Tests\Feature\Api\V1\Checkout;

use App\Enums\RoleName;
use App\Models\InventoryReservation;
use App\Models\Product;
use App\Services\Catalog\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class InventoryTransactionAuditTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_reserve_rolls_back_when_outer_transaction_fails(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $inventoryService = app(InventoryService::class);

        try {
            DB::transaction(function () use ($inventoryService, $product, $customer) {
                $inventoryService->reserve($product, $customer, 2);
                throw new \RuntimeException('force rollback');
            });
        } catch (\RuntimeException) {
        }

        $product->inventory->refresh();
        $this->assertSame(0, $product->inventory->reserved_quantity);
        $this->assertSame(10, $product->inventory->available_quantity);
        $this->assertSame(0, InventoryReservation::query()->count());
    }
}
