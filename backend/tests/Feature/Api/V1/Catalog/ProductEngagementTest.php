<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\RoleName;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProductEngagementTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_user_can_like_product_once(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/products/'.$product->id.'/like')
            ->assertOk()
            ->assertJsonPath('data.liked', true)
            ->assertJsonPath('data.likes_count', 1);

        $this->actingAs($user)->postJson('/api/v1/products/'.$product->id.'/like')
            ->assertOk()
            ->assertJsonPath('data.liked', false)
            ->assertJsonPath('data.likes_count', 0);
    }

    public function test_user_can_save_product_to_wishlist(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/products/'.$product->id.'/wishlist')
            ->assertOk()
            ->assertJsonPath('data.saved', true);

        $this->actingAs($user)->postJson('/api/v1/products/'.$product->id.'/wishlist')
            ->assertOk()
            ->assertJsonPath('data.saved', false);
    }

    public function test_user_can_submit_and_list_reviews(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/products/'.$product->id.'/reviews', [
            'rating' => 5,
            'comment' => 'Excellent quality',
        ])->assertOk()
            ->assertJsonPath('data.review.rating', 5);

        $this->actingAs($user)->getJson('/api/v1/products/'.$product->id.'/reviews')
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.my_review.rating', 5);

        $this->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonPath('data.product.rating_avg', 5)
            ->assertJsonPath('data.product.reviews_count', 1)
            ->assertJsonPath('data.product.likes_count', 0);
    }

    public function test_user_can_update_and_delete_own_review(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/products/'.$product->id.'/reviews', [
            'rating' => 4,
            'comment' => 'Good product',
        ])->assertOk();

        $this->actingAs($user)->patchJson('/api/v1/products/'.$product->id.'/reviews', [
            'rating' => 5,
            'comment' => 'Updated review',
        ])->assertOk()
            ->assertJsonPath('data.review.rating', 5)
            ->assertJsonPath('data.review.comment', 'Updated review');

        $this->actingAs($user)->deleteJson('/api/v1/products/'.$product->id.'/reviews')
            ->assertOk();

        $this->actingAs($user)->getJson('/api/v1/products/'.$product->id.'/reviews')
            ->assertOk()
            ->assertJsonCount(0, 'data.items')
            ->assertJsonPath('data.my_review', null);
    }

    public function test_user_can_list_and_clear_own_wishlist(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $otherUser = $this->createUserWithRole(RoleName::Customer);
        $productA = Product::factory()->create();
        $productB = Product::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/products/'.$productA->id.'/wishlist')->assertOk();
        $this->actingAs($user)->postJson('/api/v1/products/'.$productB->id.'/wishlist')->assertOk();
        $this->actingAs($otherUser)->postJson('/api/v1/products/'.$productA->id.'/wishlist')->assertOk();

        $this->actingAs($user)->getJson('/api/v1/profile/wishlist')
            ->assertOk()
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.pagination.total', 2)
            ->assertJsonPath('data.items.0.user_saved', true);

        $this->actingAs($otherUser)->getJson('/api/v1/profile/wishlist')
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.pagination.total', 1);

        $this->actingAs($user)->deleteJson('/api/v1/profile/wishlist')
            ->assertOk()
            ->assertJsonPath('data.removed', 2);

        $this->actingAs($user)->getJson('/api/v1/profile/wishlist')
            ->assertOk()
            ->assertJsonCount(0, 'data.items')
            ->assertJsonPath('data.pagination.total', 0);
    }

    public function test_wishlist_requires_authentication(): void
    {
        $this->getJson('/api/v1/profile/wishlist')->assertUnauthorized();
        $this->deleteJson('/api/v1/profile/wishlist')->assertUnauthorized();
    }
}
