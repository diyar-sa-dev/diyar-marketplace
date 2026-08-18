<?php

namespace Tests\Feature\Api\V1\Dashboard;

use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\VendorAccountStatus;
use App\Enums\VendorTeamRole;
use App\Enums\VendorTeamStatus;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorTeamMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class VendorTeamTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function owner_can_list_team_invite_and_manage_members(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $manager = User::factory()->create(['email' => 'manager@example.com']);

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/dashboard/vendor/access')
            ->assertOk()
            ->assertJsonPath('data.access.role', 'owner')
            ->assertJsonPath('data.access.permissions.team', true);

        $this->getJson('/api/v1/dashboard/vendor/team')
            ->assertOk()
            ->assertJsonPath('data.items.0.role', 'owner');

        $this->postJson('/api/v1/dashboard/vendor/team/invite', [
            'email' => 'manager@example.com',
            'role' => VendorTeamRole::Manager->value,
        ])
            ->assertCreated()
            ->assertJsonPath('data.member.email', 'manager@example.com')
            ->assertJsonPath('data.member.role', VendorTeamRole::Manager->value);

        $member = VendorTeamMember::query()->where('email', 'manager@example.com')->firstOrFail();

        $this->patchJson("/api/v1/dashboard/vendor/team/{$member->id}", [
            'role' => VendorTeamRole::CustomerService->value,
        ])
            ->assertOk()
            ->assertJsonPath('data.member.role', VendorTeamRole::CustomerService->value);

        $this->deleteJson("/api/v1/dashboard/vendor/team/{$member->id}")
            ->assertOk();

        $this->postJson('/api/v1/dashboard/vendor/team/invite', [
            'email' => 'manager@example.com',
            'role' => VendorTeamRole::Manager->value,
        ])
            ->assertCreated()
            ->assertJsonPath('data.member.email', 'manager@example.com')
            ->assertJsonPath('data.member.status', VendorTeamStatus::Invited->value);
    }

    #[Test]
    public function owner_can_reinvite_after_cancelling_invite(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/dashboard/vendor/team/invite', [
            'email' => 'reinvite@example.com',
            'role' => VendorTeamRole::Manager->value,
        ])->assertCreated();

        $member = VendorTeamMember::query()->where('email', 'reinvite@example.com')->firstOrFail();
        $this->deleteJson("/api/v1/dashboard/vendor/team/{$member->id}")->assertOk();

        $this->postJson('/api/v1/dashboard/vendor/team/invite', [
            'email' => 'reinvite@example.com',
            'role' => VendorTeamRole::CustomerService->value,
        ])
            ->assertCreated()
            ->assertJsonPath('data.member.role', VendorTeamRole::CustomerService->value);
    }

    #[Test]
    public function invited_user_can_accept_or_reject_team_invite(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $invitee = User::factory()->create(['email' => 'invitee@example.com']);

        Sanctum::actingAs($owner);
        $this->postJson('/api/v1/dashboard/vendor/team/invite', [
            'email' => 'invitee@example.com',
            'role' => VendorTeamRole::Manager->value,
        ])->assertCreated()
            ->assertJsonPath('data.member.status', VendorTeamStatus::Invited->value);

        $member = VendorTeamMember::query()->where('email', 'invitee@example.com')->firstOrFail();
        $token = $member->invite_token;
        $this->assertNotNull($token);

        Sanctum::actingAs($invitee);
        $this->getJson("/api/v1/team-invites/{$token}")
            ->assertOk()
            ->assertJsonPath('data.invite.status', 'pending')
            ->assertJsonPath('data.invite.role', VendorTeamRole::Manager->value);

        $acceptResponse = $this->postJson("/api/v1/team-invites/{$token}/accept");
        $acceptResponse
            ->assertOk()
            ->assertJsonPath('data.member.status', VendorTeamStatus::Active->value);

        $this->assertTrue($invitee->fresh()->hasRole(RoleName::Vendor));

        $membership = VendorTeamMember::query()->where('email', 'invitee@example.com')->firstOrFail();
        $this->assertTrue($membership->vendor_role_granted);

        $this->getJson('/api/v1/dashboard/vendor/access')
            ->assertOk()
            ->assertJsonPath('data.access.role', 'manager');
    }

    #[Test]
    public function invited_user_can_reject_team_invite(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $invitee = User::factory()->create(['email' => 'reject@example.com']);

        Sanctum::actingAs($owner);
        $this->postJson('/api/v1/dashboard/vendor/team/invite', [
            'email' => 'reject@example.com',
            'role' => VendorTeamRole::CustomerService->value,
        ])->assertCreated();

        $token = VendorTeamMember::query()->where('email', 'reject@example.com')->value('invite_token');

        Sanctum::actingAs($invitee);
        $this->postJson("/api/v1/team-invites/{$token}/reject")->assertOk();

        $this->getJson("/api/v1/team-invites/{$token}")
            ->assertOk()
            ->assertJsonPath('data.invite.status', 'rejected');
    }

    #[Test]
    public function manager_can_access_dashboard_and_finance_but_not_settings_or_team(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $manager = User::factory()->create(['email' => 'manager@example.com']);
        $this->attachTeamMember($owner, $manager, VendorTeamRole::Manager);

        Sanctum::actingAs($manager);

        $this->getJson('/api/v1/dashboard/vendor/access')
            ->assertOk()
            ->assertJsonPath('data.access.role', 'manager')
            ->assertJsonPath('data.access.permissions.settings', false)
            ->assertJsonPath('data.access.permissions.products_delete', false)
            ->assertJsonPath('data.access.permissions.finance_withdraw', false);

        $this->getJson('/api/v1/dashboard/vendor/overview')
            ->assertOk();

        $this->getJson('/api/v1/dashboard/vendor/finance/summary')
            ->assertOk();

        $this->getJson('/api/v1/dashboard/vendor/settings')
            ->assertForbidden();

        $this->getJson('/api/v1/dashboard/vendor/team')
            ->assertForbidden();

        $this->postJson('/api/v1/dashboard/vendor/finance/payouts', ['amount' => '10.00'])
            ->assertForbidden();
    }

    #[Test]
    public function customer_service_can_view_reviews_but_not_finance(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $agent = User::factory()->create(['email' => 'agent@example.com']);
        $this->attachTeamMember($owner, $agent, VendorTeamRole::CustomerService);

        Sanctum::actingAs($agent);

        $this->getJson('/api/v1/dashboard/vendor/access')
            ->assertOk()
            ->assertJsonPath('data.access.role', 'customer_service')
            ->assertJsonPath('data.access.permissions.reviews', 'reply');

        $this->getJson('/api/v1/dashboard/vendor/reviews/inbox')
            ->assertOk();

        $this->getJson('/api/v1/dashboard/vendor/finance/summary')
            ->assertForbidden();
    }

    #[Test]
    public function manager_can_update_but_not_delete_products(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $manager = User::factory()->create(['email' => 'product-manager@example.com']);
        $this->attachTeamMember($owner, $manager, VendorTeamRole::Manager);
        $product = Product::factory()->create([
            'vendor_account_id' => $owner->vendorAccount->id,
        ]);

        Sanctum::actingAs($manager);

        $this->patchJson('/api/v1/dashboard/vendor/products/'.$product->id, [
            'name' => 'Updated by manager',
        ])->assertOk()
            ->assertJsonPath('data.product.name', 'Updated by manager');

        $this->deleteJson('/api/v1/dashboard/vendor/products/'.$product->id)
            ->assertForbidden();
    }

    #[Test]
    public function customer_service_cannot_modify_products_or_orders(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $agent = User::factory()->create(['email' => 'readonly-agent@example.com']);
        $this->attachTeamMember($owner, $agent, VendorTeamRole::CustomerService);
        $product = Product::factory()->create([
            'vendor_account_id' => $owner->vendorAccount->id,
        ]);

        Sanctum::actingAs($agent);

        $this->getJson('/api/v1/dashboard/vendor/access')
            ->assertOk()
            ->assertJsonPath('data.access.permissions.products', 'read')
            ->assertJsonPath('data.access.permissions.products_delete', false)
            ->assertJsonPath('data.access.permissions.orders', 'read');

        $this->getJson('/api/v1/dashboard/vendor/products/'.$product->id)
            ->assertOk()
            ->assertJsonPath('data.product.id', $product->id);

        $this->patchJson('/api/v1/dashboard/vendor/products/'.$product->id, [
            'name' => 'Blocked update',
        ])->assertForbidden();

        $this->deleteJson('/api/v1/dashboard/vendor/products/'.$product->id)
            ->assertForbidden();
    }

    #[Test]
    public function downgraded_member_receives_updated_permissions(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $member = User::factory()->create(['email' => 'downgrade@example.com']);
        $teamMember = $this->attachTeamMember($owner, $member, VendorTeamRole::Manager);

        Sanctum::actingAs($member);
        $this->getJson('/api/v1/dashboard/vendor/access')
            ->assertOk()
            ->assertJsonPath('data.access.permissions.products', 'write')
            ->assertJsonPath('data.access.permissions.products_delete', false);

        Sanctum::actingAs($owner);
        $this->patchJson("/api/v1/dashboard/vendor/team/{$teamMember->id}", [
            'role' => VendorTeamRole::CustomerService->value,
        ])->assertOk();

        Sanctum::actingAs($member);
        $this->getJson('/api/v1/dashboard/vendor/access')
            ->assertOk()
            ->assertJsonPath('data.access.role', 'customer_service')
            ->assertJsonPath('data.access.permissions.products', 'read')
            ->assertJsonPath('data.access.permissions.orders', 'read');
    }

    #[Test]
    public function removing_active_member_revokes_team_granted_vendor_role(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer, ['email' => 'team-only@example.com']);
        $teamMember = $this->attachTeamMember($owner, $customer, VendorTeamRole::Manager);

        $this->assertTrue($customer->fresh()->hasRole(RoleName::Vendor));
        $this->assertTrue($customer->fresh()->hasRole(RoleName::Customer));

        Sanctum::actingAs($owner);
        $this->deleteJson("/api/v1/dashboard/vendor/team/{$teamMember->id}")
            ->assertOk()
            ->assertJsonPath('message', __('diyar.vendor.team.removed'));

        $customer->refresh();
        $this->assertFalse($customer->hasRole(RoleName::Vendor));
        $this->assertTrue($customer->hasRole(RoleName::Customer));
        $this->assertSame(VendorTeamStatus::Removed, $teamMember->fresh()->status);
    }

    #[Test]
    public function removing_from_one_store_keeps_vendor_role_when_still_active_elsewhere(): void
    {
        $ownerA = $this->createUserWithRole(RoleName::Vendor, ['email' => 'owner-a@example.com']);
        $ownerB = $this->createUserWithRole(RoleName::Vendor, ['email' => 'owner-b@example.com']);
        $member = $this->createUserWithRole(RoleName::Customer, ['email' => 'multi-team@example.com']);

        $membershipA = $this->attachTeamMember($ownerA, $member, VendorTeamRole::Manager);
        $this->attachTeamMember($ownerB, $member, VendorTeamRole::CustomerService);

        Sanctum::actingAs($ownerA);
        $this->deleteJson("/api/v1/dashboard/vendor/team/{$membershipA->id}")->assertOk();

        $member->refresh();
        $member->load('roles');
        $this->assertTrue($member->hasRole(RoleName::Vendor));
        Sanctum::actingAs($member);
        $this->getJson('/api/v1/dashboard/vendor/access')->assertOk();
    }

    #[Test]
    public function intrinsic_vendor_role_is_preserved_when_removed_from_team(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $member = $this->createUserWithRole(RoleName::Customer, ['email' => 'intrinsic-vendor@example.com']);

        // Simulates a user who registered as vendor (has their own store account).
        $vendorRole = Role::query()->where('name', RoleName::Vendor->value)->firstOrFail();
        $member->roles()->attach($vendorRole->id, [
            'id' => (string) str()->uuid(),
            'status' => RoleStatus::Active->value,
        ]);
        VendorAccount::query()->create([
            'user_id' => $member->id,
            'business_name' => $member->name,
            'slug' => 'intrinsic-vendor-store',
            'status' => VendorAccountStatus::Active,
        ]);

        $teamMember = VendorTeamMember::query()->create([
            'vendor_account_id' => $owner->vendorAccount->id,
            'user_id' => $member->id,
            'email' => strtolower($member->email),
            'role' => VendorTeamRole::CustomerService,
            'status' => VendorTeamStatus::Active,
            'invited_at' => now(),
            'accepted_at' => now(),
            'vendor_role_granted' => false,
            'invited_by_user_id' => $owner->id,
        ]);

        Sanctum::actingAs($owner);
        $this->deleteJson("/api/v1/dashboard/vendor/team/{$teamMember->id}")->assertOk();

        $this->assertTrue($member->fresh()->hasRole(RoleName::Vendor));
        $this->assertTrue($member->fresh()->hasRole(RoleName::Customer));
    }

    private function attachTeamMember(User $owner, User $member, VendorTeamRole $role): VendorTeamMember
    {
        $this->seedRoles();
        $vendorRole = Role::query()->where('name', RoleName::Vendor->value)->firstOrFail();

        if (! $member->roles()->where('roles.id', $vendorRole->id)->exists()) {
            $member->roles()->attach($vendorRole->id, [
                'id' => (string) str()->uuid(),
                'status' => RoleStatus::Active->value,
            ]);
        }

        $vendorAccount = $owner->vendorAccount()->firstOrFail();

        return VendorTeamMember::query()->create([
            'vendor_account_id' => $vendorAccount->id,
            'user_id' => $member->id,
            'email' => strtolower($member->email),
            'role' => $role,
            'status' => VendorTeamStatus::Active,
            'invited_at' => now(),
            'accepted_at' => now(),
            'vendor_role_granted' => true,
            'invited_by_user_id' => $owner->id,
        ]);
    }
}
