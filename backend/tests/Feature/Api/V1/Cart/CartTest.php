<?php

namespace Tests\Feature\Api\V1\Cart;

use App\Enums\CartStatus;
use App\Enums\RoleName;
use App\Models\Product;
use App\Models\ProductInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class CartTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_guest_can_create_and_retrieve_cart(): void
    {
        $product = Product::factory()->create();

        $post = $this->postStatefulJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertOk()
            ->assertJsonPath('data.cart.item_count', 1);

        $this->getStatefulJson('/api/v1/cart')
            ->assertOk()
            ->assertJsonPath('data.cart.id', $post->json('data.cart.id'))
            ->assertJsonCount(1, 'data.cart.items');
    }

    public function test_guest_can_update_and_remove_items(): void
    {
        $product = Product::factory()->create();

        $add = $this->postStatefulJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertOk();

        $itemId = $add->json('data.cart.items.0.id');

        $this->patchStatefulJson('/api/v1/cart/items/'.$itemId, ['quantity' => 2])
            ->assertOk()
            ->assertJsonPath('data.cart.items.0.quantity', 2);

        $this->deleteStatefulJson('/api/v1/cart/items/'.$itemId)
            ->assertOk()
            ->assertJsonPath('data.cart.item_count', 0);
    }

    public function test_guest_can_clear_cart(): void
    {
        $product = Product::factory()->create();
        $this->postStatefulJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1]);

        $this->deleteStatefulJson('/api/v1/cart')
            ->assertOk()
            ->assertJsonPath('data.cart.item_count', 0);
    }

    public function test_duplicate_product_add_merges_quantity(): void
    {
        $product = Product::factory()->create();

        $this->postStatefulJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1]);
        $this->postStatefulJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 2])
            ->assertOk()
            ->assertJsonPath('data.cart.items.0.quantity', 3)
            ->assertJsonCount(1, 'data.cart.items');
    }

    public function test_same_product_with_different_colors_creates_separate_lines(): void
    {
        $product = Product::factory()->create();
        $product->colors()->create(['name' => 'أسود', 'hex_code' => '#000000']);

        $this->postStatefulJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
            'color_name' => 'أبيض',
            'color_hex' => '#FFFFFF',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
            'color_name' => 'أسود',
            'color_hex' => '#000000',
        ])
            ->assertOk()
            ->assertJsonCount(2, 'data.cart.items')
            ->assertJsonPath('data.cart.item_count', 2);
    }

    public function test_same_product_and_color_merges_quantity(): void
    {
        $product = Product::factory()->create();

        $this->postStatefulJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
            'color_name' => 'أبيض',
            'color_hex' => '#FFFFFF',
        ]);

        $this->postStatefulJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
            'color_name' => 'أبيض',
            'color_hex' => '#FFFFFF',
        ])
            ->assertOk()
            ->assertJsonCount(1, 'data.cart.items')
            ->assertJsonPath('data.cart.items.0.quantity', 3)
            ->assertJsonPath('data.cart.items.0.color.name', 'أبيض')
            ->assertJsonPath('data.cart.items.0.color.hex_code', '#FFFFFF');
    }

    public function test_authenticated_user_has_persistent_cart(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertOk();

        $this->actingAs($user)->getJson('/api/v1/cart')
            ->assertOk()
            ->assertJsonPath('data.cart.item_count', 1);

        $this->assertDatabaseHas('carts', [
            'user_id' => $user->id,
            'status' => CartStatus::Active->value,
        ]);
    }

    public function test_user_cannot_access_another_users_cart_item(): void
    {
        $userA = $this->createUserWithRole(RoleName::Customer);
        $userB = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $response = $this->actingAs($userA)->postJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $itemId = $response->json('data.cart.items.0.id');

        $this->actingAs($userB)->patchJson('/api/v1/cart/items/'.$itemId, ['quantity' => 5])
            ->assertNotFound();
    }

    public function test_merge_combines_guest_and_user_carts(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $productA = Product::factory()->create();
        $productB = Product::factory()->create();

        $this->postStatefulJson('/api/v1/cart/items', ['product_id' => $productA->id, 'quantity' => 2]);
        $this->postStatefulJson('/api/v1/cart/items', ['product_id' => $productB->id, 'quantity' => 1]);

        $this->postStatefulJsonAsUser('/api/v1/cart/items', $user, [
            'product_id' => $productA->id,
            'quantity' => 3,
        ]);

        $sessionId = session()->getId();

        $this->postStatefulJsonAsUser('/api/v1/cart/merge', $user)
            ->assertOk()
            ->assertJsonPath('data.cart.item_count', 6);

        $this->assertDatabaseHas('carts', [
            'session_id' => $sessionId,
            'status' => CartStatus::Merged->value,
        ]);
    }

    public function test_merge_is_idempotent_when_guest_cart_already_merged(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->postStatefulJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1]);

        $this->postStatefulJsonAsUser('/api/v1/cart/merge', $user)->assertOk();
        $this->postStatefulJsonAsUser('/api/v1/cart/merge', $user)
            ->assertOk()
            ->assertJsonPath('data.cart.item_count', 1);
    }

    public function test_validation_detects_price_change_and_stock_issues(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);

        $this->actingAs($user)->postJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 5,
        ])->assertOk();

        $product->update(['sale_price' => 120.00]);
        ProductInventory::query()->where('product_id', $product->id)->update([
            'stock_quantity' => 3,
            'available_quantity' => 3,
            'reserved_quantity' => 0,
        ]);

        $this->actingAs($user)->postJson('/api/v1/cart/validate')
            ->assertOk()
            ->assertJsonPath('data.validation.valid', false)
            ->assertJsonFragment(['price_changed'])
            ->assertJsonFragment(['insufficient_stock']);
    }

    public function test_inactive_product_cannot_be_added(): void
    {
        $product = Product::factory()->archived()->create();

        $this->postStatefulJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertNotFound();
    }

    public function test_add_rejects_quantity_exceeding_available_stock(): void
    {
        $product = Product::factory()->create();
        ProductInventory::query()->where('product_id', $product->id)->update([
            'stock_quantity' => 2,
            'available_quantity' => 2,
            'reserved_quantity' => 0,
        ]);

        $this->postStatefulJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 5,
        ])->assertStatus(400);
    }

    public function test_totals_return_subtotal_only(): void
    {
        $product = Product::factory()->create(['sale_price' => 50.00]);

        $response = $this->postStatefulJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ])->assertOk();

        $response->assertJsonPath('data.cart.totals.subtotal', '100.00');
        $response->assertJsonPath('data.cart.totals.tax', null);
        $response->assertJsonPath('data.cart.totals.total', null);
    }

    public function test_merge_requires_authentication(): void
    {
        $this->postJson('/api/v1/cart/merge')->assertUnauthorized();
    }

    public function test_merge_after_login_finds_guest_cart_despite_session_regeneration(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501222333',
            'password' => 'Password123!',
        ]);
        $product = Product::factory()->create();

        $this->postStatefulJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ])->assertOk();

        $guestSessionId = session()->getId();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501222333',
            'password' => 'Password123!',
        ])->assertOk();

        $this->assertNotSame($guestSessionId, session()->getId());

        $this->postStatefulJson('/api/v1/cart/merge')
            ->assertOk()
            ->assertJsonPath('data.cart.item_count', 2);

        $this->assertDatabaseHas('carts', [
            'session_id' => $guestSessionId,
            'status' => CartStatus::Merged->value,
        ]);
    }
}
