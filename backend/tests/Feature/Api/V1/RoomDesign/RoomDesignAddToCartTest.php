<?php

namespace Tests\Feature\Api\V1\RoomDesign;

use App\Enums\AvailabilityMode;
use App\Enums\RoleName;
use App\Models\Product;
use App\Models\RoomDesign;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class RoomDesignAddToCartTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['diyar.feature.room_designer_enabled' => true]);
    }

    public function test_owner_can_add_design_products_to_cart(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $design = $this->createDesignForUser($user, [
            'document' => $this->sampleDocument([
                'items' => [
                    $this->sampleItem(['product_id' => $product->id]),
                ],
            ]),
        ]);

        $this->actingAs($user)->postJson("/api/v1/room-designs/{$design->id}/add-to-cart")
            ->assertOk()
            ->assertJsonPath('data.cart.item_count', 1)
            ->assertJsonPath('data.cart.items.0.product.id', $product->id)
            ->assertJsonPath('data.skipped', []);
    }

    public function test_duplicate_room_instances_aggregate_cart_quantity(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $items = [
            $this->sampleItem(['id' => (string) Str::uuid(), 'product_id' => $product->id]),
            $this->sampleItem(['id' => (string) Str::uuid(), 'product_id' => $product->id]),
            $this->sampleItem(['id' => (string) Str::uuid(), 'product_id' => $product->id]),
        ];

        $design = $this->createDesignForUser($user, [
            'document' => $this->sampleDocument(['items' => $items]),
        ]);

        $this->actingAs($user)->postJson("/api/v1/room-designs/{$design->id}/add-to-cart")
            ->assertOk()
            ->assertJsonPath('data.cart.items.0.quantity', 3)
            ->assertJsonCount(1, 'data.cart.items');
    }

    public function test_non_owner_cannot_add_design_to_cart(): void
    {
        $owner = $this->createUserWithRole(RoleName::Customer);
        $intruder = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($owner);

        $this->actingAs($intruder)->postJson("/api/v1/room-designs/{$design->id}/add-to-cart")
            ->assertNotFound();
    }

    public function test_empty_design_returns_validation_error(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($user);

        $this->actingAs($user)->postJson("/api/v1/room-designs/{$design->id}/add-to-cart")
            ->assertUnprocessable()
            ->assertJsonPath('code', 'validation_failed');
    }

    public function test_missing_product_is_skipped(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $missingId = (string) Str::uuid();
        $design = $this->createDesignForUser($user, [
            'document' => $this->sampleDocument([
                'items' => [$this->sampleItem(['product_id' => $missingId])],
            ]),
        ]);

        $this->actingAs($user)->postJson("/api/v1/room-designs/{$design->id}/add-to-cart")
            ->assertOk()
            ->assertJsonPath('data.skipped.0.product_id', $missingId)
            ->assertJsonPath('data.skipped.0.reason', 'not_found')
            ->assertJsonPath('data.cart.item_count', 0);
    }

    public function test_out_of_stock_product_is_skipped(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['availability_mode' => AvailabilityMode::OutOfStock]);

        $design = $this->createDesignForUser($user, [
            'document' => $this->sampleDocument([
                'items' => [$this->sampleItem(['product_id' => $product->id])],
            ]),
        ]);

        $this->actingAs($user)->postJson("/api/v1/room-designs/{$design->id}/add-to-cart")
            ->assertOk()
            ->assertJsonPath('data.skipped.0.reason', 'out_of_stock');
    }

    public function test_item_ids_filter_limits_added_products(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $productA = Product::factory()->create();
        $productB = Product::factory()->create();

        $itemA = $this->sampleItem(['product_id' => $productA->id]);
        $itemB = $this->sampleItem(['product_id' => $productB->id]);

        $design = $this->createDesignForUser($user, [
            'document' => $this->sampleDocument(['items' => [$itemA, $itemB]]),
        ]);

        $this->actingAs($user)->postJson("/api/v1/room-designs/{$design->id}/add-to-cart", [
            'item_ids' => [$itemA['id']],
        ])->assertOk()->assertJsonPath('data.cart.item_count', 1);
    }

    public function test_product_lookup_query_count_is_bounded(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $items = [];
        for ($i = 0; $i < 5; $i++) {
            $product = Product::factory()->create();
            $items[] = $this->sampleItem(['product_id' => $product->id, 'id' => (string) Str::uuid()]);
        }

        $design = $this->createDesignForUser($user, [
            'document' => $this->sampleDocument(['items' => $items]),
        ]);

        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->actingAs($user)->postJson("/api/v1/room-designs/{$design->id}/add-to-cart")->assertOk();
        $log = DB::getQueryLog();
        DB::disableQueryLog();

        $productSelects = collect($log)->filter(
            static fn (array $row): bool => str_contains(strtolower($row['query']), 'from "products"')
                || str_contains(strtolower($row['query']), 'from products'),
        )->count();

        $this->assertLessThanOrEqual(
            15,
            $productSelects,
            'Product SELECT count should scale with unique products (5), not room item instances',
        );
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createDesignForUser(User $user, array $overrides = []): RoomDesign
    {
        $document = $overrides['document'] ?? $this->sampleDocument();
        unset($overrides['document']);

        $design = new RoomDesign;
        $design->forceFill(array_merge([
            'user_id' => $user->id,
            'title' => null,
            'document' => $document,
            'schema_version' => 1,
            'version' => 1,
            'item_count' => count($document['items'] ?? []),
        ], $overrides))->save();

        return $design->fresh();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function sampleDocument(array $overrides = []): array
    {
        $base = [
            'schema_version' => 1,
            'room' => [
                'width_m' => 4.5,
                'depth_m' => 4.0,
                'origin' => 'corner',
            ],
            'items' => [],
        ];

        return array_replace_recursive($base, $overrides);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function sampleItem(array $overrides = []): array
    {
        $base = [
            'id' => (string) Str::uuid(),
            'product_id' => '550e8400-e29b-41d4-a716-446655440042',
            'position_m' => ['x' => 1.0, 'z' => 1.0],
            'rotation_deg' => 0,
            'locked' => false,
            'layer' => 0,
            'snapshot' => [
                'name' => 'Sofa',
                'width_m' => 1.2,
                'depth_m' => 0.8,
            ],
        ];

        return array_replace($base, $overrides);
    }
}
