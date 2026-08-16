<?php

namespace Tests\Feature\Api\V1\Profile;

use App\Enums\RoleName;
use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('media');
    }

    public function test_authenticated_user_can_view_profile(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);

        $response = $this->actingAs($user)->getJson('/api/v1/profile');

        $response->assertOk()
            ->assertJsonPath('data.profile.id', $user->id)
            ->assertJsonPath('data.profile.name', $user->name);
    }

    public function test_unauthenticated_user_cannot_view_profile(): void
    {
        $this->getJson('/api/v1/profile')->assertUnauthorized();
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'old@example.com',
        ]);

        $response = $this->actingAs($user)->patchJson('/api/v1/profile', [
            'name' => 'Updated Name',
            'email' => 'new@example.com',
            'bio' => 'Hello DIYAR',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.profile.name', 'Updated Name')
            ->assertJsonPath('data.profile.email', 'new@example.com')
            ->assertJsonPath('data.profile.bio', 'Hello DIYAR');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => 'new@example.com',
        ]);
    }

    public function test_user_can_keep_own_email_without_duplicate_error(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'same@example.com',
        ]);

        $this->actingAs($user)->patchJson('/api/v1/profile', [
            'email' => 'same@example.com',
            'name' => 'Same Email User',
        ])->assertOk();
    }

    public function test_duplicate_email_is_rejected(): void
    {
        $existing = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'taken@example.com',
        ]);
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'mine@example.com',
        ]);

        $this->actingAs($user)->patchJson('/api/v1/profile', [
            'email' => 'taken@example.com',
        ])->assertUnprocessable();
    }

    public function test_authenticated_user_can_update_password(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'password' => Hash::make('OldPassword123!'),
        ]);

        $this->actingAs($user)->patchJson('/api/v1/profile/password', [
            'current_password' => 'OldPassword123!',
            'new_password' => 'NewPassword123!',
            'new_password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123!', $user->password));
    }

    public function test_invalid_current_password_is_rejected(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'password' => Hash::make('OldPassword123!'),
        ]);

        $this->actingAs($user)->patchJson('/api/v1/profile/password', [
            'current_password' => 'WrongPassword123!',
            'new_password' => 'NewPassword123!',
            'new_password_confirmation' => 'NewPassword123!',
        ])->assertUnprocessable();
    }

    private function fakePngUpload(string $name = 'avatar.png'): UploadedFile
    {
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            true,
        );

        return UploadedFile::fake()->createWithContent($name, (string) $png, 'image/png');
    }

    public function test_valid_avatar_upload_is_accepted(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $file = $this->fakePngUpload('avatar.png');

        $response = $this->actingAs($user)->post('/api/v1/profile/avatar', [
            'avatar' => $file,
        ], ['Accept' => 'application/json']);

        $response->assertOk()->assertJsonPath('data.profile.avatar_url', fn ($url) => is_string($url) && $url !== '');
        $this->assertNotNull($user->fresh()->avatar_path);
    }

    public function test_invalid_avatar_mime_is_rejected(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $file = UploadedFile::fake()->create('script.php', 100, 'application/x-php');

        $this->actingAs($user)->post('/api/v1/profile/avatar', [
            'avatar' => $file,
        ], ['Accept' => 'application/json'])->assertUnprocessable();
    }

    public function test_avatar_can_be_deleted(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $file = $this->fakePngUpload('avatar.png');

        $this->actingAs($user)->post('/api/v1/profile/avatar', [
            'avatar' => $file,
        ], ['Accept' => 'application/json'])->assertOk();

        $this->actingAs($user)->deleteJson('/api/v1/profile/avatar')
            ->assertOk()
            ->assertJsonPath('data.profile.avatar_url', null);

        $this->assertNull($user->fresh()->avatar_path);
    }

    public function test_profile_patch_ignores_prohibited_fields(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966502222222',
            'password' => Hash::make('OldPassword123!'),
        ]);

        $this->actingAs($user)->patchJson('/api/v1/profile', [
            'name' => 'Safe Name',
            'phone' => '501111111',
            'password' => 'HackedPassword123!',
            'status' => 'suspended',
            'avatar_path' => 'users/evil/avatar.png',
            'phone_verified_at' => now()->toIso8601String(),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['phone', 'password', 'status', 'avatar_path', 'phone_verified_at']);

        $fresh = $user->fresh();
        $this->assertSame('966502222222', $fresh->phone);
        $this->assertTrue(Hash::check('OldPassword123!', $fresh->password));
        $this->assertNull($fresh->avatar_path);
    }
}
