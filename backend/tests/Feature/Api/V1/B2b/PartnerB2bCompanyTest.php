<?php

namespace Tests\Feature\Api\V1\B2b;

use App\Enums\RoleName;
use App\Models\B2bCategory;
use App\Models\B2bCompany;
use App\Models\B2bTag;
use Database\Seeders\AdminPermissionSeeder;
use Database\Seeders\B2bContentSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class PartnerB2bCompanyTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(AdminPermissionSeeder::class);
        $this->seed(B2bContentSeeder::class);
    }

    #[Test]
    public function vendor_can_create_and_update_linked_b2b_company(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $category = B2bCategory::query()->where('slug', 'furniture-manufacturing')->firstOrFail();

        $this->actingAs($vendor)
            ->getJson('/api/v1/dashboard/vendor/b2b/company')
            ->assertOk()
            ->assertJsonPath('data.company', null);

        $create = $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Vendor Linked B2B Co',
                'b2b_category_id' => $category->id,
                'description' => 'Wholesale furniture partner.',
                'location' => 'الرياض',
            ])
            ->assertCreated()
            ->assertJsonPath('data.company.name', 'Vendor Linked B2B Co')
            ->assertJsonPath('data.company.publication_status', 'draft')
            ->assertJsonPath('data.company.verification_status', 'pending');

        $companyId = $create->json('data.company.id');
        $company = B2bCompany::query()->findOrFail($companyId);

        $this->assertSame($vendor->id, $company->owner_user_id);
        $this->assertSame($vendor->vendorAccount->id, $company->vendor_account_id);
        $this->assertNull($company->provider_account_id);

        $this->getJson('/api/v1/b2b/companies/'.$company->slug)->assertNotFound();

        $this->actingAs($vendor)
            ->patchJson('/api/v1/dashboard/vendor/b2b/company', [
                'description' => 'Updated wholesale profile.',
            ])
            ->assertOk()
            ->assertJsonPath('data.company.description', 'Updated wholesale profile.');

        $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Duplicate attempt',
            ])
            ->assertStatus(409);
    }

    #[Test]
    public function provider_can_create_linked_b2b_company(): void
    {
        $provider = $this->createUserWithRole(RoleName::Provider);
        $category = B2bCategory::query()->where('slug', 'interior-design')->firstOrFail();

        $this->actingAs($provider)
            ->postJson('/api/v1/dashboard/provider/b2b/company', [
                'name' => 'Provider Linked B2B Co',
                'b2b_category_id' => $category->id,
                'description' => 'Design studio profile.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.company.name', 'Provider Linked B2B Co');

        $company = B2bCompany::query()->where('name', 'Provider Linked B2B Co')->firstOrFail();
        $this->assertSame($provider->id, $company->owner_user_id);
        $this->assertSame($provider->providerAccount->id, $company->provider_account_id);
        $this->assertNull($company->vendor_account_id);
    }

    #[Test]
    public function customer_and_marketer_cannot_access_partner_b2b_routes(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $marketer = $this->createUserWithRole(RoleName::Marketer);

        $this->actingAs($customer)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', ['name' => 'Blocked'])
            ->assertForbidden();

        $this->actingAs($marketer)
            ->postJson('/api/v1/dashboard/provider/b2b/company', ['name' => 'Blocked'])
            ->assertForbidden();
    }

    #[Test]
    public function vendor_cannot_manage_another_vendors_b2b_company(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $intruder = $this->createUserWithRole(RoleName::Vendor);

        $this->actingAs($owner)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Owner Company',
            ])
            ->assertCreated();

        $this->actingAs($intruder)
            ->patchJson('/api/v1/dashboard/vendor/b2b/company', [
                'description' => 'Hijack attempt',
            ])
            ->assertNotFound();
    }

    #[Test]
    public function vendor_can_upload_and_delete_portfolio_images(): void
    {
        Storage::fake('public');
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company', [
                'name' => 'Portfolio Vendor Co',
            ])
            ->assertCreated();

        $upload = $this->actingAs($vendor)
            ->postJson('/api/v1/dashboard/vendor/b2b/company/portfolio', [
                'image' => $this->fakePngUpload('work-1.png'),
            ])
            ->assertOk()
            ->assertJsonPath('data.company.portfolio_gallery.0.url', fn ($url) => is_string($url) && $url !== '');

        $imageId = $upload->json('data.company.portfolio_gallery.0.id');
        $this->assertNotEmpty($imageId);

        $this->actingAs($vendor)
            ->deleteJson('/api/v1/dashboard/vendor/b2b/company/portfolio/'.$imageId)
            ->assertOk()
            ->assertJsonPath('data.company.portfolio_gallery', []);
    }

    private function fakePngUpload(string $name): UploadedFile
    {
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        );

        return UploadedFile::fake()->createWithContent($name, (string) $png, 'image/png');
    }

    #[Test]
    public function provider_can_sync_tags_and_custom_tag_names(): void
    {
        $provider = $this->createUserWithRole(RoleName::Provider);

        $this->actingAs($provider)
            ->postJson('/api/v1/dashboard/provider/b2b/company', [
                'name' => 'Tagged Provider Co',
                'custom_category' => 'ويب',
                'tag_names' => ['تطوير ويب'],
            ])
            ->assertCreated()
            ->assertJsonPath('data.company.custom_category', 'ويب');

        $presetTag = B2bTag::query()->where('slug', 'sofa')->firstOrFail();

        $this->actingAs($provider)
            ->patchJson('/api/v1/dashboard/provider/b2b/company', [
                'tag_ids' => [$presetTag->id],
                'tag_names' => ['تطوير ويب'],
            ])
            ->assertOk()
            ->assertJsonCount(2, 'data.company.tags');

        $this->actingAs($provider)
            ->getJson('/api/v1/dashboard/provider/b2b/tags')
            ->assertOk()
            ->assertJsonStructure(['data' => ['tags' => [['id', 'slug', 'name']]]]);
    }
}
