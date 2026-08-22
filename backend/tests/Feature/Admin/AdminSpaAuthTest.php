<?php

namespace Tests\Feature\Admin;

use App\Enums\AdminPermission;
use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Services\Admin\AdminPermissionService;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminSpaAuthTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_admin_only_can_login_via_admin_api(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin, [
            'email' => 'ops@diyar.test',
            'password' => bcrypt('password'),
        ]);

        $this->postStatefulJson('/api/v1/admin/auth/login', [
            'method' => 'email',
            'identifier' => $admin->email,
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('data.user.email', $admin->email);
    }

    public function test_admin_only_can_load_admin_session(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $this->actingAsAdmin($admin);

        $this->getJson('/api/v1/admin/session')
            ->assertOk()
            ->assertJsonPath('data.user.id', $admin->id)
            ->assertJsonStructure(['data' => ['permissions']]);
    }

    public function test_vendor_cannot_load_admin_session(): void
    {
        Sanctum::actingAs($this->createUserWithRole(RoleName::Vendor));

        $this->getJson('/api/v1/admin/session')->assertUnauthorized();
    }

    public function test_suspended_admin_cannot_load_admin_session(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin, [
            'status' => UserStatus::Suspended,
        ]);

        $this->actingAsAdmin($admin);

        $this->getJson('/api/v1/admin/session')->assertForbidden();
    }

    public function test_admin_role_has_granular_permissions_seeded(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $this->assertTrue(
            app(AdminPermissionService::class)
                ->has($admin, AdminPermission::OrdersView),
        );
    }
}
