<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\CategoryType;
use App\Models\Category;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceCategorySeederTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, string> */
    private const SERVICE_SLUGS = [
        'interior-design' => 'تصميم داخلي',
        'maintenance' => 'تركيب وصيانة',
        'painting' => 'دهانات',
        'upholstery' => 'تنجيد وتجديد',
        'carpentry' => 'نجارة مخصصة',
        'consultation' => 'استشارات تصميم',
        'moving' => 'نقل وتغليف',
        'cleaning' => 'تنظيف وتلميع',
        'electrical' => 'إضاءة وكهربا',
        'curtains-install' => 'تركيب الستائر',
    ];

    public function test_category_seeder_creates_service_categories(): void
    {
        $this->seed(CategorySeeder::class);

        foreach (self::SERVICE_SLUGS as $slug => $name) {
            $this->assertDatabaseHas('categories', [
                'slug' => $slug,
                'name' => $name,
                'type' => CategoryType::Service->value,
                'is_active' => true,
            ]);
        }
    }

    public function test_service_categories_are_returned_by_public_api(): void
    {
        $this->seed(CategorySeeder::class);

        $response = $this->getJson('/api/v1/categories/interior-design');

        $response->assertOk()
            ->assertJsonPath('data.category.slug', 'interior-design')
            ->assertJsonPath('data.category.type', CategoryType::Service->value);
    }

    public function test_category_seeder_is_idempotent(): void
    {
        $this->seed(CategorySeeder::class);
        $this->seed(CategorySeeder::class);

        foreach (self::SERVICE_SLUGS as $slug => $name) {
            $this->assertSame(
                1,
                Category::query()->where('slug', $slug)->count(),
                "Duplicate category seeded for slug: {$slug}",
            );
        }

        $this->assertSame(10, Category::query()->where('type', CategoryType::Service)->count());
        $this->assertSame(10, Category::query()->where('type', CategoryType::Product)->count());
    }
}
