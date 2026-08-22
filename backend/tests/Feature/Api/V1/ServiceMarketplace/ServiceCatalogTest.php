<?php

namespace Tests\Feature\Api\V1\ServiceMarketplace;

use App\Enums\ProviderAccountStatus;
use App\Enums\RoleName;
use App\Models\ProviderAccount;
use App\Models\Service;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ServiceCatalogTest extends TestCase
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
    public function lists_active_service_categories(): void
    {
        $this->getJson('/api/v1/service-categories')
            ->assertOk()
            ->assertJsonCount(6, 'data.categories')
            ->assertJsonPath('data.categories.0.slug', 'interior-design');
    }

    #[Test]
    public function lists_paginated_active_services(): void
    {
        $this->getJson('/api/v1/services')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'items' => [
                        ['id', 'title', 'slug', 'pricing_label', 'provider'],
                    ],
                    'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
                ],
            ])
            ->assertJsonPath('data.pagination.total', 10);
    }

    #[Test]
    public function filters_services_by_category_slug(): void
    {
        $this->getJson('/api/v1/services?category=moving')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.title', 'نقل أثاث مع الفك والتركيب');
    }

    #[Test]
    public function searches_services_by_title_or_provider(): void
    {
        $this->getJson('/api/v1/services?q='.urlencode('إيوان'))
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 4);
    }

    #[Test]
    public function sorts_services_by_rating(): void
    {
        $response = $this->getJson('/api/v1/services?sort=rating&per_page=1')
            ->assertOk();

        $this->assertSame(5.0, (float) $response->json('data.items.0.rating_average'));
    }

    #[Test]
    public function inactive_services_are_hidden_from_catalog(): void
    {
        Service::query()->first()?->update(['is_active' => false]);

        $this->getJson('/api/v1/services')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 9);
    }

    #[Test]
    public function shows_service_detail_by_slug(): void
    {
        $this->getJson('/api/v1/services/integrated-apartment-design')
            ->assertOk()
            ->assertJsonPath('data.service.title', 'تصميم داخلي متكامل للشقق')
            ->assertJsonPath('data.service.provider.slug', 'eiwan-design')
            ->assertJsonPath('data.service.provider.contact_phone', fn ($phone) => filled($phone));
    }

    #[Test]
    public function shows_provider_profile_by_slug(): void
    {
        $this->getJson('/api/v1/providers/eiwan-design')
            ->assertOk()
            ->assertJsonPath('data.provider.display_name', 'إيوان للتصميم')
            ->assertJsonPath('data.provider.active_services_count', 4);
    }

    #[Test]
    public function customer_can_follow_provider(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        Sanctum::actingAs($customer);

        $this->postJson('/api/v1/providers/eiwan-design/follow')
            ->assertOk()
            ->assertJsonPath('data.follow.is_following', true);
    }

    #[Test]
    public function provider_cannot_follow_own_profile(): void
    {
        $providerUser = ProviderAccount::query()->where('slug', 'eiwan-design')->firstOrFail()->user;
        Sanctum::actingAs($providerUser);

        $this->postJson('/api/v1/providers/eiwan-design/follow')
            ->assertStatus(422);
    }

    #[Test]
    public function suspended_provider_is_not_public(): void
    {
        ProviderAccount::query()->where('slug', 'eiwan-design')->update([
            'status' => ProviderAccountStatus::Suspended,
        ]);

        $this->getJson('/api/v1/providers/eiwan-design')
            ->assertNotFound();
    }

    #[Test]
    public function lists_provider_services_with_sorting(): void
    {
        $this->getJson('/api/v1/providers/eiwan-design/services?sort=price_asc')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 4);
    }
}
