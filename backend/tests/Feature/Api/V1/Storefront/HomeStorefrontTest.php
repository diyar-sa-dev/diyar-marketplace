<?php

namespace Tests\Feature\Api\V1\Storefront;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeStorefrontTest extends TestCase
{
    use RefreshDatabase;

    public function test_storefront_home_returns_cached_sections(): void
    {
        $response = $this->getJson('/api/v1/storefront/home');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'sections' => [
                        'product_categories' => ['categories'],
                        'service_categories' => ['categories'],
                        'most_interactive_products' => ['items', 'pagination'],
                        'featured_deals' => ['items', 'pagination', 'ends_at'],
                        'new_arrivals' => ['items', 'pagination'],
                        'best_sellers' => ['items', 'pagination'],
                        'suggested_for_you' => ['items', 'pagination'],
                        'featured_vendors' => ['items', 'pagination'],
                        'services_by_category',
                        'blog_articles' => ['items', 'pagination'],
                    ],
                ],
            ]);
    }
}
