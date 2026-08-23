<?php

namespace Tests\Feature\Api\V1;

use App\Enums\SystemSettingGroup;
use App\Enums\SystemSettingType;
use App\Models\SystemSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketplaceMaintenanceMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_endpoint_returns_503_when_maintenance_enabled(): void
    {
        SystemSetting::query()->create([
            'group' => SystemSettingGroup::Platform->value,
            'key' => 'marketplace_maintenance_enabled',
            'type' => SystemSettingType::Boolean->value,
            'value' => ['v' => true],
            'is_public' => true,
        ]);

        $this->getJson('/api/v1/products')
            ->assertStatus(503)
            ->assertJsonPath('success', false);
    }

    public function test_health_endpoint_stays_available_during_maintenance(): void
    {
        SystemSetting::query()->create([
            'group' => SystemSettingGroup::Platform->value,
            'key' => 'marketplace_maintenance_enabled',
            'type' => SystemSettingType::Boolean->value,
            'value' => ['v' => true],
            'is_public' => true,
        ]);

        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('data.maintenance.marketplace_enabled', true);
    }

    public function test_admin_routes_stay_available_during_maintenance(): void
    {
        SystemSetting::query()->create([
            'group' => SystemSettingGroup::Platform->value,
            'key' => 'marketplace_maintenance_enabled',
            'type' => SystemSettingType::Boolean->value,
            'value' => ['v' => true],
            'is_public' => true,
        ]);

        $this->getJson('/api/v1/admin/session')
            ->assertUnauthorized();
    }
}
