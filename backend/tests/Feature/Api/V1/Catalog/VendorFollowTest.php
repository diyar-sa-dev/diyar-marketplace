<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\RoleName;
use App\Models\VendorStoreFollow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class VendorFollowTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function customer_can_follow_and_unfollow_store(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $slug = $vendor->vendorAccount->slug;

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/vendors/{$slug}/follow")
            ->assertOk()
            ->assertJsonPath('data.follow.is_following', true)
            ->assertJsonPath('data.follow.followers_count', 1);

        $this->assertDatabaseHas('vendor_store_follows', [
            'user_id' => $customer->id,
            'vendor_account_id' => $vendor->vendorAccount->id,
        ]);

        $this->deleteJson("/api/v1/vendors/{$slug}/follow")
            ->assertOk()
            ->assertJsonPath('data.follow.is_following', false);

        $this->assertSame(0, VendorStoreFollow::query()->count());
    }

    #[Test]
    public function vendor_public_profile_includes_store_configuration(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $slug = $vendor->vendorAccount->slug;

        $vendor->vendorAccount->update([
            'description' => 'Configured store description',
            'location' => 'Jeddah',
        ]);

        $this->getJson("/api/v1/vendors/{$slug}")
            ->assertOk()
            ->assertJsonPath('data.vendor.description', 'Configured store description')
            ->assertJsonPath('data.vendor.location', 'Jeddah')
            ->assertJsonStructure([
                'data' => [
                    'vendor' => [
                        'products_count',
                        'followers_count',
                        'is_following',
                        'working_hours',
                        'return_policy_summary',
                        'shipping_summary',
                    ],
                ],
            ]);
    }
}
