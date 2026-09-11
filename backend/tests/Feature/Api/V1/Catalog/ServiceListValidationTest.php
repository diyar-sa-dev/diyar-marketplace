<?php

namespace Tests\Feature\Api\V1\Catalog;

use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ServiceListValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->seed(ServiceMarketplaceSeeder::class);
    }

    #[Test]
    public function services_reject_invalid_sort_values(): void
    {
        $this->getJson('/api/v1/services?sort=;drop table services')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort']);
    }

    #[Test]
    public function services_reject_invalid_pricing_mode(): void
    {
        $this->getJson('/api/v1/services?pricing_mode=invalid-mode')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['pricing_mode']);
    }

    #[Test]
    public function services_allow_up_to_one_hundred_per_page(): void
    {
        $this->getJson('/api/v1/services?per_page=100')
            ->assertOk();
    }
}
