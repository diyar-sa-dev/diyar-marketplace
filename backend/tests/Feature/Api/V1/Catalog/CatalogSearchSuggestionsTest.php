<?php

namespace Tests\Feature\Api\V1\Catalog;

use Database\Seeders\CatalogSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\PlatformDemoSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogSearchSuggestionsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(PlatformDemoSeeder::class);
        $this->seed(CategorySeeder::class);
        $this->seed(CatalogSeeder::class);
    }

    public function test_suggestions_require_minimum_query_length(): void
    {
        $response = $this->getJson('/api/v1/catalog/search/suggestions?q=a');

        $response
            ->assertOk()
            ->assertJsonPath('data.suggestions', []);
    }

    public function test_suggestions_return_matching_platform_data(): void
    {
        $response = $this->getJson('/api/v1/catalog/search/suggestions?q=كنب');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'query',
                    'suggestions' => [
                        '*' => ['id', 'type', 'label', 'slug', 'subtitle', 'href'],
                    ],
                ],
            ]);

        $this->assertNotEmpty($response->json('data.suggestions'));
    }
}
