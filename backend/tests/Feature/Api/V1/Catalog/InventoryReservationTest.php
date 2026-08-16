<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\AvailabilityMode;
use App\Enums\InventoryMovementType;
use App\Enums\ReservationStatus;
use App\Enums\RoleName;
use App\Models\InventoryReservation;
use App\Models\Product;
use App\Models\User;
use App\Services\Catalog\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class InventoryReservationTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    private InventoryService $inventory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inventory = app(InventoryService::class);
    }

    public function test_reserve_succeeds_when_stock_available(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $reservation = $this->inventory->reserve($product, $customer, 2);

        $this->assertSame(ReservationStatus::Pending, $reservation->status);
        $this->assertTrue($reservation->affects_inventory);
        $product->inventory->refresh();
        $this->assertSame(2, $product->inventory->reserved_quantity);
        $this->assertSame(8, $product->inventory->available_quantity);
        $product->inventory->assertInvariants();
    }

    public function test_reserve_fails_when_insufficient_available_stock(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->expectException(InvalidArgumentException::class);
        $this->inventory->reserve($product, $customer, 11);
    }

    public function test_finalize_consumes_stock_and_clears_reservation(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $reservation = $this->inventory->reserve($product, $customer, 3);

        $this->inventory->finalize($reservation);

        $product->inventory->refresh();
        $this->assertSame(ReservationStatus::Finalized, $reservation->fresh()->status);
        $this->assertSame(7, $product->inventory->stock_quantity);
        $this->assertSame(0, $product->inventory->reserved_quantity);
        $this->assertSame(7, $product->inventory->available_quantity);
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => InventoryMovementType::Sale->value,
            'quantity' => -3,
        ]);
    }

    public function test_release_restores_availability(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $reservation = $this->inventory->reserve($product, $customer, 4);

        $this->inventory->release($reservation);

        $product->inventory->refresh();
        $this->assertSame(ReservationStatus::Released, $reservation->fresh()->status);
        $this->assertSame(0, $product->inventory->reserved_quantity);
        $this->assertSame(10, $product->inventory->available_quantity);
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => InventoryMovementType::Release->value,
        ]);
    }

    public function test_expired_reservation_can_be_released_by_command(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $reservation = $this->inventory->reserve($product, $customer, 2);
        $reservation->update(['expires_at' => now()->subMinute()]);

        $released = $this->inventory->releaseExpiredReservations();

        $this->assertSame(1, $released);
        $this->assertSame(ReservationStatus::Expired, $reservation->fresh()->status);
        $this->assertSame(0, $product->inventory->fresh()->reserved_quantity);
    }

    public function test_double_release_is_prevented(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $reservation = $this->inventory->reserve($product, $customer, 1);

        $this->inventory->release($reservation);

        $this->expectException(InvalidArgumentException::class);
        $this->inventory->release($reservation->fresh());
    }

    public function test_double_finalize_is_prevented(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $reservation = $this->inventory->reserve($product, $customer, 1);

        $this->inventory->finalize($reservation);

        $this->expectException(InvalidArgumentException::class);
        $this->inventory->finalize($reservation->fresh());
    }

    public function test_competing_reservations_cannot_over_allocate_stock(): void
    {
        $first = $this->createUserWithRole(RoleName::Customer);
        $second = User::factory()->create();
        $product = Product::factory()->create();

        $this->inventory->reserve($product, $first, 7);
        $this->inventory->reserve($product, $second, 3);

        $this->expectException(InvalidArgumentException::class);
        $this->inventory->reserve($product, $first, 1);

        $product->inventory->refresh();
        $this->assertSame(10, $product->inventory->reserved_quantity);
        $product->inventory->assertInvariants();
    }

    public function test_out_of_stock_product_cannot_be_reserved(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->outOfStock()->create();

        $this->expectException(InvalidArgumentException::class);
        $this->inventory->reserve($product, $customer, 1);
    }

    public function test_preorder_allows_reservation_without_inventory_lock(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create([
            'availability_mode' => AvailabilityMode::Preorder,
        ]);
        $product->inventory->update([
            'stock_quantity' => 0,
            'reserved_quantity' => 0,
            'available_quantity' => 0,
        ]);

        $reservation = $this->inventory->reserve($product, $customer, 1);

        $this->assertFalse($reservation->affects_inventory);
        $this->assertSame(0, $product->inventory->fresh()->reserved_quantity);
    }

    public function test_reservation_timeout_is_configurable(): void
    {
        config(['diyar.inventory.reservation_timeout_minutes' => 30]);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $before = now();
        $reservation = $this->inventory->reserve($product, $customer, 1);

        $this->assertTrue($reservation->expires_at->greaterThan($before->addMinutes(29)));
        $this->assertTrue($reservation->expires_at->lessThanOrEqualTo($before->addMinutes(31)));
    }

    public function test_reservation_records_movement_when_inventory_is_affected(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $reservation = $this->inventory->reserve($product, $customer, 2);

        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => InventoryMovementType::Reservation->value,
            'reference_type' => (new InventoryReservation)->getMorphClass(),
            'reference_id' => $reservation->id,
        ]);
    }
}
