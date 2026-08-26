<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Enums\RoleName;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminOperationalHealthTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_admin_can_view_operational_health(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $this->getJsonAsAdmin('/api/v1/admin/system/health', $admin)
            ->assertOk()
            ->assertJsonPath('data.overall_status', fn ($value) => in_array($value, ['HEALTHY', 'DEGRADED', 'CRITICAL', 'UNKNOWN'], true))
            ->assertJsonStructure([
                'data' => [
                    'overall_status',
                    'platform' => ['status', 'checks'],
                    'operational' => [
                        'notifications',
                        'chat',
                        'outbox',
                        'queues',
                    ],
                    'timestamp',
                ],
            ]);
    }

    public function test_unauthenticated_health_center_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/system/health')->assertUnauthorized();
    }
}
