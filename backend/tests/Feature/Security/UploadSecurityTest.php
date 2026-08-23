<?php

namespace Tests\Feature\Security;

use App\Enums\RoleName;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class UploadSecurityTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        Storage::fake('media');
        config(['diyar_media.disk' => 'media']);
    }

    public function test_avatar_upload_rejects_php_disguised_as_image(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $file = UploadedFile::fake()->create('avatar.php', 120, 'application/x-php');

        $this->actingAs($customer)
            ->post('/api/v1/profile/avatar', ['avatar' => $file])
            ->assertStatus(422);
    }

    public function test_avatar_upload_rejects_oversized_file(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $maxKb = (int) config('diyar_media.max_upload_kb', 5120);
        $file = UploadedFile::fake()->create('big.png', ($maxKb + 1), 'image/png');

        $this->actingAs($customer)
            ->post('/api/v1/profile/avatar', ['avatar' => $file])
            ->assertStatus(422);
    }

    public function test_vendor_logo_upload_requires_vendor_role(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $file = $this->fakePngUpload('logo.png');

        $this->actingAs($customer)
            ->post('/api/v1/dashboard/vendor/settings/logo', ['logo' => $file])
            ->assertForbidden();
    }

    public function test_vendor_can_upload_logo_with_valid_png(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $file = $this->fakePngUpload('logo.png');

        $this->actingAs($vendor)
            ->post('/api/v1/dashboard/vendor/settings/logo', ['logo' => $file])
            ->assertOk();
    }

    public function test_avatar_upload_rejects_png_mime_with_non_image_bytes(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $file = UploadedFile::fake()->createWithContent(
            'avatar.png',
            '<?php echo "x"; ?>',
            'image/png',
        );

        $this->actingAs($customer)
            ->post('/api/v1/profile/avatar', ['avatar' => $file])
            ->assertStatus(422);
    }

    private function fakePngUpload(string $name): UploadedFile
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

        return UploadedFile::fake()->createWithContent($name, (string) $png, 'image/png');
    }
}
