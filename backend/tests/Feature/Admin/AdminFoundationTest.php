<?php

namespace Tests\Feature\Admin;

use App\Enums\AdminPermission;
use App\Enums\RoleName;
use App\Services\Admin\AdminAuditService;
use App\Services\Admin\AdminPermissionService;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminFoundationTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_audit_log_redacts_sensitive_values(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $log = app(AdminAuditService::class)->record(
            actor: $admin,
            action: 'user.update',
            before: ['password' => 'secret', 'name' => 'Before'],
            after: ['password' => 'new-secret', 'name' => 'After'],
            reason: 'Support update',
        );

        $this->assertSame('[REDACTED]', $log->before['password']);
        $this->assertSame('[REDACTED]', $log->after['password']);
        $this->assertSame('Before', $log->before['name']);
        $this->assertSame($admin->id, $log->actor_id);
        $this->assertSame('user.update', $log->action);
    }

    public function test_admin_user_has_seeded_permissions(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $service = app(AdminPermissionService::class);

        $this->assertTrue($service->has($admin, AdminPermission::PanelAccess));
        $this->assertTrue($service->has($admin, AdminPermission::PayoutsApprove));
    }

    public function test_non_admin_user_has_no_permissions(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $service = app(AdminPermissionService::class);

        $this->assertFalse($service->has($vendor, AdminPermission::OrdersView));
        $this->assertFalse($service->canAccessPanel($vendor));
    }
}
