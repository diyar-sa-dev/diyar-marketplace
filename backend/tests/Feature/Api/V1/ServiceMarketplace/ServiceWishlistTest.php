<?php

namespace Tests\Feature\Api\V1\ServiceMarketplace;

use App\Enums\RoleName;
use App\Models\Service;
use App\Models\ServiceWishlistItem;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ServiceWishlistTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->seed(ServiceMarketplaceSeeder::class);
    }

    #[Test]
    public function user_can_save_and_unsave_service_to_wishlist(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/services/{$service->slug}/wishlist")
            ->assertOk()
            ->assertJsonPath('data.saved', true);

        $this->assertDatabaseHas('service_wishlist_items', [
            'user_id' => $user->id,
            'service_id' => $service->id,
        ]);

        $this->postJson("/api/v1/services/{$service->slug}/wishlist")
            ->assertOk()
            ->assertJsonPath('data.saved', false);

        $this->assertDatabaseMissing('service_wishlist_items', [
            'user_id' => $user->id,
            'service_id' => $service->id,
        ]);
    }

    #[Test]
    public function user_can_list_saved_services_in_wishlist(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $otherUser = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        ServiceWishlistItem::query()->create([
            'user_id' => $user->id,
            'service_id' => $service->id,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/profile/wishlist?kind=services')
            ->assertOk()
            ->assertJsonPath('data.kind', 'services')
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.slug', $service->slug);

        $this->getJson('/api/v1/profile/wishlist/summary')
            ->assertOk()
            ->assertJsonPath('data.services', 1);

        Sanctum::actingAs($otherUser);

        $this->getJson('/api/v1/profile/wishlist?kind=services')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 0);
    }

    #[Test]
    public function service_wishlist_requires_authentication(): void
    {
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        $this->postJson("/api/v1/services/{$service->slug}/wishlist")->assertUnauthorized();
        $this->getJson('/api/v1/profile/wishlist?kind=services')->assertUnauthorized();
    }

    #[Test]
    public function duplicate_wishlist_rows_are_prevented_at_database_level(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        ServiceWishlistItem::query()->create([
            'user_id' => $user->id,
            'service_id' => $service->id,
        ]);

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/services/{$service->slug}/wishlist")
            ->assertOk()
            ->assertJsonPath('data.saved', false);

        $this->assertSame(
            0,
            ServiceWishlistItem::query()
                ->where('user_id', $user->id)
                ->where('service_id', $service->id)
                ->count(),
        );
    }

    #[Test]
    public function user_can_clear_service_and_product_wishlists_together(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/services/{$service->slug}/wishlist")->assertOk();

        $this->deleteJson('/api/v1/profile/wishlist')
            ->assertOk()
            ->assertJsonPath('data.removed', 1);

        $this->assertDatabaseMissing('service_wishlist_items', [
            'user_id' => $user->id,
            'service_id' => $service->id,
        ]);

        $this->getJson('/api/v1/profile/wishlist/summary')
            ->assertOk()
            ->assertJsonPath('data.services', 0);
    }

    #[Test]
    public function service_catalog_includes_user_saved_without_per_card_queries(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        ServiceWishlistItem::query()->create([
            'user_id' => $user->id,
            'service_id' => $service->id,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/services?per_page=20')
            ->assertOk()
            ->assertJsonPath('data.items.0.user_saved', fn ($value) => is_bool($value));

        $savedItem = collect($this->getJson('/api/v1/services?per_page=20')->json('data.items'))
            ->firstWhere('slug', $service->slug);

        $this->assertTrue($savedItem['user_saved'] ?? false);
    }

    #[Test]
    public function inactive_service_cannot_be_saved_to_wishlist(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();
        $service->update(['is_active' => false]);

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/services/{$service->slug}/wishlist")->assertNotFound();
    }

    #[Test]
    public function wishlist_toggle_is_rate_limited(): void
    {
        config(['diyar.rate_limits.wishlist_toggle_per_minute' => 3]);

        $user = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($user);

        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->postJson("/api/v1/services/{$service->slug}/wishlist")->assertOk();
        }

        $this->postJson("/api/v1/services/{$service->slug}/wishlist")->assertTooManyRequests();
    }
}
