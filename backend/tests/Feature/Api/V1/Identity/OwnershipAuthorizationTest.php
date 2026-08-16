<?php

namespace Tests\Feature\Api\V1\Identity;

use App\Enums\RoleName;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class OwnershipAuthorizationTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_vendor_can_view_own_account(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $account = $vendor->vendorAccount;

        $this->actingAs($vendor, 'web')
            ->getJson('/api/v1/vendor/accounts/'.$account->id)
            ->assertOk()
            ->assertJsonPath('data.account.id', $account->id);
    }

    public function test_vendor_cannot_view_another_vendor_account(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor, ['phone' => '966501010101']);
        $vendorB = $this->createUserWithRole(RoleName::Vendor, ['phone' => '966501010102']);

        $this->actingAs($vendorA, 'web')
            ->getJson('/api/v1/vendor/accounts/'.$vendorB->vendorAccount->id)
            ->assertForbidden();
    }

    public function test_provider_can_view_own_account(): void
    {
        $provider = $this->createUserWithRole(RoleName::Provider);
        $account = $provider->providerAccount;

        $this->actingAs($provider, 'web')
            ->getJson('/api/v1/provider/accounts/'.$account->id)
            ->assertOk();
    }

    public function test_provider_cannot_view_another_provider_account(): void
    {
        $providerA = $this->createUserWithRole(RoleName::Provider, ['phone' => '966502020201']);
        $providerB = $this->createUserWithRole(RoleName::Provider, ['phone' => '966502020202']);

        $this->actingAs($providerA, 'web')
            ->getJson('/api/v1/provider/accounts/'.$providerB->providerAccount->id)
            ->assertForbidden();
    }

    public function test_customer_cannot_access_vendor_account(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor, ['phone' => '966503030303']);

        $this->actingAs($customer, 'web')
            ->getJson('/api/v1/vendor/accounts/'.$vendor->vendorAccount->id)
            ->assertForbidden();
    }

    public function test_admin_can_view_any_vendor_account(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin, ['phone' => '966504040404']);
        $vendor = $this->createUserWithRole(RoleName::Vendor, ['phone' => '966504040405']);

        $this->actingAs($admin, 'web')
            ->getJson('/api/v1/vendor/accounts/'.$vendor->vendorAccount->id)
            ->assertOk();
    }

    public function test_unauthenticated_access_returns_401(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->getJson('/api/v1/vendor/accounts/'.$vendor->vendorAccount->id)
            ->assertUnauthorized();
    }
}
