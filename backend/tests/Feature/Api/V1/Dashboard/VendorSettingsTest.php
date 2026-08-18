<?php

namespace Tests\Feature\Api\V1\Dashboard;

use App\Enums\RoleName;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class VendorSettingsTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function vendor_can_view_and_update_store_settings(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->getJsonAsUser('/api/v1/dashboard/vendor/settings', $vendor)
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'settings' => [
                        'business_name',
                        'slug',
                        'store_domain',
                        'description',
                        'logo_url',
                        'cover_url',
                        'payout_schedule',
                    ],
                ],
            ]);

        Sanctum::actingAs($vendor);

        $this->patchJson('/api/v1/dashboard/vendor/settings', [
            'business_name' => 'Al Rawaea Furniture',
            'slug' => 'alrawaea',
            'description' => 'Premium furniture store.',
            'location' => 'Riyadh',
            'support_phone' => '+966501234567',
            'support_email' => 'support@alrawaea.test',
        ])
            ->assertOk()
            ->assertJsonPath('data.settings.business_name', 'Al Rawaea Furniture')
            ->assertJsonPath('data.settings.slug', 'alrawaea')
            ->assertJsonPath('data.settings.description', 'Premium furniture store.');
    }

    #[Test]
    public function vendor_slug_must_be_unique_and_valid(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        Sanctum::actingAs($vendorA);
        $this->patchJson('/api/v1/dashboard/vendor/settings', ['slug' => 'shared-slug'])->assertOk();

        Sanctum::actingAs($vendorB);
        $this->patchJson('/api/v1/dashboard/vendor/settings', ['slug' => 'shared-slug'])->assertStatus(422);

        Sanctum::actingAs($vendorA);
        $this->patchJson('/api/v1/dashboard/vendor/settings', ['slug' => 'Invalid Slug!'])->assertStatus(422);
    }

    #[Test]
    public function vendor_can_manage_logo_cover_legal_and_bank_account(): void
    {
        Storage::fake('media');
        config(['diyar_media.disk' => 'media']);

        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $this->actingAs($vendor);

        $logo = $this->fakePngUpload('logo.png');
        $cover = $this->fakePngUpload('cover.png');

        $this->post('/api/v1/dashboard/vendor/settings/logo', ['logo' => $logo])->assertOk();
        $this->post('/api/v1/dashboard/vendor/settings/cover', ['cover' => $cover])->assertOk();

        $this->putJson('/api/v1/dashboard/vendor/settings/legal', [
            'entity_type' => 'sole_proprietorship',
            'commercial_registration_number' => '1010123456',
            'tax_number' => '310123456700003',
        ])->assertOk()
            ->assertJsonPath('data.settings.legal_profile.commercial_registration_number', '1010123456');

        $this->putJson('/api/v1/dashboard/vendor/settings/bank-account', [
            'bank_code' => 'snb',
            'beneficiary_name' => 'Al Rawaea Trading',
            'iban' => 'SA0380000000608010167519',
        ])->assertOk()
            ->assertJsonPath('data.settings.bank_account.bank_code', 'snb')
            ->assertJsonPath('data.settings.bank_account.iban_last4', '7519');

        $this->deleteJson('/api/v1/dashboard/vendor/settings/logo')->assertOk();
        $this->deleteJson('/api/v1/dashboard/vendor/settings/cover')->assertOk();
    }

    #[Test]
    public function vendor_bank_account_rejects_invalid_iban(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        Sanctum::actingAs($vendor);

        $this->putJson('/api/v1/dashboard/vendor/settings/bank-account', [
            'bank_code' => 'snb',
            'beneficiary_name' => 'Test Vendor',
            'iban' => 'SA0000000000000000000000',
        ])->assertStatus(422);
    }

    #[Test]
    public function vendor_can_save_working_hours(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        Sanctum::actingAs($vendor);

        $hours = [
            ['day' => 'saturday', 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '22:00'],
            ['day' => 'sunday', 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '22:00'],
            ['day' => 'monday', 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '22:00'],
            ['day' => 'tuesday', 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '22:00'],
            ['day' => 'wednesday', 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '22:00'],
            ['day' => 'thursday', 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '22:00'],
            ['day' => 'friday', 'is_closed' => false, 'opens_at' => '16:00', 'closes_at' => '22:00'],
        ];

        $this->putJson('/api/v1/dashboard/vendor/settings/working-hours', ['hours' => $hours])
            ->assertOk()
            ->assertJsonCount(7, 'data.settings.working_hours');
    }

    private function fakePngUpload(string $name): UploadedFile
    {
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            true,
        );

        return UploadedFile::fake()->createWithContent($name, (string) $png, 'image/png');
    }
}
