<?php

namespace Tests\Feature\Api\V1\Profile;

use App\Enums\RoleName;
use App\Models\Address;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AddressTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_authenticated_user_can_list_addresses(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        Address::factory()->count(2)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/profile/addresses');

        $response->assertOk()->assertJsonCount(2, 'data.addresses');
    }

    public function test_authenticated_user_can_create_address(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);

        $response = $this->actingAs($user)->postJson('/api/v1/profile/addresses', [
            'label' => 'المنزل',
            'type' => 'home',
            'recipient_name' => 'Yacine Kermame',
            'phone' => '577777777',
            'city' => 'الرياض',
            'district' => 'حي الياسمين',
            'street' => 'شارع العليا',
            'building' => '12',
            'apartment' => '4',
            'is_default' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.address.is_default', true);

        $this->assertDatabaseHas('addresses', [
            'user_id' => $user->id,
            'label' => 'المنزل',
            'is_default' => true,
        ]);
    }

    public function test_only_one_default_address_is_kept(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $first = Address::factory()->default()->create(['user_id' => $user->id]);
        $second = Address::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->postJson('/api/v1/profile/addresses/'.$second->id.'/default')
            ->assertOk();

        $this->assertFalse($first->fresh()->is_default);
        $this->assertTrue($second->fresh()->is_default);
    }

    public function test_user_can_update_own_address(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $address = Address::factory()->create(['user_id' => $user->id, 'label' => 'Old Label']);

        $this->actingAs($user)->patchJson('/api/v1/profile/addresses/'.$address->id, [
            'label' => 'New Label',
        ])->assertOk()->assertJsonPath('data.address.label', 'New Label');
    }

    public function test_user_can_delete_own_address(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $address = Address::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->deleteJson('/api/v1/profile/addresses/'.$address->id)
            ->assertOk();

        $this->assertDatabaseMissing('addresses', ['id' => $address->id]);
    }

    public function test_idor_access_to_other_users_address_is_forbidden(): void
    {
        $owner = $this->createUserWithRole(RoleName::Customer);
        $intruder = $this->createUserWithRole(RoleName::Customer);
        $address = Address::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($intruder)->getJson('/api/v1/profile/addresses/'.$address->id)
            ->assertForbidden();

        $this->actingAs($intruder)->patchJson('/api/v1/profile/addresses/'.$address->id, [
            'label' => 'Hacked',
        ])->assertForbidden();

        $this->actingAs($intruder)->deleteJson('/api/v1/profile/addresses/'.$address->id)
            ->assertForbidden();

        $this->actingAs($intruder)->postJson('/api/v1/profile/addresses/'.$address->id.'/default')
            ->assertForbidden();
    }

    public function test_create_with_is_default_clears_previous_default(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $first = Address::factory()->default()->create(['user_id' => $user->id]);

        $this->actingAs($user)->postJson('/api/v1/profile/addresses', [
            'label' => 'Work',
            'type' => 'work',
            'recipient_name' => 'Yacine Kermame',
            'phone' => '577777777',
            'is_default' => true,
        ])->assertCreated();

        $this->assertFalse($first->fresh()->is_default);
        $this->assertSame(1, Address::query()->where('user_id', $user->id)->where('is_default', true)->count());
    }

    public function test_create_address_rejects_foreign_user_id(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $other = $this->createUserWithRole(RoleName::Customer);

        $this->actingAs($user)->postJson('/api/v1/profile/addresses', [
            'label' => 'Home',
            'type' => 'home',
            'recipient_name' => 'Yacine Kermame',
            'phone' => '577777777',
            'user_id' => $other->id,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);

        $this->assertDatabaseCount('addresses', 0);
    }

    public function test_unauthenticated_access_is_rejected(): void
    {
        $this->getJson('/api/v1/profile/addresses')->assertUnauthorized();
    }
}
