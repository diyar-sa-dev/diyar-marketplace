<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Enums\RoleName;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminShippingConfigurationTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_admin_can_manage_carrier_zone_and_method_lifecycle(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $this->actingAsAdmin($admin);

        $carrierResponse = $this->postJson('/api/v1/admin/shipping/carriers', [
            'code' => 'enterprise-carrier',
            'name' => 'Enterprise Carrier',
            'is_active' => true,
        ])->assertCreated();

        $carrierId = $carrierResponse->json('data.carrier.id');

        $zoneResponse = $this->postJson('/api/v1/admin/shipping/zones', [
            'carrier_id' => $carrierId,
            'name' => 'Riyadh Metro',
            'city' => 'Riyadh',
            'priority' => 20,
            'is_active' => true,
        ])->assertCreated();

        $zoneId = $zoneResponse->json('data.zone.id');

        $this->patchJson("/api/v1/admin/shipping/zones/{$zoneId}", [
            'priority' => 30,
        ])->assertOk();

        $methodResponse = $this->postJson('/api/v1/admin/shipping/methods', [
            'carrier_id' => $carrierId,
            'code' => 'standard',
            'name' => 'Standard Delivery',
            'is_active' => true,
        ])->assertCreated();

        $methodId = $methodResponse->json('data.method.id');

        $ruleResponse = $this->postJson('/api/v1/admin/shipping/rate-rules', [
            'shipping_method_id' => $methodId,
            'zone_id' => $zoneId,
            'min_weight_kg' => 0,
            'max_weight_kg' => 10,
            'rate' => '55.00',
            'sort_order' => 1,
            'is_active' => true,
        ])->assertCreated();

        $ruleId = $ruleResponse->json('data.rate_rule.id');

        $this->getJson('/api/v1/admin/shipping/carriers')->assertOk();
        $this->getJson("/api/v1/admin/shipping/zones?carrier_id={$carrierId}")->assertOk();
        $this->getJson("/api/v1/admin/shipping/methods?carrier_id={$carrierId}")->assertOk();
        $this->getJson("/api/v1/admin/shipping/rate-rules?shipping_method_id={$methodId}")->assertOk();

        $this->deleteJson("/api/v1/admin/shipping/rate-rules/{$ruleId}")->assertOk();
        $this->deleteJson("/api/v1/admin/shipping/zones/{$zoneId}")->assertOk();
        $this->deleteJson("/api/v1/admin/shipping/carriers/{$carrierId}")->assertOk();
    }
}
