<?php

namespace Tests\Feature\Admin;

use App\Enums\AdminPermission;
use App\Enums\RoleName;
use App\Models\Permission;
use App\Models\Role;
use App\Services\Admin\AdminPermissionService;
use App\Services\Admin\AdminRolePermissionService;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminSecurityHardeningTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_admin_without_settings_update_cannot_edit_system_settings(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $adminRole = Role::query()->where('name', RoleName::Admin)->firstOrFail();

        $keys = Permission::query()
            ->where('key', '!=', AdminPermission::SettingsUpdate->value)
            ->pluck('key')
            ->all();

        app(AdminRolePermissionService::class)->syncPermissions($adminRole, $keys, $admin);
        app(AdminPermissionService::class)->forget($admin);

        $this->assertFalse(
            app(AdminPermissionService::class)->has($admin->fresh(), AdminPermission::SettingsUpdate),
        );
    }

    public function test_admin_without_payouts_approve_permission_is_denied(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $adminRole = Role::query()->where('name', RoleName::Admin)->firstOrFail();

        $keys = Permission::query()
            ->whereNotIn('key', [
                AdminPermission::PayoutsApprove->value,
                AdminPermission::PayoutsProcess->value,
            ])
            ->pluck('key')
            ->all();

        app(AdminRolePermissionService::class)->syncPermissions($adminRole, $keys, $admin);
        app(AdminPermissionService::class)->forget($admin);

        $this->assertFalse(
            app(AdminPermissionService::class)->has($admin->fresh(), AdminPermission::PayoutsApprove),
        );
    }

    public function test_random_admin_resource_id_returns_not_found_or_forbidden_for_vendor(): void
    {
        Sanctum::actingAs($this->createUserWithRole(RoleName::Vendor));

        $this->getJson('/api/v1/admin/categories')
            ->assertUnauthorized();
    }

    public function test_admin_without_users_view_permission_gets_forbidden_on_users_index(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $adminRole = Role::query()->where('name', RoleName::Admin)->firstOrFail();

        $keys = Permission::query()
            ->where('key', '!=', AdminPermission::UsersView->value)
            ->pluck('key')
            ->all();

        app(AdminRolePermissionService::class)->syncPermissions($adminRole, $keys, $admin);
        app(AdminPermissionService::class)->forget($admin);

        $this->actingAs($admin, 'admin')
            ->getJson('/api/v1/admin/users')
            ->assertForbidden();
    }

    public function test_admin_with_users_view_permission_can_list_users(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $this->actingAs($admin, 'admin')
            ->getJson('/api/v1/admin/users')
            ->assertOk();
    }

    public function test_platform_theme_endpoint_exposes_only_theme_key(): void
    {
        $response = $this->getJson('/api/v1/platform/theme');

        $response->assertOk();
        $payload = $response->json('data');

        $this->assertArrayHasKey('theme', $payload);
        $this->assertArrayNotHasKey('affiliate', $payload);
        $this->assertArrayNotHasKey('database', $payload);
    }
}
