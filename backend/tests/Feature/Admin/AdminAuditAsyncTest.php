<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleName;
use App\Jobs\Admin\RecordAdminAuditLogJob;
use App\Models\AdminAuditLog;
use App\Models\User;
use App\Services\Admin\AdminAuditService;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminAuditAsyncTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_audit_record_dispatches_background_job(): void
    {
        Queue::fake();

        $admin = $this->createUserWithRole(RoleName::Admin);

        app(AdminAuditService::class)->record(
            actor: $admin,
            action: 'settings.updated',
            before: ['value' => 'old'],
            after: ['value' => 'new'],
        );

        Queue::assertPushed(RecordAdminAuditLogJob::class, function (RecordAdminAuditLogJob $job) use ($admin): bool {
            return $job->payload['actor_id'] === $admin->id
                && $job->payload['action'] === 'settings.updated';
        });

        $this->assertDatabaseCount('admin_audit_logs', 0);
    }

    public function test_audit_log_filter_by_action(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        AdminAuditLog::query()->create([
            'id' => (string) str()->uuid(),
            'actor_id' => $admin->id,
            'actor_role' => RoleName::Admin->value,
            'action' => 'category.create',
            'resource_type' => null,
            'resource_id' => null,
            'created_at' => now(),
        ]);

        AdminAuditLog::query()->create([
            'id' => (string) str()->uuid(),
            'actor_id' => $admin->id,
            'actor_role' => RoleName::Admin->value,
            'action' => 'user.suspend',
            'resource_type' => User::class,
            'resource_id' => $admin->id,
            'created_at' => now(),
        ]);

        $this->actingAs($admin, 'admin')
            ->getJson('/api/v1/admin/audit-logs?action=category.create')
            ->assertOk()
            ->assertJsonCount(1, 'data.audit_logs')
            ->assertJsonPath('data.audit_logs.0.action', 'category.create');
    }
}
