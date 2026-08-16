<?php

namespace Tests\Feature\Api\V1\Profile;

use App\Enums\RoleName;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class PhoneChangeTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_profile_patch_cannot_change_phone_directly(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966502222222',
        ]);

        $this->actingAs($user)->patchJson('/api/v1/profile', [
            'phone' => '501111111',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['phone']);

        $this->assertSame('966502222222', $user->fresh()->phone);
    }

    public function test_authenticated_user_can_change_phone_with_otp(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966502222222',
        ]);

        $this->actingAs($user)->postJson('/api/v1/profile/phone/request-change', [
            'phone' => '503333333',
        ])->assertOk();

        $otp = $this->extractOtpFromLastSms();

        $response = $this->actingAs($user)->postJson('/api/v1/profile/phone/verify-change', [
            'phone' => '503333333',
            'code' => $otp,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.profile.phone', '966503333333');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'phone' => '966503333333',
        ]);
        $this->assertNotNull($user->fresh()->phone_verified_at);
    }

    public function test_phone_change_rejects_taken_number(): void
    {
        $this->createUserWithRole(RoleName::Customer, ['phone' => '966501111111']);
        $user = $this->createUserWithRole(RoleName::Customer, ['phone' => '966502222222']);

        $this->actingAs($user)->postJson('/api/v1/profile/phone/request-change', [
            'phone' => '501111111',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_phone_change_rejects_same_number(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, ['phone' => '966502222222']);

        $this->actingAs($user)->postJson('/api/v1/profile/phone/request-change', [
            'phone' => '502222222',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_unauthenticated_phone_change_is_rejected(): void
    {
        $this->postJson('/api/v1/profile/phone/request-change', [
            'phone' => '503333333',
        ])->assertUnauthorized();
    }

    public function test_invalid_otp_is_rejected_on_phone_change(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966502222222',
        ]);

        $this->actingAs($user)->postJson('/api/v1/profile/phone/request-change', [
            'phone' => '503333333',
        ])->assertOk();

        $this->actingAs($user)->postJson('/api/v1/profile/phone/verify-change', [
            'phone' => '503333333',
            'code' => '000000',
        ])->assertUnprocessable();

        $this->assertSame('966502222222', $user->fresh()->phone);
    }
}
