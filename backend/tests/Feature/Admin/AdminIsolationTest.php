<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Models\Role;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminIsolationTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_admin_only_cannot_login_via_marketplace_api(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin, [
            'email' => 'ops@diyar.test',
            'password' => bcrypt('password'),
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'email',
            'identifier' => $admin->email,
            'password' => 'password',
        ])->assertUnprocessable()
            ->assertJsonPath('errors.credentials.0', __('auth.failed'));
    }

    public function test_admin_only_cannot_access_marketplace_me_endpoint(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        Sanctum::actingAs($admin, ['*'], 'web');

        $this->getJson('/api/v1/auth/me')->assertForbidden();
    }

    public function test_admin_only_cannot_access_vendor_dashboard_api(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        Sanctum::actingAs($admin, ['*'], 'web');

        $this->getJson('/api/v1/dashboard/vendor/access')->assertForbidden();
    }

    public function test_admin_only_cannot_access_provider_dashboard_api(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        Sanctum::actingAs($admin, ['*'], 'web');

        $this->getJson('/api/v1/dashboard/provider/settings')->assertForbidden();
    }

    public function test_admin_only_cannot_access_affiliate_dashboard_api(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        Sanctum::actingAs($admin, ['*'], 'web');

        $this->getJson('/api/v1/dashboard/affiliate')->assertForbidden();
    }

    public function test_admin_only_cannot_access_profile_api(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        Sanctum::actingAs($admin, ['*'], 'web');

        $this->getJson('/api/v1/profile')->assertForbidden();
    }

    public function test_admin_can_access_admin_api_routes(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $this->actingAsAdmin($admin);

        $this->getJson('/api/v1/admin/categories')->assertOk();
    }

    public function test_admin_only_can_load_admin_session_after_login(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin, [
            'email' => 'ops@diyar.test',
            'password' => bcrypt('password'),
        ]);

        $this->postStatefulJson('/api/v1/admin/auth/login', [
            'method' => 'email',
            'identifier' => $admin->email,
            'password' => 'password',
        ])->assertOk();

        $this->getStatefulJson('/api/v1/admin/session')->assertOk();
    }

    public function test_vendor_cannot_access_admin_api(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        Sanctum::actingAs($vendor);

        $this->getJson('/api/v1/admin/categories')->assertUnauthorized();
    }

    public function test_dual_role_admin_vendor_can_access_marketplace_and_admin_api(): void
    {
        $user = $this->createUserWithRole(RoleName::Vendor);
        $this->attachRole($user, RoleName::Admin);
        $user = $user->fresh('roles');

        Sanctum::actingAs($user, ['*'], 'web');
        $this->actingAs($user, 'web');
        $this->actingAsAdmin($user);

        $this->getJson('/api/v1/dashboard/vendor/access')->assertOk();
        $this->getJson('/api/v1/admin/categories')->assertOk();
    }

    public function test_admin_only_login_does_not_authenticate_marketplace_session(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin, [
            'email' => 'ops@diyar.test',
            'password' => bcrypt('Password123!'),
        ]);

        $this->postStatefulJson('/api/v1/admin/auth/login', [
            'method' => 'email',
            'identifier' => $admin->email,
            'password' => 'Password123!',
        ])->assertOk();

        $this->getStatefulJson('/api/v1/admin/session')->assertOk();
        $this->getStatefulJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_marketplace_logout_does_not_invalidate_admin_session(): void
    {
        $user = $this->createUserWithRole(RoleName::Vendor, [
            'password' => bcrypt('Password123!'),
        ]);
        $this->attachRole($user, RoleName::Admin);
        $user = $user->fresh('roles');

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'email',
            'identifier' => $user->email,
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/admin/auth/login', [
            'method' => 'email',
            'identifier' => $user->email,
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/auth/logout')->assertOk();

        $this->getStatefulJson('/api/v1/admin/session')->assertOk();
    }

    public function test_admin_logout_does_not_invalidate_marketplace_session(): void
    {
        $user = $this->createUserWithRole(RoleName::Vendor, [
            'password' => bcrypt('Password123!'),
        ]);
        $this->attachRole($user, RoleName::Admin);
        $user = $user->fresh('roles');

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'email',
            'identifier' => $user->email,
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/admin/auth/login', [
            'method' => 'email',
            'identifier' => $user->email,
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/admin/auth/logout')->assertOk();

        $this->getStatefulJson('/api/v1/admin/session')->assertUnauthorized();
        $this->getStatefulJson('/api/v1/auth/me')->assertOk();
    }

    public function test_cross_context_sessions_remain_isolated(): void
    {
        $user = $this->createUserWithRole(RoleName::Vendor, [
            'email' => 'dual@diyar.test',
            'password' => 'Password123!',
        ]);
        $this->attachRole($user, RoleName::Admin);
        $user = $user->fresh('roles');

        $this->postStatefulJson('/api/v1/admin/auth/login', [
            'method' => 'email',
            'identifier' => $user->email,
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'email',
            'identifier' => $user->email,
            'password' => 'Password123!',
        ])->assertOk();

        $this->getStatefulJson('/api/v1/admin/session')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);

        $this->getStatefulJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);

        $this->postStatefulJson('/api/v1/auth/logout')->assertOk();

        $this->getStatefulJson('/api/v1/admin/session')->assertOk();
        $this->getStatefulJson('/api/v1/auth/me')->assertUnauthorized();

        $this->postStatefulJson('/api/v1/admin/auth/logout')->assertOk();

        $this->getStatefulJson('/api/v1/admin/session')->assertUnauthorized();
        $this->getStatefulJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_cross_context_sessions_remain_isolated_when_marketplace_logs_in_first(): void
    {
        $user = $this->createUserWithRole(RoleName::Vendor, [
            'email' => 'dual@diyar.test',
            'password' => 'Password123!',
        ]);
        $this->attachRole($user, RoleName::Admin);
        $user = $user->fresh('roles');

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'email',
            'identifier' => $user->email,
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/admin/auth/login', [
            'method' => 'email',
            'identifier' => $user->email,
            'password' => 'Password123!',
        ])->assertOk();

        $this->getStatefulJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);

        $this->getStatefulJson('/api/v1/admin/session')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);

        $this->postStatefulJson('/api/v1/admin/auth/logout')->assertOk();

        $this->getStatefulJson('/api/v1/auth/me')->assertOk();
        $this->getStatefulJson('/api/v1/admin/session')->assertUnauthorized();
    }

    public function test_admin_only_cannot_list_marketplace_orders(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        Sanctum::actingAs($admin, ['*'], 'web');

        $this->getJson('/api/v1/orders')->assertForbidden();
    }

    public function test_admin_only_cannot_preview_checkout(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        Sanctum::actingAs($admin, ['*'], 'web');

        $this->postJson('/api/v1/checkout/preview', [
            'shipping_address_id' => (string) str()->uuid(),
            'items' => [],
        ])->assertForbidden();
    }

    private function attachRole($user, RoleName $role): void
    {
        $this->seedRoles();
        $roleModel = Role::query()->where('name', $role->value)->firstOrFail();
        $user->roles()->attach($roleModel->id, [
            'id' => (string) str()->uuid(),
            'status' => RoleStatus::Active->value,
        ]);
    }
}
